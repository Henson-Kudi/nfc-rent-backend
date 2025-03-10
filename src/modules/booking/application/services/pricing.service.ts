import { Booking, Car, RentalPricing } from "@/common/entities";
import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import { CurrencyService } from "./currency.service";

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
        private currencyService: CurrencyService
    ) { }

    async calculateTotalPrice(
        car: Car,
        startDate: Date,
        endDate: Date,
        selectedAddons: Booking['selectedAddons'],
        targetCurrency: string
    ) {
        const basePrice = await this.calculateBasePrice(car, startDate, endDate);
        const addonsPrice = await this.calculateAddonsPrice(
            car,
            selectedAddons,
            startDate,
            endDate,
            targetCurrency
        );

        const convertedBase = await this.currencyService.convert(
            basePrice.amount,
            basePrice.currency,
            targetCurrency
        );

        return {
            total: convertedBase + addonsPrice,
            breakdown: {
                base: basePrice,
                addons: addonsPrice
            }
        };
    }

    private async calculateBasePrice(car: Car, start: Date, end: Date) {
        const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        const pricings = await this.pricingRepository.find({
            where: { car: { id: car.id } },
            order: { unit: 'ASC' }
        });

        let remaining = durationDays;
        let total = 0;
        const breakdown: any[] = [];

        for (const unit of this.unitHierarchy) {
            const unitPricings = pricings.filter(p => p.unit === unit);
            if (!unitPricings.length) continue;

            const bestPricing = this.findBestPricing(unitPricings, remaining);
            if (!bestPricing) continue;

            const unitDays = this.getDaysFromPricing(bestPricing);
            const count = Math.floor(remaining / unitDays);

            if (count > 0) {
                total += count * bestPricing.price;
                remaining -= count * unitDays;
                breakdown.push({
                    unit: bestPricing.unit,
                    duration: bestPricing.duration,
                    count,
                    amount: count * bestPricing.price
                });
            }

            if (remaining <= 0) break;
        }

        if (remaining > 0) {
            const dailyPricing = pricings.find(p => p.unit === 'day') || pricings[0];
            total += remaining * dailyPricing.price;
            breakdown.push({
                unit: 'day',
                duration: 1,
                count: remaining,
                amount: remaining * dailyPricing.price
            });
        }

        return {
            amount: total,
            currency: pricings[0]?.currency || 'USD',
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

    private async calculateAddonsPrice(
        car: Car,
        selectedAddons: Booking['selectedAddons'],
        start: Date,
        end: Date,
        targetCurrency: string
    ) {
        const rentalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        let totalAddons = 0;

        if (selectedAddons?.length) {
            for (const selection of selectedAddons) {
                const addon = car?.availableAddons?.find(a => a.id === selection.addonId);
                if (!addon) continue;

                const priceOption = addon.priceOptions[selection.priceOptionIndex];
                if (!priceOption) continue;

                let amount = priceOption.amount;

                // Calculate based on pricing type
                if (priceOption.type === 'per_day') {
                    amount *= rentalDays;
                }

                // Apply quantity if applicable
                if (selection.quantity) {
                    amount *= selection.quantity;
                }

                // Convert currency
                totalAddons += await this.currencyService.convert(
                    amount,
                    priceOption.currency,
                    targetCurrency
                );
            }
        }

        return totalAddons;
    }
}
