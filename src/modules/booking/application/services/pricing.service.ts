import { Car, RentalPricing } from "@/common/entities";
import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import { CurrencyService } from "../../../../common/services/currency.service";
import { ResponseCodes, SupportedCurrencies, SupportedFiatCurrencies } from "@/common/enums";
import { AppError, IReturnValue } from "@/common/utils";
import { CarRepository } from "@/modules/cars/infrastrucure/car.repository";
import { CryptoPaymentFactory } from "@/common/services/crypto-payment.service";

@Service()
export class PricingService {
    private readonly unitHierarchy: CarPricingUnit[] = [
        'year', 'month', 'week', 'day', 'hour'
    ];

    private readonly unitDaysMap: Record<CarPricingUnit, number> = {
        hour: 1 / 24,
        day: 1,
        week: 7,
        month: 30,
        year: 365
    };

    constructor(
        @Inject()
        private pricingRepository: Repository<RentalPricing>,
        @Inject()
        private currencyService: CurrencyService,
        @Inject()
        private cryptoFactory: CryptoPaymentFactory,
        @Inject()
        private carRepository: CarRepository,
    ) { }

    async calculateTotalPrice(
        carId: string,
        startDate: Date,
        endDate: Date,
        targetCurrency: SupportedCurrencies
    ) {
        const car = await this.carRepository.getCar(carId)

        if (!car) {
            throw new AppError({
                message: "Car with identifier not found",
                statusCode: ResponseCodes.NotFound
            })
        }

        const basePrice = await this.calculateBasePrice(car, startDate, endDate); // CALCULATE BASE PRICE IN USD

        // We need to add gas fee in case of crypto
        let gasFee = 0


        const convertedBase = await this.currencyService.convert(
            basePrice.amount,
            basePrice.currency,
            targetCurrency
        );

        const convertedBreakdowns = await Promise.all(basePrice.breakdown.map(async (item) => {
            const converted = await this.currencyService.convert(item.amount, basePrice.currency, targetCurrency)

            return {
                ...item,
                amount: converted
            }
        }))

        if (this.cryptoFactory.isCryptoCurrency(targetCurrency)) {
            const processor = this.cryptoFactory.getProcessorFromCurrency(targetCurrency)
            gasFee = await processor.estimateGasFee(targetCurrency) // no need to convert since we're getting the value already in target currency

            convertedBreakdowns.push({
                amount: gasFee,
                count: 0,
                duration: 0,
                unit: 'gas fee'
            })
        }

        return new IReturnValue({
            message: "Success",
            success: true,
            data: {
                total: convertedBase + gasFee, // add gas fee to the calculated price
                breakdown: {
                    base: {
                        amount: convertedBase + gasFee,
                        currency: targetCurrency,
                        breakdown: convertedBreakdowns
                    },
                    // When we integrate dynamic discounts and addons, we can add the properties here
                }
            }
        })

    }

    private async calculateBasePrice(car: Car, start: Date, end: Date): Promise<{
        amount: number,
        currency: SupportedCurrencies,
        breakdown: {
            unit: string,
            duration: number,
            count: number,
            amount: number
        }[]
    }> {
        const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        const pricings = await this.pricingRepository.find({
            where: { car: { id: car.id } },
            order: { unit: 'ASC' }
        });

        let remaining = durationDays;
        let total = 0;
        const breakdown: {
            unit: string,
            duration: number,
            count: number,
            amount: number
        }[] = [];

        for (const unit of this.unitHierarchy) {
            const unitPricings = pricings.filter(p => p.unit === unit);
            if (!unitPricings.length) continue;

            const bestPricing = this.findBestPricing(unitPricings, remaining);
            if (!bestPricing) continue;

            const unitDays = this.getDaysFromPricing(bestPricing);
            const count = Math.floor(remaining / unitDays);

            if (count > 0) {
                const converted = await this.currencyService.convert(bestPricing.price, bestPricing.currency, SupportedFiatCurrencies.USD) // convert all pricings to USD in order to get a unique base for all
                total += count * converted;

                remaining -= count * unitDays;

                breakdown.push({
                    unit: bestPricing.unit,
                    duration: bestPricing.duration,
                    count,
                    amount: count * converted
                });
            }

            if (remaining <= 0) break;
        }

        if (remaining > 0) {
            const dailyPricing = pricings.find(p => p.unit === 'day') || pricings[0];

            const converted = await this.currencyService.convert(dailyPricing.price, dailyPricing.currency, SupportedFiatCurrencies.USD) //converts pricing to usd base price

            total += remaining * converted;

            breakdown.push({
                unit: 'day',
                duration: 1,
                count: remaining,
                amount: remaining * converted
            });
        }

        return {
            amount: total,
            currency: SupportedFiatCurrencies.USD,
            breakdown
        };
    }

    private findBestPricing(pricings: RentalPricing[], remainingDays: number) {
        const possible = pricings.filter(p =>
            this.getDaysFromPricing(p) <= remainingDays
        );

        return possible.sort((a, b) =>
            (a.price / this.getDaysFromPricing(a)) -
            (b.price / this.getDaysFromPricing(b))
        )[0];
    }

    private getDaysFromPricing(pricing: RentalPricing): number {
        return pricing.duration * this.unitDaysMap[pricing.unit];
    }
}
