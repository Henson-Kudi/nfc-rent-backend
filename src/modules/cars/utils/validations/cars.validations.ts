import Joi from "joi";
import { localeValidator } from ".";
import { CarCategory, CarCondition, CarDocumentType, CarInspectionStatus, CarListingType, CarStatus, FuelType, MediaType, TransmissionType } from "@/common/enums";

const carColorValidation = Joi.object<CarColor>({
    code: Joi.string().optional().allow(null).allow(''),
    name: Joi.string().required()
})

const carTranslationItem = Joi.object<CarTranslationDTO>({
    locale: localeValidator.required(),
    name: Joi.string().required().min(2).max(100).messages({
        'string.min': 'Car name must be at least 2 characters',
        'string.max': 'Car name cannot be more than 100 characters',
    }),
    color: carColorValidation.required(),
    interiorColor: carColorValidation.required(),
    description: Joi.string().optional().allow('').allow(null),
    metaDescription: Joi.string().optional().allow('').allow(null),
    metaTags: Joi.string().optional().allow('').allow(null),
    metaTitle: Joi.string().optional().allow('').allow(null),
    shortDescription: Joi.string().optional().allow('').allow(null)
})

const carDimentionValidator = Joi.object<CarDimension>({
    cargoCapacity: Joi.number().positive().precision(2).required(),
    height: Joi.number().positive().precision(2).required(),
    length: Joi.number().positive().precision(2).required(),
    weight: Joi.number().positive().precision(2).required(),
    width: Joi.number().positive().precision(2).required()
})

const carEngineSpecsValidator = Joi.object<CarEngineSpecs>({
    acceleration: Joi.number().positive().precision(2).required(),
    batteryCapacity: Joi.number().positive().precision(2).optional().allow(null),
    displacement: Joi.number().positive().precision(2).optional().allow(null),
    horsepower: Joi.number().positive().precision(2).required(),
    range: Joi.number().positive().precision(2).optional().allow(null),
    topSpeed: Joi.number().positive().precision(2).required(),
    torque: Joi.number().positive().precision(2).required(),
    type: Joi.string().required()
})

const carDocumentValidator = Joi.object<CarDocument>({
    expiryDate: Joi.date().optional().allow(null).allow(''),
    fileUrl: Joi.string().required(),
    issueDate: Joi.date().required(),
    isVerified: Joi.boolean().optional().allow(null),
    title: Joi.string().required(),
    type: Joi.string().valid(CarDocumentType.ACCIDENT, ...Object.values(CarDocumentType)).required(),
    verificationDate: Joi.date().optional().allow(null).allow(''),
})

const carMediaValidator = Joi.object<CarMedia>({
    description: Joi.string().optional().allow(null).allow(''),
    isThumbnail: Joi.boolean().optional().allow(null),
    position: Joi.number().min(0).required(),
    title: Joi.string().optional().allow('').allow(null),
    type: Joi.string().valid(MediaType.IMAGE, ...Object.values(MediaType).filter(itm => ![MediaType.AUDIO, MediaType.DOCUMENT, MediaType.PDF, MediaType.OTHER].includes(itm))).required(),
    url: Joi.string().required()
})

const carOwnerValidator = Joi.object<CarOwnerDetail>({
    acquiredDate: Joi.date().required(),
    nftId: Joi.string().optional().allow('').allow(null),
    ownerId: Joi.string().required(),
    ownerType: Joi.string().valid("User", "Company").required(),
    percentage: Joi.number().positive().required(),
    status: Joi.string().valid("Active", "Pending", "Transferred").optional().allow(null),
    transferDate: Joi.date().optional().allow(null).allow('')
})

const carPriceValidator = Joi.object<RentalPricing>({
    currency: Joi.string().required(),
    duration: Joi.number().positive().min(1).precision(0).required(),
    price: Joi.number().positive().required(),
    unit: Joi.string().valid("year", "hour", "day", "week", "month")
})

export const CreateCarSchema = Joi.object<CreateCarDTO>({
    acquisitionDate: Joi.string().optional().custom(val => !isNaN(new Date(val).getTime()), 'must be a valid date').allow(null).allow(''),
    blockchainId: Joi.string().optional().allow('').allow(null),
    category: Joi.string().valid(CarCategory.CONVERTIBLE, ...Object.values(CarCategory)).required(),
    condition: Joi.string().valid(CarCondition.EXCELLENT, ...Object.values(CarCondition)).required(),
    currentStatus: Joi.string().valid(CarStatus.AVAILABLE, ...Object.values(CarStatus)).optional().allow(null),
    dimensions: carDimentionValidator.required(),
    documents: Joi.array().required().items(carDocumentValidator).optional().allow(null),
    doors: Joi.number().positive().min(1).precision(0).required(),
    engineSpecs: carEngineSpecsValidator.required(),
    features: Joi.array().items(Joi.string().required()).min(1).required(),
    fuelType: Joi.string().valid(FuelType.DIESEL, ...Object.values(FuelType)).required(),
    inspectionStatus: Joi.string().valid(CarInspectionStatus.EXEMPTED, ...Object.values(CarInspectionStatus)).optional().allow(null),
    lastInspectionDate: Joi.date().optional().allow('').allow(null),
    listingType: Joi.string().valid(CarListingType.FOR_RENT, ...Object.values(CarListingType)).optional().allow('').allow(null),
    media: Joi.array().items(carMediaValidator).optional().allow(null),
    metaverseAssetId: Joi.string().optional().allow(null).allow(''),
    mileage: Joi.number().min(0).precision(0).optional().allow(null),
    model: Joi.string().required(),
    nextInspectionDueDate: Joi.date().optional().allow(null).allow(''),
    owner: carOwnerValidator.optional().allow(null),
    rentalPricings: Joi.array().items(carPriceValidator).required(),
    seats: Joi.number().positive().precision(0).required(),
    translations: Joi.array().required().items(carTranslationItem).min(1).has(Joi.object({ locale: Joi.string().valid('en').required() }).unknown(true)).required().messages({
        'array.hasUnknown': 'At least one translation must have the locale set to "en"',
    }),
    transmission: Joi.string().valid(TransmissionType.AUTOMATIC, ...Object.values(TransmissionType)).required(),
    vin: Joi.string().required(),
    year: Joi.number().positive().precision(0).required()
}).unknown()