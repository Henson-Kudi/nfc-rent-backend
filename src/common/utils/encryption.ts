import envConf from '@/config/env.conf';
import CryptoJS from 'crypto-js';

const SECRET_KEY = envConf.CRYPTO_ENCRYPTION_KEY;

export function encryptData(data: Record<'data', unknown>): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
}

export function decryptData<T = unknown>(encryptedData: string): T {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))?.data as T;
}
