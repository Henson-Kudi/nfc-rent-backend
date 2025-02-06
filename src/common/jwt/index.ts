import jwt, { SignOptions } from 'jsonwebtoken';
import { ITokenManager, JwtPayload, JwtType } from '@/types/global';
import envConf from '@/config/env.conf';

export class TokenManager implements ITokenManager {
  private readonly accessTokenPrivatekey: string;
  private readonly refreshTokenPrivatekey: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(config: {
    accessKey: string;
    refreshKey: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  }) {
    this.accessTokenPrivatekey = config.accessKey;
    this.refreshTokenPrivatekey = config.refreshKey;
    this.accessTokenExpiresIn = config.accessTokenExpiresIn;
    this.refreshTokenExpiresIn = config.refreshTokenExpiresIn;
  }

  generateToken(type: JwtType, payload: JwtPayload, options: SignOptions) {
    const secretKey =
      type === 'ACCESS_TOKEN'
        ? this.accessTokenPrivatekey
        : this.refreshTokenPrivatekey;
    const expiresIn =
      type === 'ACCESS_TOKEN'
        ? this.accessTokenExpiresIn
        : this.refreshTokenExpiresIn;
    return jwt.sign(payload, secretKey, {
      expiresIn,
      ...options,
    });
  }

  verifyJwtToken(type: JwtType, token: string) {
    const secretKey =
      type === 'ACCESS_TOKEN'
        ? this.accessTokenPrivatekey
        : this.refreshTokenPrivatekey;

    return jwt.verify(token, secretKey) as JwtPayload;
  }

  decodeJwtToken(token: string) {
    return jwt.decode(token) as JwtPayload;
  }
}

const tokenManager = new TokenManager({
  accessKey: envConf.ACCESS_TOKEN_PRIVATE_KEY,
  refreshKey: envConf.REFRESH_TOKEN_PRIVATE_KEY,
  accessTokenExpiresIn: envConf.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: envConf.REFRESH_TOKEN_EXPIRES_IN,
});

export default tokenManager;
