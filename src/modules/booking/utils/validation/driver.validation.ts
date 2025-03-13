import Joi from "joi";
import { isBefore, isAfter, subYears, subMonths, differenceInYears } from "date-fns";
import { DriverType } from "@/common/enums";
import { CreateDriverDto } from "@/common/dtos";

const idNumberRegex = /^784\d{4}\d{6}[1-7]$/;

export const CreateDriverSchema = Joi.object<CreateDriverDto>({
    userId: Joi.string().uuid().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    dateOfBirth: Joi.date()
        .iso()
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
                .required()
                .messages({
                    "string.pattern.base": "idNumber for Residents must match the format: 784YYYYXXXXXXN",
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
        then: Joi.alternatives().try(Joi.date().iso(), Joi.string().empty("")).optional(),
        otherwise: Joi.date()
            .iso()
            .max(subMonths(new Date(), 6)) // At least 6 months old
            .required(),
    }),

    idExpiryDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.alternatives().try(Joi.date().iso(), Joi.string().empty("")).optional(),
        otherwise: Joi.date()
            .iso()
            .min(new Date()) // Must be in the future
            .when("driverType", {
                is: DriverType.RESIDENT,
                then: Joi.date()
                    .iso()
                    .custom((value, helpers) => {
                        const { idIssueDate } = helpers.state.ancestors[0];
                        if (idIssueDate && differenceInYears(new Date(value), new Date(idIssueDate)) < 2) {
                            return helpers.error("date.invalid", { message: "Resident ID must be valid for at least 2 years" });
                        }
                        return value;
                    }),
            })
            .required(),
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
        .required(),

    licenseExpiryDate: Joi.date()
        .iso()
        .min(new Date()) // Must be in the future
        .required(),

    licenseFrontImage: Joi.string().required(),
    licenseBackImage: Joi.string().required(),

    passportNumber: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),

    passportIssueDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.date().iso().max(new Date()).required(),
        otherwise: Joi.date().optional(),
    }),

    passportExpiryDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.date().iso().min(new Date()).required(),
        otherwise: Joi.date().optional(),
    }),

    passportFrontImage: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),

    passportBackImage: Joi.string().optional(),

    visaNumber: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),

    visaIssueDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.date().iso().max(new Date()).required(),
        otherwise: Joi.date().optional(),
    }),

    visaExpiryDate: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.date().iso().min(new Date()).required(),
        otherwise: Joi.date().optional(),
    }),

    visaImage: Joi.alternatives().conditional("driverType", {
        is: DriverType.TOURIST,
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),

    isDefault: Joi.boolean().required(),

    additionalDocuments: Joi.array()
        .items(
            Joi.object({
                url: Joi.string().uri().required(),
                type: Joi.string().required(),
                documentNumber: Joi.string().required(),
                expiryDate: Joi.date().iso().required(),
            })
        )
        .optional(),
});
