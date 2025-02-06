import bcrypt from 'bcrypt';
import { AppError, passwordRegex } from '@/common/utils';
import IPasswordManager from '@/modules/auth/application/providers/passwordManager';
import { ResponseCodes } from '@/common/enums';

class PasswordManager implements IPasswordManager {
  private readonly saltRounds: number = 12;
  private passwordRetryCounts = 10;

  generatePassword(length: number): string {
    if (length < 8) {
      throw new AppError({
        message: 'Password length must be at least 8 characters long',
        statusCode: ResponseCodes.BadRequest,
      });
    }
    // This function should generate and return a string which is at least 8 characters long and must have pass passwordRegex test
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    if (!passwordRegex.test(password) && this.passwordRetryCounts > 0) {
      this.passwordRetryCounts--;
      return this.generatePassword(length);
    }

    this.passwordRetryCounts = 10;

    return password;
  }

  encryptPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  comparePasswords(
    password: string,
    encryptedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, encryptedPassword);
  }

  isValidPassword(password: string): boolean {
    return passwordRegex.test(password);
  }
}

const passwordManager = new PasswordManager();

export default passwordManager;
