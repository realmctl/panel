const FALLBACK_TIMEZONES = [
    'UTC',
    'Europe/Amsterdam',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Asia/Dubai',
    'Australia/Sydney',
];

let cachedTimezones: string[] | null = null;

export const getSetupTimezones = (): string[] => {
    if (cachedTimezones) {
        return cachedTimezones;
    }

    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
        try {
            const result = (Intl as any).supportedValuesOf('timeZone') as string[];
            cachedTimezones = result;
            return cachedTimezones;
        } catch {
            // Fall through to static list.
        }
    }

    cachedTimezones = FALLBACK_TIMEZONES;
    return cachedTimezones;
};
