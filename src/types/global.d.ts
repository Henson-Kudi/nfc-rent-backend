import { JwtPayload as Payload, SignOptions } from 'jsonwebtoken';
import { Request } from 'express';

type SupportedLocales = 'en';

type PaginationOptions = {
  page?: number
  limit?: number
}

interface IUseCase<Input extends unknown[], Output> {
  execute(...args: Input): Promise<Output>;
}

interface IController<Output> {
  handle(request: Request): Output;
}

interface JwtPayload extends Payload {
  userId: string;
  roles?: string[];
  groups?: string[];
}

type JwtType = 'ACCESS_TOKEN' | 'REFRESH_TOKEN';

interface ITokenManager {
  generateToken(
    type: JwtType,
    payload: JwtPayload,
    options?: SignOptions
  ): string;

  verifyJwtToken(type: JwtType, token: string): JwtPayload;

  decodeJwtToken(token: string): JwtPayload;
}

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
  connect(): void;
}

// google provider
import { OAuth2Client } from 'google-auth-library';

export default interface IGoogleServicesManager {
  oAuthClient: OAuth2Client;
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

declare global {
  namespace Express {
    interface Request {
      deviceName?: string;
      deviceLocation?: string;
    }
  }
}
