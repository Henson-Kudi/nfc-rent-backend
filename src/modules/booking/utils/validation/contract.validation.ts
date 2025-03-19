import { CreateContractVoilationDto } from "@/common/dtos/contract-violation.dto";
import { CreateContractDto } from "@/common/dtos/contract.dto";
import { ContractViolationType, MediaType } from "@/common/enums";
import Joi, { AsyncValidationOptions } from "joi";

const CreateContractViolationSchema = Joi.object<CreateContractVoilationDto>({
    amount: Joi.number().min(0).precision(2).required(),
    description: Joi.string().optional().allow(null),
    evidences: Joi.array().items(Joi.object<CreateContractVoilationDto['evidences'][0]>({
        type: Joi.string().valid(MediaType.AUDIO, ...Object.values(MediaType)).required(),
        url: Joi.string().required()
    })).min(1).required(),
    isDeducted: Joi.boolean().optional().allow(null),
    isPaid: Joi.boolean().optional().allow(null),
    processingFee: Joi.number().precision(2).min(0).optional().allow(null),
    totalUnits: Joi.number().integer().min(0).required(),
    violationDate: Joi.date().iso().optional().allow(null),
    violationType: Joi.string().valid(ContractViolationType.BORDER_CROSSING, Object.values(ContractViolationType))
})

const CarDamageSchema = Joi.object<CarDamage>({
    description: Joi.string().optional().allow('').allow(null),
    images: Joi.array().items(Joi.string().min(5)).optional().allow(null),
    policeReport: Joi.string().required(),
    position: Joi.object<CarDamage['position']>({
        x: Joi.number().required(),
        y: Joi.number().required(),
        z: Joi.number().optional().allow(null)
    }).optional().allow(null),
    title: Joi.string().required()
})


export const NewContractSchema = Joi.object<CreateContractDto>({
    additionalDriverSign: Joi.string().optional().allow('').allow(null),
    bookingId: Joi.string().required(),
    clientSignature: Joi.string().optional().allow('').allow(null),
    damages: Joi.array().items(CarDamageSchema).optional().allow(null),
    fuelLevelPickup: Joi.number().precision(2).min(0).required(),
    fuelLevelReturn: Joi.number().precision(2).optional().allow(null),
    mileageAtPickup: Joi.number().integer().min(0).required(),
    mileageAtReturn: Joi.number().integer().min(0).optional().allow(null),
    signedAt: Joi.date().iso().optional().allow(null),
    templatePath: Joi.string().optional().allow(null),
    violations: Joi.array().items(CreateContractViolationSchema).optional().allow(null),

}).unknown();

export const validateCreateContract = (dto: Partial<CreateContractDto>, options?: AsyncValidationOptions) => NewContractSchema.validateAsync(dto, {
    abortEarly: false,
    ...(options || {}),
})

export const validateCreateContractVoilation = (dto: Partial<CreateContractVoilationDto>, options?: AsyncValidationOptions) => CreateContractViolationSchema.validateAsync(dto, {
    abortEarly: false,
    ...(options || {}),
})