export default interface IPasswordManager {
  generatePassword(length: number): string; // Generates a random password
  encryptPassword(password: string): Promise<string>; // enmcrypts a password string
  comparePasswords(
    password: string,
    encryptedPassword: string
  ): Promise<boolean>; //Validates a hashed password
  isValidPassword(password: string): boolean; //Checks if password is as per required regex
}
