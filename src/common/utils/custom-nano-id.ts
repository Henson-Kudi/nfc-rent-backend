import { customAlphabet } from 'nanoid';
import slugify from './slugify';

export function generateAlphaNumNanoId(prefix?: string, options: { replacement?: string, case?: 'lower' | 'upper' } = { case: 'upper', replacement: '-' }) {

    // Add default prefix
    if (prefix === undefined) {
        const year = new Date().getFullYear();
        prefix = `NFC-${year}-`
    }

    // OR with custom alphabet (only A-Z and 0-9)
    const customNanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
    const customId = customNanoid();

    const string = slugify(`${prefix}${customId}`, {
        replacement: options?.replacement || '-',
    })

    return options?.case === 'lower' ? string.toLowerCase() : string.toUpperCase();
}