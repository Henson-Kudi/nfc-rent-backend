import TOTPMFA from '@/modules/auth/application/providers/totp';
import speakeasy from 'speakeasy';
import { Service, Token } from 'typedi';


export const TOTPToken = new Token<TOTPMFA>()
@Service({
  id: TOTPToken, global: true
})
export class TOTP implements TOTPMFA {
  generateSecret(userEmail: string) {
    return speakeasy.generateSecret({
      issuer: `${userEmail}@HK_Solutions`,
    });
  }

  verifyOtp(token: string, secret: string) {
    return speakeasy.totp.verify({
      secret,
      token,
      encoding: 'base32',
    });
  }
}

const totp = new TOTP();

export default totp;
