// payment-processor.ts
import { ethers } from 'ethers';
import { TronWeb } from 'tronweb';
import { In, Repository } from 'typeorm';
import { AddressMapping, Payment } from '../entities';
import { Inject, Service } from 'typedi';
import { SupportedCryptoCurrencies, SupportedCurrencies, SupportedFiatCurrencies } from '../enums';
import { CurrencyService } from './currency.service';
import logger from '../utils/logger';

interface IConfig {
    ethereum: {
        hdMnemonic: string;
        rpcUrl: string;
        wsUrl: string;
        basePath?: string;
        mainWalletAddress: string;
        usdtContractAddress: string;
    };
    tron: {
        hdMnemonic: string;
        fullHost: string;
        basePath?: string;
        mainWalletAddress: string;
        usdtContractAddress: string;
    };
}

async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Example: 1 ETH = 2000 USDT (replace with real API call)
    const rates: Record<string, number> = {
        'ETH:USDT-ERC20': 2000,
        'USDT-ERC20:ETH': 0.0005,
        'TRX:USDT-TRC20': 0.15,
        'USDT-TRC20:TRX': 6.67,
        'USD:ETH': 0.0005,
        'ETH:USD': 2000,
        'TRX:USDT': 0.23,
        'USDT:TRX': 4.32,
        'USD:TRX': 4.32,
        'TRX:USD': 0.23,
    };
    return rates[`${fromCurrency}:${toCurrency}`] || 1;
}

interface CryptoPaymentProcessor {
    generatePaymentWallet(
        payment: Payment
    ): Promise<{
        address: string
        amount: string
        currency: SupportedCurrencies
        instructions: string
    }>
    estimateGasFee(currency: SupportedCurrencies): Promise<number>
    isSupportedCurrency(currency: SupportedCurrencies): boolean
}


class EthereumPaymentProcessor implements CryptoPaymentProcessor {
    private config: IConfig;
    private ethProvider: ethers.JsonRpcProvider;
    private ethWsProvider: ethers.WebSocketProvider;
    private tronWeb: TronWeb;
    private ethWallet: ethers.HDNodeWallet;
    private tronPrivateKey: string;
    private erc20Abi: string[];
    private activeSubscriptions: Map<string, { type: string; subscription: any }>;

    constructor(config: IConfig, private readonly depositsRepo: Repository<AddressMapping>, private readonly currencyService: CurrencyService) {
        this.config = config;
        this.activeSubscriptions = new Map();

        // Ethereum setup
        this.ethProvider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
        this.ethWsProvider = new ethers.WebSocketProvider(config.ethereum.wsUrl);
        this.ethWallet = ethers.Wallet.fromPhrase(config.ethereum.hdMnemonic).connect(this.ethProvider);

        // Tron setup
        this.tronWeb = new TronWeb({ fullHost: config.tron.fullHost });
        this.tronPrivateKey = TronWeb.fromMnemonic(config.tron.hdMnemonic).privateKey;
        this.tronWeb.setPrivateKey(this.tronPrivateKey);

        this.erc20Abi = [
            'function balanceOf(address owner) view returns (uint256)',
            'function transfer(address to, uint256 value) returns (bool)',
            'function decimals() view returns (uint8)',
            'event Transfer(address indexed from, address indexed to, uint256 value)'
        ];
    }

    isSupportedCurrency(currency: SupportedCurrencies): boolean {
        return [SupportedCryptoCurrencies.ERC20, SupportedCryptoCurrencies.ETH].includes(currency as SupportedCryptoCurrencies)
    }

    async generatePaymentWallet(payment: Payment) {
        if (!this.ethWallet) throw new Error('Ethereum HD wallet not initialized');

        if (!this.isSupportedCurrency(payment.currency)) {
            throw new Error(`Currency: ${payment.currency} is not supported by ethereum network`)
        }

        const index = await this.getNextIndex();
        const wallet = this.ethWallet.derivePath(`${this.config.ethereum.basePath || "m/44'/60'/0'/0"}/${index}`);
        const walletAddress = wallet.address;

        // Estimate gas fee in eth
        const estimatedGasFeeInEth = await this.estimateGasFee(payment.currency);

        // Pre-fund the wallet with the gas fee in ETH
        const tx = await this.ethWallet.sendTransaction({
            to: walletAddress,
            value: ethers.parseEther(estimatedGasFeeInEth.toString()),
        });
        await tx.wait(3);

        await this.depositsRepo.save(this.depositsRepo.create({
            payment,
            currency: payment.currency as SupportedCryptoCurrencies,
            walletAddress,
            derivationPath: `${index}`,
            requestedAmount: payment.amount.toString(), // amount we expect to receive at the end
            estimatedGasFee: estimatedGasFeeInEth.toString(),
            totalRequested: payment.amount.toString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires after 24hrs

        }))

        this.monitorAddress(walletAddress, payment.currency as SupportedCryptoCurrencies);

        return {
            address: walletAddress,
            currency: payment.currency,
            amount: payment.amount.toString(),
            instructions: `Send ${payment.amount} ETH to ${walletAddress}`
        };
    }

    async estimateGasFee(currency: SupportedCurrencies): Promise<number> {
        if (!this.isSupportedCurrency(currency)) {
            throw new Error(`This currency: ${currency} is not supported on the ethereum network`)
        }
        // Estimate gas fee in ETH
        const gasPrice = await this.ethProvider.getFeeData();
        const gasLimit = currency === SupportedCryptoCurrencies.ETH ? 21000n : 65000n; // ETH: 21000, ERC20: 65000
        const gasFeeInWei = gasPrice.maxFeePerGas! * gasLimit;
        const gasFeeInEth = ethers.formatEther(gasFeeInWei * 12n / 10n); // 20% buffer

        const convertedFee = await this.currencyService.convert(parseFloat(gasFeeInEth), SupportedCryptoCurrencies.ETH, currency)

        return convertedFee
    }

    private async getNextIndex(): Promise<number> {
        const lastMapping = await this.depositsRepo.findOne({
            where: {
                currency: In([SupportedCryptoCurrencies.ETH, SupportedCryptoCurrencies.ERC20])
            },
            order: {
                derivationPath: 'DESC'
            }
        })

        return lastMapping?.derivationPath ?
            parseInt(lastMapping.derivationPath) + 1 : 0;
    }

    private async monitorAddress(address: string, currency: SupportedCryptoCurrencies): Promise<void> {

        if (this.activeSubscriptions.has(address)) return;

        if (currency === SupportedCryptoCurrencies.ETH) {
            const subscription = this.ethWsProvider.on('block', async () => {
                await this.checkAndTransfer(address, currency);
            });
            this.activeSubscriptions.set(address, { type: currency, subscription });
        } else if (currency === SupportedCryptoCurrencies.ERC20) {
            const contract = new ethers.Contract(this.config.ethereum.usdtContractAddress, this.erc20Abi, this.ethProvider);
            const subscription = contract.on('Transfer', async (from: string, to: string) => {
                if (to.toLowerCase() === address.toLowerCase()) {
                    await this.checkAndTransfer(address, currency);
                }
            });
            this.activeSubscriptions.set(address, { type: currency, subscription });
        } else {
            logger.error(`Unhandled currency on ethereum network: ${currency}.`)
            logger.error(`Unable to monitor payment for address: ${address}, currency: ${currency}.`)
        }
    }

    private async checkAndTransfer(address: string, currency: SupportedCryptoCurrencies): Promise<void> {
        const mapping = await this.depositsRepo.findOneBy({ walletAddress: address })

        if (!mapping) return;

        if (currency === SupportedCryptoCurrencies.ETH) {
            await this.transferEthereum(mapping);
        } else if (currency === SupportedCryptoCurrencies.ERC20) {
            await this.transferERC20Token(mapping);
        }
    }

    private async transferEthereum(mapping: AddressMapping): Promise<string | null> {
        try {
            const wallet = this.ethWallet.derivePath(`${this.config.ethereum.basePath || "m/44'/60'/0'/0"}/${mapping.derivationPath}`);
            const signer = wallet.connect(this.ethProvider);

            const balance = await signer.provider?.getBalance(wallet.address) || 0n;
            const feeData = await this.ethProvider.getFeeData();
            const gasCost = (feeData.maxFeePerGas || 0n) * 21000n;

            if (balance <= gasCost) return null;

            const tx = await signer.sendTransaction({
                to: this.config.ethereum.mainWalletAddress,
                value: balance - gasCost,
                gasLimit: 21000,
                ...feeData
            });

            await this.recordDeposit(mapping, tx, ethers.formatEther(balance - gasCost), ethers.formatEther(gasCost));
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('ETH Transfer Error:', error);
            return null;
        }
    }

    private async transferERC20Token(mapping: AddressMapping): Promise<string | null> {
        try {
            const wallet = this.ethWallet.derivePath(`${this.config.ethereum.basePath || "m/44'/60'/0'/0"}/${mapping.derivationPath}`);
            const signer = wallet.connect(this.ethProvider);
            const contract = new ethers.Contract(this.config.ethereum.usdtContractAddress, this.erc20Abi, signer);

            const balance = await contract.balanceOf(wallet.address);
            if (balance === 0n) return null;

            const tx = await contract.transfer(this.config.ethereum.mainWalletAddress, balance);
            const receipt = await tx.wait();

            await this.recordDeposit(mapping, tx, ethers.formatUnits(balance, 6),
                ethers.formatEther(receipt.gasUsed * (receipt.effectiveGasPrice || 0n)));
            return tx.hash;
        } catch (error) {
            console.error('USDT Transfer Error:', error);
            return null;
        }
    }

    private async recordDeposit(mapping: AddressMapping, tx: ethers.TransactionResponse, amount: string, gasFee: string): Promise<void> {
        mapping.deposits.push({
            txHash: tx.hash,
            amount,
            gasFee,
            timestamp: new Date(),
            processed: true
        });
        await this.depositsRepo.save(mapping);
    }
}

class TronPaymentProcessor implements CryptoPaymentProcessor {
    private config: IConfig;
    private tronWeb: TronWeb;
    private tronHdNode: ethers.HDNodeWallet;
    private activeSubscriptions: Map<string, { type: string; intervalId: NodeJS.Timeout }>;

    constructor(
        config: IConfig,
        @Inject()
        private readonly depositsRepo: Repository<AddressMapping>,
        @Inject()
        private readonly currencyService: CurrencyService
    ) {
        this.config = config;
        this.activeSubscriptions = new Map();

        // Initialize Tron HD wallet
        if (config.tron.hdMnemonic) {
            this.tronHdNode = ethers.HDNodeWallet.fromPhrase(config.tron.hdMnemonic);
        } else {
            throw new Error('Tron HD mnemonic not provided');
        }

        // Initialize TronWeb
        this.tronWeb = new TronWeb({ fullHost: config.tron.fullHost });
    }

    isSupportedCurrency(currency: SupportedCurrencies): boolean {
        return [SupportedCryptoCurrencies.TRC20, SupportedCryptoCurrencies.TRON].includes(currency as SupportedCryptoCurrencies)
    }

    async estimateGasFee(currency: SupportedCryptoCurrencies): Promise<number> {
        if (!this.isSupportedCurrency(currency)) {
            throw new Error(`Currency: ${currency} is not supported on the tron network`)
        }

        // Step 2: Estimate gas fee in TRX
        // Tron uses bandwidth/energy; approximate with fixed fees for simplicity
        const gasFeeInTrx = currency === SupportedCryptoCurrencies.TRON ? 1 : 10; // 1 TRX for TRX, 10 TRX for TRC20

        const coverted = await this.currencyService.convert(gasFeeInTrx, SupportedCryptoCurrencies.TRON, currency)

        return coverted;
    }

    // Generate a Tron payment request
    async generatePaymentWallet(
        payment: Payment
    ) {
        try {
            if (!this.tronHdNode) throw new Error('Tron HD wallet not initialized');
            if (!this.isSupportedCurrency(payment.currency)) {
                throw new Error(`Currency: ${payment.currency} is not supported on the tron network`)
            }

            // Determine the next derivation index
            const index = await this.getLastIndex()

            const path = `${index}`;
            const childNode = this.tronHdNode.derivePath(path);
            const privateKey = childNode.privateKey.slice(2); // Remove '0x'
            const walletAddress = TronWeb.address.fromPrivateKey(privateKey);

            if (!walletAddress) {
                throw new Error('Unable to generate wallet address from private key.')
            }

            // Estimate gas fee in TRX
            const gasFee = await this.estimateGasFee(SupportedCryptoCurrencies.TRON)
            // Convert the fee to SUN (tron least currency)
            const feeInSun = gasFee * 1000000



            // Pre-fund the wallet with the gas fee in TRX
            await this.tronWeb.trx.sendTransaction(
                walletAddress,
                feeInSun,
                { privateKey: this.tronHdNode.privateKey }
            );

            await this.depositsRepo.save(this.depositsRepo.create({
                payment,
                currency: payment.currency as SupportedCryptoCurrencies,
                walletAddress,
                derivationPath: path,
                requestedAmount: payment.amount.toString(),
                estimatedGasFee: gasFee.toString(),
                totalRequested: payment.amount.toString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            }))

            this.monitorTronAddress(walletAddress, payment.currency as SupportedCryptoCurrencies);

            return {
                address: walletAddress,
                amount: payment.amount.toString(),
                currency: payment.currency,
                includesGasFee: true,
                estimatedGasFee: gasFee,
                instructions: `Send ${payment.amount} to ${walletAddress}`
            };
        } catch (error) {
            console.error('Error generating Tron payment request:', error);
            throw error;
        }
    }

    private async getLastIndex() {
        const lastMapping = await this.depositsRepo.findOne({
            where: { currency: In([SupportedCryptoCurrencies.TRON, SupportedCryptoCurrencies.TRC20]) },
            order: { derivationPath: -1 }
        })

        const index = lastMapping?.derivationPath
            ? parseInt(lastMapping.derivationPath.split('/').pop() || '0') + 1
            : 0;

        return index
    }

    // Monitor a Tron address for deposits
    private async monitorTronAddress(address: string, currency: SupportedCryptoCurrencies): Promise<void> {
        if (this.activeSubscriptions.has(address)) return;

        const intervalId = setInterval(async () => {
            try {
                const mapping = await this.depositsRepo.findOneBy({ walletAddress: address });
                if (!mapping) {
                    clearInterval(intervalId);
                    this.activeSubscriptions.delete(address);
                    return;
                }

                if (currency === SupportedCryptoCurrencies.TRON) {
                    const balance = await this.tronWeb.trx.getBalance(address);
                    if (balance > 0) {
                        await this.transferTron(mapping);
                    }
                } else {
                    const contract = await this.tronWeb.contract().at(this.config.tron.usdtContractAddress);
                    const balance = await contract.balanceOf(address).call();
                    if (balance > 0) {
                        await this.transferTRC20Token(mapping);
                    }
                }
            } catch (error) {
                console.error(`Error monitoring Tron address ${address}:`, error);
            }
        }, 10000); // Check every 10 seconds

        this.activeSubscriptions.set(address, { type: currency, intervalId });
    }

    // Transfer TRX to the main wallet
    private async transferTron(mapping: AddressMapping): Promise<string | null> {
        try {
            const childNode = this.tronHdNode.derivePath(mapping.derivationPath || '0');
            const privateKey = childNode.privateKey.slice(2);

            const balance = await this.tronWeb.trx.getBalance(mapping.walletAddress);
            const amountToSend = balance - 100000; // Reserve 0.1 TRX for gas (100,000 sun)

            if (amountToSend <= 0) return null;

            const tx = await this.tronWeb.trx.sendTransaction(
                this.config.tron.mainWalletAddress,
                amountToSend,
                { privateKey: privateKey }
            );

            mapping.deposits.push({
                txHash: tx.txid,
                amount: (amountToSend / 1e6).toString(), // Convert sun to TRX
                gasFee: '0.1',
                timestamp: new Date(),
                processed: true
            });
            await this.depositsRepo.save(mapping);

            return tx.txid;
        } catch (error) {
            console.error('Error transferring TRX:', error);
            return null;
        }
    }

    // Transfer TRC20 tokens to the main wallet
    private async transferTRC20Token(mapping: AddressMapping): Promise<string | null> {
        try {
            const childNode = this.tronHdNode.derivePath(mapping.derivationPath || '0');
            const privateKey = childNode.privateKey.slice(2);

            const contract = await this.tronWeb.contract().at(this.config.tron.usdtContractAddress);
            const balance = await contract.balanceOf(mapping.walletAddress).call();

            if (balance <= 0) return null;

            const tx = await contract.transfer(
                this.config.tron.mainWalletAddress,
                balance
            ).send({
                from: mapping.walletAddress,
                feeLimit: 10000000, // 10 TRX
                callValue: 0
            }, privateKey);

            mapping.deposits.push({
                txHash: tx,
                amount: (balance / 1e6).toString(), // Assuming 6 decimals for USDT
                gasFee: '10',
                timestamp: new Date(),
                processed: true
            });
            await this.depositsRepo.save(mapping);

            return tx;
        } catch (error) {
            console.error('Error transferring USDT-TRC20:', error);
            return null;
        }
    }
}



const currencyNetworkmap: { currency: SupportedCryptoCurrencies, network: SupportedCryptoNetworks }[] = [
    {
        currency: SupportedCryptoCurrencies.ETH,
        network: 'ethereum'
    },
    {
        currency: SupportedCryptoCurrencies.ERC20,
        network: 'ethereum'
    },
    {
        currency: SupportedCryptoCurrencies.TRON,
        network: 'tron'
    },
    {
        currency: SupportedCryptoCurrencies.TRC20,
        network: 'tron'
    },
]

@Service()
export class CryptoPaymentFactory {
    private readonly NETWORK_PROCESSORS = new Map<SupportedCryptoNetworks, CryptoPaymentProcessor>();
    private readonly CURRENCY_NETWORK = new Map<SupportedCryptoCurrencies, SupportedCryptoNetworks>()

    setProcessor(network: SupportedCryptoNetworks, processor: CryptoPaymentProcessor): void {
        this.NETWORK_PROCESSORS.set(network, processor);
    }

    getNetworkFromCurrency(currency: SupportedCryptoCurrencies): SupportedCryptoNetworks {
        const network = this.CURRENCY_NETWORK.get(currency)
        if (!network) {
            throw new Error(`Network not defined for currency: ${currency}`)
        }
        return network
    }

    getProcessorFromCurrency(currency: SupportedCryptoCurrencies): CryptoPaymentProcessor {
        const network = this.getNetworkFromCurrency(currency)
        return this.getProcessor(network)
    }

    isCryptoCurrency(currency: SupportedCurrencies): currency is SupportedCryptoCurrencies {
        if (this.CURRENCY_NETWORK.get(currency as SupportedCryptoCurrencies)) return true

        return false
    }

    setCurrencyNetwork(currency: SupportedCryptoCurrencies, network: SupportedCryptoNetworks): void {
        this.CURRENCY_NETWORK.set(currency, network)
    }

    getProcessor(network: SupportedCryptoNetworks): CryptoPaymentProcessor {
        const processor = this.NETWORK_PROCESSORS.get(network);
        if (!processor) {
            throw new Error(`No payment processor found for network: ${network}`);
        }
        return processor;
    }

    constructor(config: IConfig, depositsRepo: Repository<AddressMapping>, currencyService:CurrencyService) {
        this.setProcessor('ethereum', new EthereumPaymentProcessor(config, depositsRepo, currencyService));
        this.setProcessor('tron', new TronPaymentProcessor(config, depositsRepo, currencyService));
        currencyNetworkmap.map(itm => {
            this.setCurrencyNetwork(itm.currency, itm.network)
        })
    }
}