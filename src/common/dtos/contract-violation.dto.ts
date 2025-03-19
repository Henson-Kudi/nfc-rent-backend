import { ContractViolationType, MediaType } from "../enums";
import { BaseDto } from "./base.dto";
import { Expose } from "class-transformer";
import { LocalizedEnum } from "../utils/localized-enum.decorator";
import { ContractVoilationTranslation } from "../utils/translations/contract-voilation.translation";

export class ContractViolationDto extends BaseDto {
    @Expose()
    @LocalizedEnum(ContractVoilationTranslation)
    violationType!: ContractViolationType
    @Expose()
    description?: string
    @Expose()
    amount!: number
    @Expose()
    totalUnits!: number
    @Expose()
    processingFee!: number
    @Expose()
    totalCharge!: number
    @Expose()
    evidences!: { type: MediaType, url: string }[]
    @Expose()
    isPaid!: boolean
    @Expose()
    isDeducted!: boolean
    @Expose()
    violationDate?: Date
}

export class CreateContractVoilationDto {
    violationType!: ContractViolationType
    amount!: number
    totalUnits!: number
    processingFee?: number
    evidences!: { type: MediaType, url: string }[]
    description?: string
    isPaid?: boolean
    isDeducted?: boolean
    violationDate?: Date
}