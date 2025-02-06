import TOTPMFA from '@/modules/auth/application/providers/totp';
import speakeasy from 'speakeasy';

class TOTP implements TOTPMFA {
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
