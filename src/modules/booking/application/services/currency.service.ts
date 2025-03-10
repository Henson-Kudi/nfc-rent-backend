import { Service } from "typedi";

@Service()
export class CurrencyService {
    constructor(
        private httpService: any,
    ) { }

    private rates: Record<string, number> = {};
    private lastUpdated = 0;

    async convert(amount: number, from: string, to: string): Promise<number> {
        if (from === to) return amount;

        // Refresh rates every hour
        if (Date.now() - this.lastUpdated > 3600000) {
            await this.loadRates();
        }

        const fromRate = this.rates[from.toUpperCase()];
        const toRate = this.rates[to.toUpperCase()];

        if (!fromRate || !toRate) {
            throw new Error('Unsupported currency conversion');
        }

        return (amount / fromRate) * toRate;
    }

    private async loadRates() {
        // For fiat currencies
        const fiatResponse = await this.httpService.get(
            `https://api.exchangerate.host/latest?base=USD`
        ).toPromise();

        // For crypto currencies (using CoinGecko)
        const cryptoResponse = await this.httpService.get(
            'https://api.coingecko.com/api/v3/exchange_rates'
        ).toPromise();

        this.rates = {
            ...fiatResponse.data.rates,
            BTC: cryptoResponse.data.rates.btc.value,
            ETH: cryptoResponse.data.rates.eth.value,
            USDT: 1 // Assuming USDT pegged to USD
        };

        this.lastUpdated = Date.now();
    }
}