import { SupportedCurrencies } from '@/common/enums';
import { HttpService } from '@/common/services/http.service';
import envConf from '@/config/env.conf';
import { Inject, Service } from 'typedi';
import logger from '../utils/logger';

type IExchangeRates = {
  base: 'USD';
  date: string;
  rates: Record<string, number>;
};

@Service()
export class CurrencyService {
  constructor(
    @Inject()
    private readonly httpService: HttpService
  ) {
    this.loadRates();
  }

  private rates?: IExchangeRates;
  private lastUpdated = 0;

  async convert(
    amount: number,
    from: SupportedCurrencies,
    to: SupportedCurrencies
  ): Promise<number> {
    if (from === to) return amount;

    // Refresh rates every hour
    if (Date.now() - this.lastUpdated > 3600000 || !this.rates?.rates) {
      await this.loadRates();
    }

    const fromExchangeRate = this.getRate(from);
    const toExchangeRate = this.getRate(to);

    if (!fromExchangeRate || !toExchangeRate) {
      throw new Error('Unsupported currency conversion');
    }

    return (amount / fromExchangeRate) * toExchangeRate;
  }

  private getRate(currency: SupportedCurrencies): number | undefined {
    return this.rates?.rates?.[currency.toUpperCase()];
  }

  private async loadRates() {
    try {
      if (envConf.NODE_ENV !== 'production') {
        this.rates = {
          base: 'USD',
          date: new Date().toString(),
          rates: {
            AED: 3.67,
            EUR: 0.92,
            ETH: 1 / 1847.04, // equivalent of 1 usd in eth (ethereum)
            TRC20: 0.0001, // should be same as 1
            ERC20: 1, // should be same a 1
            TRX: 4.44272, // equivalent of 1 usd to trx (tron)
            USD: 1,
          },
        };
      } else {
        const fiat = await this.httpService.get<{
          base: 'USD';
          date: string;
          rates: Record<string, number>;
        }>('https://api.apilayer.com/exchangerates_data/latest?base=USD', {
          headers: {
            apikey: envConf.EXCHANGE_RATES_DATA_API,
          },
        });

        type CryptoRate = {
          usd: number;
        };

        // For crypto currencies (using CoinGecko)
        const crypto = await this.httpService.get<
          Record<'ethereum' | 'tron' | 'tether', CryptoRate>
        >(
          'https://api.coingecko.com/api/v3/simple/price?ids=tron,tether,ethereum&vs_currencies=usd'
        );

        this.rates = {
          ...fiat,
          rates: {
            ...fiat.rates,
            ETH: 1 / crypto.ethereum.usd, // equivalent of 1 usd in eth (ethereum)
            TRC20: 1 / crypto.tether.usd, // should be same as 1
            ERC20: 1 / crypto.tether.usd, // should be same a 1
            TRX: 1 / crypto.tron.usd, // equivalent of 1 usd to trx (tron)
            USD: 1,
          },
        };
      }

      this.lastUpdated = Date.now();
    } catch (err) {
      logger.error('failed to fetch', err);
    }
  }
}
