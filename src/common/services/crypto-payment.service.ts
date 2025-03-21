// // payment-processor.ts
// import * as ecc from 'tiny-secp256k1';
// import BIP32Factory, { BIP32Interface } from 'bip32';
// import { ethers } from 'ethers';
// import { TronWeb } from 'tronweb';
// import { In, Repository } from 'typeorm';
// import { AddressMapping, Payment } from '../entities';
// import { Inject, Service } from 'typedi';
// import { SupportedCryptoCurrencies, SupportedCurrencies } from '../enums';
// import { CurrencyService } from './currency.service';
// import logger from '../utils/logger';
// import {
//   BroadcastReturn,
//   ContractParamter,
//   SignedTransaction,
// } from 'tronweb/lib/esm/types';

// const bip32 = BIP32Factory(ecc);

// interface IConfig {
//   ethereum: {
//     hdMnemonic: string;
//     rpcUrl: string;
//     wsUrl: string;
//     basePath?: string;
//     mainWalletAddress: string;
//     usdtContractAddress: string;
//   };
//   tron: {
//     hdMnemonic: string;
//     fullHost: string;
//     basePath?: string;
//     mainWalletAddress: string;
//     usdtContractAddress: string;
//     fullHostApiKey?: string;
//     privateKey: string;
//   };
// }

// interface CryptoPaymentProcessor {
//   generatePaymentWallet(payment: Payment): Promise<{
//     address: string;
//     amount: string;
//     currency: SupportedCurrencies;
//     instructions: string;
//   }>;
//   estimateGasFee(currency: SupportedCurrencies): Promise<number>;
//   isSupportedCurrency(currency: SupportedCurrencies): boolean;
// }

// class EthereumPaymentProcessor implements CryptoPaymentProcessor {
//   private config: IConfig;
//   private ethProvider: ethers.JsonRpcProvider;
//   private ethWsProvider: ethers.WebSocketProvider;
//   private tronWeb: TronWeb;
//   private ethWallet: ethers.HDNodeWallet;
//   private tronPrivateKey: string;
//   private erc20Abi: string[];
//   private activeSubscriptions: Map<string, { type: string; subscription: any }>;

//   constructor(
//     config: IConfig,
//     private readonly depositsRepo: Repository<AddressMapping>,
//     private readonly currencyService: CurrencyService
//   ) {
//     this.config = config;
//     this.activeSubscriptions = new Map();

//     // Ethereum setup
//     this.ethProvider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl);
//     this.ethWsProvider = new ethers.WebSocketProvider(config.ethereum.wsUrl);
//     this.ethWallet = ethers.Wallet.fromPhrase(
//       config.ethereum.hdMnemonic
//     ).connect(this.ethProvider);

//     // Tron setup
//     this.tronWeb = new TronWeb({
//       fullHost: config.tron.fullHost,
//       headers: { 'TRON-PRO-API-KEY': config.tron.fullHostApiKey },
//     });
//     this.tronPrivateKey = TronWeb.fromMnemonic(
//       config.tron.hdMnemonic
//     ).privateKey?.slice(2); //remove leading 0x
//     this.tronWeb.setPrivateKey(this.tronPrivateKey);

//     this.erc20Abi = [
//       'function balanceOf(address owner) view returns (uint256)',
//       'function transfer(address to, uint256 value) returns (bool)',
//       'function decimals() view returns (uint8)',
//       'event Transfer(address indexed from, address indexed to, uint256 value)',
//     ];
//   }

//   isSupportedCurrency(currency: SupportedCurrencies): boolean {
//     return [
//       SupportedCryptoCurrencies.ERC20,
//       SupportedCryptoCurrencies.ETH,
//     ].includes(currency as SupportedCryptoCurrencies);
//   }

//   async generatePaymentWallet(payment: Payment) {
//     if (!this.ethWallet) throw new Error('Ethereum HD wallet not initialized');

//     if (!this.isSupportedCurrency(payment.currency)) {
//       throw new Error(
//         `Currency: ${payment.currency} is not supported by ethereum network`
//       );
//     }

//     const index = await this.getNextIndex();
//     const wallet = this.ethWallet.derivePath(
//       `${this.config.ethereum.basePath || "m/44'/60'/0'/0"}/${index}`
//     );
//     const walletAddress = wallet.address;

//     // Estimate gas fee in eth
//     const estimatedGasFeeInEth = await this.estimateGasFee(payment.currency);

//     // Pre-fund the wallet with the gas fee in ETH
//     const tx = await this.ethWallet.sendTransaction({
//       to: walletAddress,
//       value: ethers.parseEther(estimatedGasFeeInEth.toString()),
//     });
//     await tx.wait(3);

//     await this.depositsRepo.save(
//       this.depositsRepo.create({
//         payment,
//         currency: payment.currency as SupportedCryptoCurrencies,
//         walletAddress,
//         derivationPath: `${index}`,
//         requestedAmount: payment.amount.toString(), // amount we expect to receive at the end
//         estimatedGasFee: estimatedGasFeeInEth.toString(),
//         totalRequested: payment.amount.toString(),
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires after 24hrs
//       })
//     );

//     this.monitorAddress(
//       walletAddress,
//       payment.currency as SupportedCryptoCurrencies
//     );

//     return {
//       address: walletAddress,
//       currency: payment.currency,
//       amount: payment.amount.toString(),
//       instructions: `Send ${payment.amount} ETH to ${walletAddress}`,
//     };
//   }

//   async estimateGasFee(currency: SupportedCurrencies): Promise<number> {
//     if (!this.isSupportedCurrency(currency)) {
//       throw new Error(
//         `This currency: ${currency} is not supported on the ethereum network`
//       );
//     }
//     // Estimate gas fee in ETH
//     const gasPrice = await this.ethProvider.getFeeData();
//     const gasLimit =
//       currency === SupportedCryptoCurrencies.ETH ? 21000n : 65000n; // ETH: 21000, ERC20: 65000
//     const gasFeeInWei = gasPrice.maxFeePerGas! * gasLimit;
//     const gasFeeInEth = ethers.formatEther((gasFeeInWei * 12n) / 10n); // 20% buffer

//     const convertedFee = await this.currencyService.convert(
//       parseFloat(gasFeeInEth),
//       SupportedCryptoCurrencies.ETH,
//       currency
//     );

//     return convertedFee;
//   }

//   private async getNextIndex(): Promise<number> {
//     const lastMapping = await this.depositsRepo.findOne({
//       where: {
//         currency: In([
//           SupportedCryptoCurrencies.ETH,
//           SupportedCryptoCurrencies.ERC20,
//         ]),
//       },
//       order: {
//         derivationPath: 'DESC',
//       },
//     });

//     return lastMapping?.derivationPath
//       ? parseInt(lastMapping.derivationPath) + 1
//       : 0;
//   }

//   private async monitorAddress(
//     address: string,
//     currency: SupportedCryptoCurrencies
//   ): Promise<void> {
//     if (this.activeSubscriptions.has(address)) return;

//     if (currency === SupportedCryptoCurrencies.ETH) {
//       const subscription = this.ethWsProvider.on('block', async () => {
//         await this.checkAndTransfer(address, currency);
//       });
//       this.activeSubscriptions.set(address, { type: currency, subscription });
//     } else if (currency === SupportedCryptoCurrencies.ERC20) {
//       const contract = new ethers.Contract(
//         this.config.ethereum.usdtContractAddress,
//         this.erc20Abi,
//         this.ethProvider
//       );
//       const subscription = contract.on(
//         'Transfer',
//         async (from: string, to: string) => {
//           if (to.toLowerCase() === address.toLowerCase()) {
//             await this.checkAndTransfer(address, currency);
//           }
//         }
//       );
//       this.activeSubscriptions.set(address, { type: currency, subscription });
//     } else {
//       logger.error(`Unhandled currency on ethereum network: ${currency}.`);
//       logger.error(
//         `Unable to monitor payment for address: ${address}, currency: ${currency}.`
//       );
//     }
//   }

//   private async checkAndTransfer(
//     address: string,
//     currency: SupportedCryptoCurrencies
//   ): Promise<void> {
//     const mapping = await this.depositsRepo.findOneBy({
//       walletAddress: address,
//     });

//     if (!mapping) return;

//     if (currency === SupportedCryptoCurrencies.ETH) {
//       await this.transferEthereum(mapping);
//     } else if (currency === SupportedCryptoCurrencies.ERC20) {
//       await this.transferERC20Token(mapping);
//     }
//   }

//   private async transferEthereum(
//     mapping: AddressMapping
//   ): Promise<string | null> {
//     try {
//       const wallet = this.ethWallet.derivePath(
//         `${this.config.ethereum.basePath || "m/44'/60'/0'/0"}/${mapping.derivationPath}`
//       );
//       const signer = wallet.connect(this.ethProvider);

//       const balance = (await signer.provider?.getBalance(wallet.address)) || 0n;
//       const feeData = await this.ethProvider.getFeeData();
//       const gasCost = (feeData.maxFeePerGas || 0n) * 21000n;

//       if (balance <= gasCost) return null;

//       const tx = await signer.sendTransaction({
//         to: this.config.ethereum.mainWalletAddress,
//         value: balance - gasCost,
//         gasLimit: 21000,
//         ...feeData,
//       });

//       await this.recordDeposit(
//         mapping,
//         tx,
//         ethers.formatEther(balance - gasCost),
//         ethers.formatEther(gasCost)
//       );
//       await tx.wait();
//       return tx.hash;
//     } catch (error) {
//       console.error('ETH Transfer Error:', error);
//       return null;
//     }
//   }

//   private async transferERC20Token(
//     mapping: AddressMapping
//   ): Promise<string | null> {
//     try {
//       const wallet = this.ethWallet.derivePath(
//         `${this.config.ethereum.basePath || "m/44'/60'/0'/0"}/${mapping.derivationPath}`
//       );
//       const signer = wallet.connect(this.ethProvider);
//       const contract = new ethers.Contract(
//         this.config.ethereum.usdtContractAddress,
//         this.erc20Abi,
//         signer
//       );

//       const balance = await contract.balanceOf(wallet.address);
//       if (balance === 0n) return null;

//       const tx = await contract.transfer(
//         this.config.ethereum.mainWalletAddress,
//         balance
//       );
//       const receipt = await tx.wait();

//       await this.recordDeposit(
//         mapping,
//         tx,
//         ethers.formatUnits(balance, 6),
//         ethers.formatEther(receipt.gasUsed * (receipt.effectiveGasPrice || 0n))
//       );
//       return tx.hash;
//     } catch (error) {
//       console.error('USDT Transfer Error:', error);
//       return null;
//     }
//   }

//   private async recordDeposit(
//     mapping: AddressMapping,
//     tx: ethers.TransactionResponse,
//     amount: string,
//     gasFee: string
//   ): Promise<void> {
//     mapping.deposits.push({
//       txHash: tx.hash,
//       amount,
//       gasFee,
//       timestamp: new Date(),
//       processed: true,
//     });
//     await this.depositsRepo.save(mapping);
//   }
// }

// class TronPaymentProcessor implements CryptoPaymentProcessor {
//   private config: IConfig;
//   private tronWeb: TronWeb;
//   private activeSubscriptions: Map<
//     string,
//     { type: string; intervalId: NodeJS.Timeout }
//   >;
//   private rootNode?: BIP32Interface;

//   constructor(
//     config: IConfig,
//     @Inject()
//     private readonly depositsRepo: Repository<AddressMapping>,
//     @Inject()
//     private readonly currencyService: CurrencyService
//   ) {
//     this.config = config;
//     this.activeSubscriptions = new Map();

//     // Initialize TronWeb
//     this.tronWeb = new TronWeb({
//       fullHost: config.tron.fullHost,
//       headers: { 'TRON-PRO-API-KEY': config.tron.fullHostApiKey },
//     });

//     this.getRootNode();
//   }

//   isSupportedCurrency(currency: SupportedCurrencies): boolean {
//     return [
//       SupportedCryptoCurrencies.TRC20,
//       SupportedCryptoCurrencies.TRON,
//     ].includes(currency as SupportedCryptoCurrencies);
//   }

//   async estimateGasFee(currency: SupportedCryptoCurrencies): Promise<number> {
//     if (!this.isSupportedCurrency(currency)) {
//       throw new Error(
//         `Currency: ${currency} is not supported on the tron network`
//       );
//     }

//     // Step 2: Estimate gas fee in TRX
//     // Tron uses bandwidth/energy; approximate with fixed fees for simplicity
//     const gasFeeInTrx = 10; // 1 TRX for TRX, 10 TRX for TRC20

//     const coverted = await this.currencyService.convert(
//       gasFeeInTrx,
//       SupportedCryptoCurrencies.TRON,
//       currency
//     );

//     return coverted;
//   }

//   // Generate a Tron payment request
//   async generatePaymentWallet(payment: Payment) {
//     try {
//       if (!this.isSupportedCurrency(payment.currency)) {
//         throw new Error(
//           `Currency: ${payment.currency} is not supported on the tron network`
//         );
//       }

//       if (!this.rootNode) {
//         await this.getRootNode();
//       }

//       // Determine the next derivation index
//       const index = await this.getLastIndex();
//       const path = this.getPath(index);

//       const childNode = await this.generateChildNode(path);

//       const { walletAddress } = this.getWallet(childNode);
//       const { privateKey: rootKey, walletAddress: rootWalletAddress } =
//         this.getWallet(this.rootNode!);

//       // Estimate gas fee in TRX
//       const gasFee = await this.estimateGasFee(SupportedCryptoCurrencies.TRON);
//       // Convert the fee to SUN (tron least currency)
//       const feeInSun = gasFee * 1000000;

//       // this.tronWeb.setPrivateKey(rootKey)

//       // Pre-fund generated wallet with the gas fee in TRX
//       // const transaction = await this.tronWeb.transactionBuilder.sendTrx(walletAddress, feeInSun, rootWalletAddress)

//       // const signedTransaction = await this.tronWeb.trx.sign(transaction)
//       // const result = await this.tronWeb.trx.sendRawTransaction(signedTransaction)

//       // const walletBalance = this.tronWeb.trx.getBalance()
//       const mainBal = await this.tronWeb.trx.getBalance(
//         this.config.tron.mainWalletAddress
//       );
//       const rootBal = await this.tronWeb.trx.getBalance(rootWalletAddress);

//       const result = await this.tronWeb.trx.sendTransaction(
//         walletAddress,
//         feeInSun,
//         { privateKey: rootKey }
//       );

//       await this.depositsRepo.save(
//         this.depositsRepo.create({
//           payment,
//           currency: payment.currency as SupportedCryptoCurrencies,
//           walletAddress,
//           derivationPath: path,
//           requestedAmount: payment.amount.toString(),
//           estimatedGasFee: gasFee.toString(),
//           totalRequested: payment.amount.toString(),
//           expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
//           lastChecked: new Date(),
//         })
//       );

//       this.monitorTronAddress(
//         walletAddress,
//         payment.currency as SupportedCryptoCurrencies,
//         result
//       );

//       return {
//         address: walletAddress,
//         amount: payment.amount.toString(),
//         currency: payment.currency,
//         includesGasFee: true,
//         estimatedGasFee: gasFee,
//         instructions: `Send ${payment.amount} to ${walletAddress}`,
//       };
//     } catch (error) {
//       console.error('Error generating Tron payment request:', error);
//       throw error;
//     }
//   }

//   private async getLastIndex() {
//     const lastMapping = await this.depositsRepo.findOne({
//       where: {
//         currency: In([
//           SupportedCryptoCurrencies.TRON,
//           SupportedCryptoCurrencies.TRC20,
//         ]),
//       },
//       order: { derivationIndex: 'DESC' },
//     });

//     const index = lastMapping?.derivationPath
//       ? parseInt(lastMapping.derivationPath.split('/').pop() || '0') + 1
//       : 0;

//     return index;
//   }

//   // Monitor a Tron address for deposits
//   private async monitorTronAddress(
//     address: string,
//     currency: SupportedCryptoCurrencies,
//     _: BroadcastReturn<SignedTransaction<ContractParamter>>
//   ): Promise<void> {
//     if (this.activeSubscriptions.has(address)) return;

//     // let trxConfirmed = false;
//     // while (!trxConfirmed) {
//     //     const trxStatus = await this.tronWeb.trx.getUnconfirmedTransactionInfo(funded.txid);
//     //     if (trxStatus && trxStatus.receipt?.result === 'SUCCESS') {
//     //         trxConfirmed = true;
//     //     }
//     //     await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
//     // }

//     const intervalId = setInterval(async () => {
//       try {
//         const mapping = await this.depositsRepo.findOneBy({
//           walletAddress: address,
//         });
//         if (!mapping) {
//           clearInterval(intervalId);
//           this.activeSubscriptions.delete(address);
//           return;
//         }

//         let transferSuccess: string | null = null;

//         if (currency === SupportedCryptoCurrencies.TRON) {
//           const balance = await this.tronWeb.trx.getBalance(address);
//           if (balance > 0) {
//             transferSuccess = await this.transferTron(mapping);
//           }
//         } else {
//           const { privateKey } = this.getWallet(
//             this.generateChildNode(mapping.derivationPath)
//           );

//           const tWeb = new TronWeb({
//             fullHost: this.config.tron.fullHost,
//             headers: { 'TRON-PRO-API-KEY': this.config.tron.fullHostApiKey },
//             privateKey,
//           });

//           // We also need to ensure that the child node received the trx
//           const trxBalance = await tWeb.trx.getBalance(address);

//           const contract = await tWeb
//             .contract()
//             .at(this.config.tron.usdtContractAddress);
//           const balance = await contract.balanceOf(address).call();
//           // Transfer token only when both balances are more than zero
//           if (balance > 0 && trxBalance > 0) {
//             transferSuccess = await this.transferTRC20Token(mapping);
//           }
//         }

//         // If transfer was successful, stop monitoring
//         if (transferSuccess) {
//           clearInterval(intervalId);
//           this.activeSubscriptions.delete(address);
//         }
//       } catch (error) {
//         console.error(`Error monitoring Tron address ${address}:`, error);
//       }
//     }, 10000); // Check every 10 seconds

//     this.activeSubscriptions.set(address, { type: currency, intervalId });
//   }

//   // Transfer TRX to the main wallet
//   private async transferTron(mapping: AddressMapping): Promise<string | null> {
//     try {
//       const childNode = await this.generateChildNode(mapping.derivationPath);
//       const { privateKey } = this.getWallet(childNode);

//       const balance = await this.tronWeb.trx.getBalance(mapping.walletAddress);

//       const amountToSend = balance - 100000; // Reserve 0.1 TRX for gas (100,000 sun)

//       if (amountToSend <= 0) return null;

//       const tx = await this.tronWeb.trx.sendTransaction(
//         this.config.tron.mainWalletAddress,
//         amountToSend,
//         { privateKey: privateKey }
//       );

//       mapping.deposits.push({
//         txHash: tx.txid,
//         amount: (amountToSend / 1e6).toString(), // Convert sun to TRX
//         gasFee: '0.1',
//         timestamp: new Date(),
//         processed: true,
//       });
//       await this.depositsRepo.save(mapping);

//       return tx.txid;
//     } catch (error) {
//       console.error('Error transferring TRX:', error);
//       return null;
//     }
//   }

//   // Transfer TRC20 tokens to the main wallet
//   private async transferTRC20Token(
//     mapping: AddressMapping
//   ): Promise<string | null> {
//     try {
//       if (!this.rootNode) {
//         await this.getRootNode();
//       }

//       const { privateKey } = this.getWallet(
//         await this.generateChildNode(mapping.derivationPath)
//       );

//       const tWeb = new TronWeb({
//         fullHost: this.config.tron.fullHost,
//         headers: { 'TRON-PRO-API-KEY': this.config.tron.fullHostApiKey },
//         privateKey,
//       });

//       const contract = await tWeb
//         .contract()
//         .at(this.config.tron.usdtContractAddress);
//       const balance = await contract.balanceOf(mapping.walletAddress).call();

//       if (balance <= 0) return null;

//       const balanceInSun = balance.toString();

//       const tx = await contract
//         .transfer(this.config.tron.mainWalletAddress, Number(balance))
//         .send();

//       mapping.deposits.push({
//         txHash: tx,
//         amount: (balance / 1e6).toString(), // Assuming 6 decimals for USDT
//         gasFee: '10',
//         timestamp: new Date(),
//         processed: true,
//       });
//       await this.depositsRepo.save(mapping);

//       // Reset private key and address to root
//       // this.tronWeb.setAddress(rootWalletAddress)
//       // this.tronWeb.setPrivateKey(rootPrivateKey)

//       return tx;
//     } catch (error) {
//       console.error('Error transferring USDT-TRC20:', error);
//       return null;
//     }
//   }

//   private getRootNode() {
//     if (this.rootNode) {
//       return this.rootNode;
//     }

//     // const mnemonic = this.config.tron.hdMnemonic
//     // if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
//     //     throw new Error('Invalid mnemonic phrase')
//     // }

//     // Generate seed from mnemonic
//     // const seed = await bip39.mnemonicToSeed(mnemonic);

//     // Create master key using BIP32
//     this.rootNode = bip32.fromPrivateKey(
//       Buffer.from(this.config.tron.privateKey, 'hex'),
//       Buffer.alloc(32)
//     );

//     return this.rootNode;
//   }

//   private getPath(index: number = 0) {
//     return `${this.config.tron.basePath || "m/44'/195'/0'/0"}/${index}`;
//   }

//   private generateChildNode(path: string) {
//     if (!this.rootNode) {
//       this.getRootNode();
//     }
//     // Derive the key for TRON (BIP44 path: m/44'/195'/0'/0/index)
//     const child = this.rootNode!.derivePath(path);

//     return child;
//   }

//   private getWallet(node: BIP32Interface) {
//     // Convert to private key format

//     if (!node.privateKey) {
//       throw new Error('Failed to get private key from node');
//     }
//     const privateKey = Buffer.from(node.privateKey).toString('hex');
//     // Get Tron Address
//     const walletAddress = TronWeb.address.fromPrivateKey(privateKey);

//     if (!walletAddress) {
//       throw new Error('Unable to generate wallet address');
//     }

//     return { walletAddress, privateKey };
//   }
// }

// const currencyNetworkmap: {
//   currency: SupportedCryptoCurrencies;
//   network: SupportedCryptoNetworks;
// }[] = [
//   {
//     currency: SupportedCryptoCurrencies.ETH,
//     network: 'ethereum',
//   },
//   {
//     currency: SupportedCryptoCurrencies.ERC20,
//     network: 'ethereum',
//   },
//   {
//     currency: SupportedCryptoCurrencies.TRON,
//     network: 'tron',
//   },
//   {
//     currency: SupportedCryptoCurrencies.TRC20,
//     network: 'tron',
//   },
// ];

// @Service()
// export class CryptoPaymentFactory {
//   private readonly NETWORK_PROCESSORS = new Map<
//     SupportedCryptoNetworks,
//     CryptoPaymentProcessor
//   >();
//   private readonly CURRENCY_NETWORK = new Map<
//     SupportedCryptoCurrencies,
//     SupportedCryptoNetworks
//   >();

//   setProcessor(
//     network: SupportedCryptoNetworks,
//     processor: CryptoPaymentProcessor
//   ): void {
//     this.NETWORK_PROCESSORS.set(network, processor);
//   }

//   getNetworkFromCurrency(
//     currency: SupportedCryptoCurrencies
//   ): SupportedCryptoNetworks {
//     const network = this.CURRENCY_NETWORK.get(currency);
//     if (!network) {
//       throw new Error(`Network not defined for currency: ${currency}`);
//     }
//     return network;
//   }

//   getProcessorFromCurrency(
//     currency: SupportedCryptoCurrencies
//   ): CryptoPaymentProcessor {
//     const network = this.getNetworkFromCurrency(currency);
//     return this.getProcessor(network);
//   }

//   isCryptoCurrency(
//     currency: SupportedCurrencies
//   ): currency is SupportedCryptoCurrencies {
//     if (this.CURRENCY_NETWORK.get(currency as SupportedCryptoCurrencies))
//       return true;

//     return false;
//   }

//   setCurrencyNetwork(
//     currency: SupportedCryptoCurrencies,
//     network: SupportedCryptoNetworks
//   ): void {
//     this.CURRENCY_NETWORK.set(currency, network);
//   }

//   getProcessor(network: SupportedCryptoNetworks): CryptoPaymentProcessor {
//     const processor = this.NETWORK_PROCESSORS.get(network);
//     if (!processor) {
//       throw new Error(`No payment processor found for network: ${network}`);
//     }
//     return processor;
//   }

//   constructor(
//     config: IConfig,
//     depositsRepo: Repository<AddressMapping>,
//     currencyService: CurrencyService
//   ) {
//     this.setProcessor(
//       'ethereum',
//       new EthereumPaymentProcessor(config, depositsRepo, currencyService)
//     );
//     this.setProcessor(
//       'tron',
//       new TronPaymentProcessor(config, depositsRepo, currencyService)
//     );
//     currencyNetworkmap.map((itm) => {
//       this.setCurrencyNetwork(itm.currency, itm.network);
//     });
//   }
// }
