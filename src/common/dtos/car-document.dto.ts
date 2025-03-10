import { CarDocumentType } from "@/common/enums";
import { Expose } from "class-transformer";
import { carDocumentTranslations } from "@/common/utils/translations/car/car-document.translation";
import { LocalizedEnum } from "@/common/utils/localized-enum.decorator";
import { BaseDto } from "./base.dto";

export class CarDocumentDto extends BaseDto {
    @Expose()
    @LocalizedEnum(carDocumentTranslations)
    type!: CarDocumentType;
    @Expose()
    title!: string;
    @Expose()
    fileUrl!: string;
    @Expose()
    issueDate!: Date;
    @Expose()
    expiryDate?: Date;
    @Expose()
    isVerified!: boolean;
    @Expose()
    verificationDate?: Date;
}