import { GeneratedSecret } from 'speakeasy';

export default interface TOTPMFA {
  generateSecret(userEmail: string): GeneratedSecret;
  verifyOtp(otp: string, secretKey: string): boolean;
}
