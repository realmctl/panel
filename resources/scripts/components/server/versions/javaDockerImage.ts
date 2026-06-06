const YOLK_BASE = 'ghcr.io/realmopensource/yolks';

const JAVA_ORDER = ['java_8', 'java_11', 'java_16', 'java_17', 'java_21'] as const;

export type JavaTag = (typeof JAVA_ORDER)[number];

export const getRequiredJavaTag = (version: string): JavaTag => {
    const match = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
    if (!match) {
        return 'java_17';
    }

    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    const patch = match[3] ? parseInt(match[3], 10) : 0;

    if (major > 1 || minor >= 21) {
        return 'java_21';
    }

    if (major === 1 && minor === 20 && patch >= 5) {
        return 'java_21';
    }

    if (major === 1 && minor >= 18) {
        return 'java_17';
    }

    if (major === 1 && minor === 17) {
        return 'java_16';
    }

    return 'java_8';
};

export const getRequiredJavaLabel = (version: string): string => {
    const tag = getRequiredJavaTag(version);
    return tag.replace('java_', 'Java ');
};

export const resolveDockerImage = (version: string, availableImages: Record<string, string>): string | null => {
    const required = getRequiredJavaTag(version);
    const images = Object.values(availableImages);

    const exact = images.find((image) => image.includes(`:${required}`));
    if (exact) {
        return exact;
    }

    const minIndex = JAVA_ORDER.indexOf(required);
    for (let index = JAVA_ORDER.length - 1; index >= minIndex; index--) {
        const tag = JAVA_ORDER[index];
        const match = images.find((image) => image.includes(`:${tag}`));
        if (match) {
            return match;
        }
    }

    return images[0] ?? `${YOLK_BASE}:${required}`;
};
