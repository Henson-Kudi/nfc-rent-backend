// import { JwtPayload as Payload, SignOptions } from 'jsonwebtoken';
// import { Request } from 'express';

type SupportedLocales = 'en' | 'fr' | 'es' | 'zh' | 'it' | 'ar' | 'ru';

type PaginationOptions = {
  page?: number
  limit?: number
}

interface IUseCase<Input extends unknown[], Output> {
  execute(...args: Input): Promise<Output>;
}

type JwtType = 'ACCESS_TOKEN' | 'REFRESH_TOKEN';

type ModuleNode = {
  name: string;
  path: string;
  children?: ModuleTree;
};

type ModuleTree = {
  [key: string]: ModuleNode
};

interface MessageHandler {
  (message: string, channel: string): Promise<void>;
}

interface PublishedMessage<Data> {
  data: Data;
}

interface IMessageBroker {
  publishMessage<Data = unknown>(
    channel: string,
    message: PublishedMessage<Data>
  ): Promise<void>;
  subscribe(channel: string, callback: MessageHandler): Promise<void>;
  disconnect(): Promise<void>;
  quit(): Promise<void>;
  connect(): Promise<void>;
}

// Authentication modules
type OTPValidationData = {
  token?: string;
  deviceName: string;
  userId?: string;
  email?: string;
  location: string;
  code: string;
  type: string
  [key: string]: unknown;
};

type RegisterUserData = {
  fullName: string;
  email: string;
  phone: string;
  photo?: string;
  password: string;
  confirmPassword: string;
  roles?: string[]
  [key: string]: unknown;
};

type LoginData = {
  email?: string;
  password?: string;
  loginType: LoginType;
  idToken?: string; // google login token
  deviceName: string;
  location: string;
  [key: string]: unknown;
};

type LogoutData = {
  userId: string;
  deviceName: string;
  location: string;
  [key: string]: unknown;
};

type RequestOTPData = {
  email?: string;
  userId?: string;
  phone?: string;
  type: 'email' | 'phone';
};

type ChangePasswordData = {
  oldPassword?: string;
  newPassword: string;
  userId: string;
  confirmNewPassword: string;
};

// User module types
interface UpdateUserData {
  fullName?: string
  photo?: string
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'production' | 'development';
    PORT: string | number;
    REDIS_URL: string;
    ACCESS_TOKEN_PRIVATE_KEY?: string;
    REFRESH_TOKEN_PRIVATE_KEY?: string;
    ACCESS_TOKEN_EXPIRES_IN?: string;
    REFRESH_TOKEN_EXPIRES_IN?: string;
    GOOGLE_AUTH_CLIENT_ID?: string;
    GOOGLE_AUTH_CLIENT_SECRET?: string;
    DEFAULT_EMAIL_SENDER?: string;
    DEFAULT_SMS_SENDER?: string;
    DEFAULT_WHATSAPP_SENDER?: string;
    CRYPTO_ENCRYPTION_KEY?: string;
    DATABASE_SERVER_URL?: string
    DATABASE_URL?: string
  }
}

// Entities
interface ITranslationEntity<T> {
  id: string;
  locale: string;
  parent: T; // Generic parent reference (type only)
}

