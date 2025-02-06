// This function should generate a string of random numbers with given length
export default function generateRandomNumber(length: number = 6): string {
  if (length < 1) {
    throw new Error('Length must be a positive integer');
  }
  if (length > 10) {
    throw new Error('Length must be less than or equal to 10');
  }
  const min = Math.pow(10, length - 1);

  const max = Math.pow(10, length) - 1;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  const string = randomNumber.toString();

  if (string.length < length) {
    return '0'.repeat(length - string.length) + string;
  }

  return string;
}

export const ORGANISATION_MODULE_NAMES = {
  products: 'products',
  shops: 'shops',
  // orders: 'orders',
  // settings: 'settings',
} as const
