import { Transform } from 'class-transformer';

export function LocalizedEnum(translationMapping: EnumTranslationManager) {
    return Transform(({ value, options }) => {
        const locale = options?.locale || 'en';
        // Look up the translation; fall back to the original enum value if not found.
        return translationMapping?.[locale]?.[value] || value;
    });
}