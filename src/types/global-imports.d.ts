import 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { IncomingHttpHeaders } from 'http';
import { Request } from 'express';
import { User } from '@/common/entities';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: string;
    roles?: string[];
    groups?: string[];
  }
}

// Adding custom options to class-transformer package
declare module 'class-transformer' {
  export interface ClassTransformOptions {
    locale?: SupportedLocales;
    defaultLocale?: SupportedLocales;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    headers: IncomingHttpHeaders & {
      'x-device-name'?: string;
      'x-device-location'?: string;
      'x-device-os'?: string;
      'x-user-id'?: string;
      'x-user-roles'?: string;
      'x-user-groups'?: string;
      'x-user-permissions'?: string;
    };
    user?: User;
  }
}

declare global {
  interface IGoogleServicesManager {
    oAuthClient: OAuth2Client;
  }

  interface IController<Output> {
    handle(request: Request): Output;
  }

  interface ITokenManager {
    generateToken(
      type: JwtType,
      payload: JwtPayload,
      options?: SignOptions
    ): string;

    verifyJwtToken(type: JwtType, token: string): JwtPayload;

    decodeJwtToken(token: string): JwtPayload;
  }
}
