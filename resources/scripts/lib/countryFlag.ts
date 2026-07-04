const COUNTRY_ALIASES: Record<string, string> = {
    uk: 'GB',
};

const FLAG_CDN_BASE = 'https://flagcdn.com';

export const normalizeCountryCode = (countryCode: string | null | undefined): string | null => {
    if (!countryCode) {
        return null;
    }

    const normalized = (COUNTRY_ALIASES[countryCode.toLowerCase()] ?? countryCode).toUpperCase();

    return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
};

export const countryFlagUrl = (countryCode: string | null | undefined, width = 20): string | null => {
    const normalized = normalizeCountryCode(countryCode);

    if (!normalized) {
        return null;
    }

    return `${FLAG_CDN_BASE}/w${width}/${normalized.toLowerCase()}.png`;
};

export const formatGeoLocationLabel = (
    location: { city?: string | null; region?: string | null; country?: string | null } | null | undefined
): string | null => {
    if (!location) {
        return null;
    }

    return location.city || location.country || null;
};
