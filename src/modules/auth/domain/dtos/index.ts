import { LoginType, OTPType } from '@/common/enums';
import Joi from 'joi';
import {
  RequestOTPSchema,
  OTPValidationSchema,
  ChangePasswordSchema,
  LoginSchema,
  RegisterUserSchema,
  LogoutSchema,
} from '@/modules/auth/utils/validations/otp';

export class RegisterUserDto {
  fullName: string;
  email: string;
  phone: string;
  photo?: string;
  password: string;
  confirmPassword: string;
  roles?: string[];

  constructor(init: RegisterUserData) {
    this.fullName = init.fullName;
    this.email = init.email;
    this.phone = init.phone;
    this.photo = init?.photo;
    this.password = init.password;
    this.confirmPassword = init.confirmPassword;
    this.roles = init.roles;
  }

  validate() {
    return RegisterUserSchema.validateAsync(this, { abortEarly: false });
  }
}

export class LoginDto {
  email?: string;
  password?: string;
  loginType: LoginType;
  idToken?: string;
  deviceName: string;
  location: string;

  constructor(data: LoginData) {
    this.email = data?.email;
    this.password = data?.password;
    this.loginType = (data?.loginType as LoginType) || LoginType.EMAIL;
    this.idToken = data?.idToken;
    this.deviceName = data.deviceName || 'unknown';
    this.location = data?.location || 'unknown';
  }

  validate() {
    return LoginSchema.validateAsync(this);
  }
}

export class LogoutDTO {
  userId: string;
  deviceName: string;
  location: string;

  constructor(data: LogoutData) {
    this.userId = data?.userId;
    this.deviceName = data.deviceName || 'unknown';
    this.location = data?.location || 'unknown';
  }

  validate() {
    return LogoutSchema.validateAsync(this);
  }
}

export class ResetPasswordDto {
  email: string;

  constructor(data: { email: string }) {
    this.email = data.email;
  }

  validate() {
    return Joi.string().email().required().validate(this.email);
  }
}

export class ChangePasswordDto {
  oldPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
  userId: string;

  constructor(data: ChangePasswordData) {
    this.oldPassword = data?.oldPassword;
    this.newPassword = data.newPassword;
    this.userId = data.userId;
    this.confirmNewPassword = data.confirmNewPassword;
  }

  validate() {
    return ChangePasswordSchema.validateAsync(this);
  }
}

type AuthToken = {
  value: string;
  expireAt: Date;
};

export class TokenDto {
  accessToken: AuthToken;
  refreshToken: AuthToken;

  constructor(data: Omit<TokenDto, 'validate'>) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
  }
}

export class OTPVerificationDto {
  email?: string;
  userId?: string;
  token?: string;
  code: string;
  deviceName?: string;
  location?: string;
  type: OTPType;

  constructor(data: OTPValidationData) {
    this.token = data.token;
    this.deviceName = data.deviceName;
    this.userId = data?.userId;
    this.email = data?.email;
    this.location = data?.location;
    this.type = (data.type as OTPType) || OTPType.EMAIL;
    this.code = data.code;
  }

  validate() {
    return OTPValidationSchema.validateAsync(this, {
      abortEarly: false,
    });
  }
}

export class RequestOTPDto {
  email?: string;
  userId?: string;
  phone?: string;
  type: 'email' | 'phone';

  constructor(data: RequestOTPData) {
    this.type = data.type || 'email';
    this.userId = data?.userId;
    this.email = data?.email;
    this.phone = data?.phone;
  }

  validate() {
    return RequestOTPSchema.validateAsync(this, {
      abortEarly: false,
    });
  }
}
