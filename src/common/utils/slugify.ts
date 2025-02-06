import slugifyString from 'slugify';

export default function slugify(
  string: string,
  options?: {
    replacement?: string;
    remove?: RegExp;
    lower?: boolean;
    strict?: boolean;
    locale?: string;
    trim?: boolean;
  }
): string {
  return slugifyString(string, {
    remove: /[^\w\s]/g,
    replacement: '-',
    trim: true,
    lower: true,
    ...options,
  });
}
