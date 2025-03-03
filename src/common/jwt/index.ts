import envConf from '@/config/env.conf';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { Service, Token } from 'typedi';

export const TokenManagerToken = new Token<ITokenManager>()
@Service({ id: TokenManagerToken, global: true })
export class TokenManager implements ITokenManager {
  private readonly accessTokenPrivatekey: string;
  private readonly refreshTokenPrivatekey: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    this.accessTokenPrivatekey = envConf.ACCESS_TOKEN_PRIVATE_KEY;
    this.refreshTokenPrivatekey = envConf.REFRESH_TOKEN_PRIVATE_KEY;
    this.accessTokenExpiresIn = envConf.ACCESS_TOKEN_EXPIRES_IN;
    this.refreshTokenExpiresIn = envConf.REFRESH_TOKEN_EXPIRES_IN;
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
