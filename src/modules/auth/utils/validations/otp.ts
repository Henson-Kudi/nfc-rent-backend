import { LoginType } from '@prisma/client';
import { OTPType } from '@/common/enums';
import Joi from 'joi';
import { passwordRegex } from '@/common/utils';

const passwordValidator = Joi.string()
  .min(8)
  .max(52)
  .pattern(passwordRegex)
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 52 characters',
    'string.pattern.base': `Password must contain lowercase, uppercase, number, and special character`,
  });

const nameRegex = /^[a-zA-Z\u00C0-\u017F\s]{2,100}$/;

const nameValidator = Joi.string().min(2).max(100).pattern(nameRegex).messages({
  'string.min': 'Name must be at least 2 characters long',
  'string.max': 'Name cannot exceed 100 characters',
  'string.pattern.base': 'Name cannot contain dangerous special characters',
});

type OTPValidationSchema = {
  token?: string;
  deviceName: string;
  userId?: string;
  email?: string;
  location: string;
  code: string;
  [key: string]: unknown;
};

type RegisterUserSchema = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  password: string;
  confirmPassword: string;
  [key: string]: unknown;
};

type LoginSchema = {
  email?: string;
  password?: string;
  loginType: LoginType;
  idToken?: string; // google login token
  deviceName: string;
  location: string;
  [key: string]: unknown;
};

type LogoutSchema = {
  userId: string;
  deviceName: string;
  location: string;
  [key: string]: unknown;
};

type RequestOTPSchema = {
  email?: string;
  userId?: string;
  phone?: string;
  type: 'email' | 'phone';
};

type ChangePasswordSchema = {
  oldPassword?: string;
  newPassword: string;
  userId: string;
  confirmNewPassword: string;
};

export const RegisterUserSchema = Joi.object<RegisterUserSchema>({
  firstName: nameValidator.required(),
  lastName: nameValidator.required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  photo: Joi.string().optional().allow('').allow(null),
  password: passwordValidator.required(),
  confirmPassword: passwordValidator
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': 'Confirm password must match password',
    }),
}).unknown();

export const LoginSchema = Joi.object<LoginSchema>({
  deviceName: Joi.string().required(),
  email: Joi.string().when('loginType', {
    is: LoginType.EMAIL,
    then: Joi.string().email().required(),
    otherwise: Joi.string().email().optional().allow('').allow(null),
  }),
  location: Joi.string().required(),
  loginType: Joi.string()
    .valid(...Object.values(LoginType))
    .required(),
  password: passwordValidator.when('loginType', {
    is: LoginType.EMAIL,
    then: passwordValidator.required(),
    otherwise: passwordValidator.optional().allow('').allow(null),
  }),

  idToken: Joi.string().when('loginType', {
    is: LoginType.GOOGLE,
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('').allow(null),
  }),
}).unknown();

export const LogoutSchema = Joi.object<LogoutSchema>({
  deviceName: Joi.string().required(),
  userId: Joi.string().required(),
  location: Joi.string().required(),
}).unknown();

export const OTPValidationSchema = Joi.object<OTPValidationSchema>({
  code: Joi.string().required().max(6),
  token: Joi.string().optional(),
  deviceName: Joi.string().required(),
  userId: Joi.string().optional(),
  email: Joi.string().email().optional(),
  location: Joi.string().required(),
  type: Joi.string()
    .valid(...Object.values(OTPType))
    .required(),
});

export const RequestOTPSchema = Joi.object<RequestOTPSchema>({
  type: Joi.string().valid('email', 'phone').required(),
  userId: Joi.string().optional().allow('').allow(null),
  email: Joi.string().email().optional().allow('').allow(null),
  phone: Joi.string().optional().allow('').allow(null),
})
  .or('email', 'userId', 'phone')
  .unknown();

export const ChangePasswordSchema = Joi.object<ChangePasswordSchema>({
  oldPassword: passwordValidator.optional().allow('').allow(null),
  newPassword: passwordValidator.required(),
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).messages({
    'any.only': 'Confirm password must match password',
  }),
  userId: Joi.string().required(),
}).unknown();
