import Joi from "joi";
import { isBefore, isAfter, subYears, subMonths, differenceInYears, getYear, addDays } from "date-fns";
import { DriverType } from "@/common/enums";
import { CreateDriverDto } from "@/common/dtos";

const idNumberRegex = /^784\d{4}\d{6}[1-7]$/;

export const CreateDriverSchema = Joi.object<CreateDriverDto>({
    userId: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    dateOfBirth: Joi.date()
        .max(subYears(new Date(), 18)) // At least 18 years old
        .required(),
    country: Joi.string().required(),
    driverType: Joi.string()
        .valid(DriverType.GCC, DriverType.TOURIST, DriverType.RESIDENT)
        .required(),

    idNumber: Joi.alternatives().conditional("driverType", [
        {
            is: DriverType.RESIDENT,
            then: Joi.string()
                .pattern(idNumberRegex)
                .custom((val, helpers) => {
                    const { dateOfBirth } = helpers.state.ancestors[0]
                    const year = getYear(new Date(dateOfBirth)).toString()
                    const eidYear = val?.slice(3, 7) //gets the year digit of eid
                    if (eidYear !== year) {
                        return helpers.error("string.mismatchId", { message: "Date of birth does not match with id number" });
                    }
                })
                .required()
                .messages({
                    "string.pattern.base": "idNumber for Residents must match the format: 784YYYYXXXXXXN",
                    'string.mismatchId': "Date of birth does not match with eid number"
                }),
        },
        {
            is: Joi.valid(DriverType.GCC, DriverType.RESIDENT),
            then: Joi.string().required(),
        },
        {
            is: DriverType.TOURIST,
            then: Joi.string().optional(),
        },
    ]),

    idIssueDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.alternatives().try(Joi.date(), Joi.string().empty("")).optional().allow(null),
        otherwise: Joi.date()
            .custom((val, helpers) => {
                if (isAfter(new Date(val), new Date())) {
                    return helpers.error('date.idIssueInFuture')
                }
                return val
            }) // id must be issued in the past
            .required().messages({
                'date.idIssueInFuture': 'id issue date must not be in the future'
            }),
    }),

    idExpiryDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.date().optional().allow(null),
        otherwise: Joi.date()
            .custom((val, helpers) => {
                if (isBefore(new Date(val), new Date())) {
                    return helpers.error('date.expiredId')
                }
                return val
            }) // Must be in the future
            .when("driverType", {
                is: DriverType.RESIDENT,
                then: Joi.date()
                    .custom((value, helpers) => {
                        const { idIssueDate } = helpers.state.ancestors[0];
                        if (differenceInYears(addDays(new Date(value), 1), new Date(idIssueDate)) < 2) {
                            return helpers.error("date.invalidEid");
                        }
                        return value;
                    })
            })
            .required().messages({
                'date.expiredId': "ID is expired",
                'date.invalidEid': 'Eid must be valid for at least 2 years'
            }),
    }),

    idFrontImage: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.string().optional(),
        otherwise: Joi.string().required(),
    }),

    idBackImage: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.string().optional(),
        otherwise: Joi.string().required(),
    }),

    licenseNumber: Joi.string().required(),

    licenseIssueDate: Joi.date()
        .iso()
        .max(subMonths(new Date(), 6)) // At least 6 months old
        .required().messages({
            "date.max": "License issue date must be at least 6 months old.",
        }),

    licenseExpiryDate: Joi.date()
        .iso()
        .max(new Date()) // Must be in the future
        .required().messages({
            'date.max': "License is expired"
        }),

    licenseFrontImage: Joi.string().required(),
    licenseBackImage: Joi.string().required(),

    passportNumber: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.string().required(),
        otherwise: Joi.string().optional().allow('').allow(null),
    }),

    passportIssueDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.date().custom((val, helpers) => {
            if (isAfter(new Date(val), new Date())) {
                return helpers.error('date.inPast')
            }
            return val
        }).required().messages({
            'date.inPast': 'Passport issue date cannot be in the future'
        }),
        otherwise: Joi.date().optional().allow(null),
    }),

    passportExpiryDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.date().max(new Date()).required(), // must be in future or today
        otherwise: Joi.date().optional().allow(null),
    }),

    passportFrontImage: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.string().required(),
        otherwise: Joi.string().optional().allow('').allow(null),
    }),

    passportBackImage: Joi.string().optional().allow('').allow(null),

    visaNumber: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.string().required(),
        otherwise: Joi.string().optional().allow('').allow(null),
    }),

    visaIssueDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.date().iso().min(new Date()).required(),
        otherwise: Joi.date().optional().allow(null),
    }),

    visaExpiryDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.date().iso().max(new Date()).required(),
        otherwise: Joi.date().optional().allow(null),
    }),

    visaImage: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.string().required(),
        otherwise: Joi.string().optional().allow('').allow(null),
    }),

    isDefault: Joi.boolean().optional(),

    additionalDocuments: Joi.array()
        .items(
            Joi.object({
                url: Joi.string().uri().required(),
                type: Joi.string().required(),
                documentNumber: Joi.string().required(),
                expiryDate: Joi.date().iso().required(),
            })
        )
        .optional().allow(null),
}).unknown();
