import { CarHistoryRecordType } from "@/common/enums";
import { Expose } from "class-transformer";
import { BaseDto } from "./base.dto";
import { carHistoryRecordTranslations } from "@/common/utils/translations/car/car-history-record.translation";
import { LocalizedEnum } from "@/common/utils/localized-enum.decorator";
import { CarDocumentDto } from ".";

export class CarHistoryRecordDto extends BaseDto {
    @Expose()
    @LocalizedEnum(carHistoryRecordTranslations)
    type!: CarHistoryRecordType;
    @Expose()
    date!: Date;
    @Expose()
    description!: string;
    @Expose()
    mileageAtTime?: number;
    @Expose()
    cost?: {
        amount: number;
        currency: string;
    };
    performedBy?: string;
    @Expose()
    documents?: CarDocumentDto[];
    @Expose()
    nextScheduledDate?: Date;
}