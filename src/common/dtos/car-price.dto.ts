import { CarPricingUnit } from "@/common/enums";
import { LocalizedEnum } from "@/common/utils/localized-enum.decorator";
import { pricingUnitTranslations } from "@/common/utils/translations/pricing-unit.translation";
import { Expose } from "class-transformer";

export class RentalPricingDto {
    @Expose()
    duration!: number;
    @Expose()
    @LocalizedEnum(pricingUnitTranslations)
    unit!: CarPricingUnit;
    @Expose()
    price!: number;
    @Expose()
    currency!: string;
    @Expose()
    mileageLimit!: number;
}