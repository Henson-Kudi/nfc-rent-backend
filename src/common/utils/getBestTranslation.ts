// Utility function to get best translation of an entity
export function getBestTranslation<T extends { locale: string }>(
    translations: T[],
    locale: SupportedLocales,
    fallbackLocale: SupportedLocales = 'en'
): T | null {
    if (!translations?.length) return null;

    return (
        translations.find((t) => t.locale === locale) ||
        translations.find((t) => t.locale === fallbackLocale) ||
        translations?.[0] || null // Fallback to first available or null
    );
}