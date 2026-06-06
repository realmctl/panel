export type PropertiesLine =
    | { kind: 'comment'; text: string }
    | { kind: 'blank' }
    | { kind: 'property'; key: string; value: string; separator: '=' | ':' };

export const parsePropertiesFile = (content: string): PropertiesLine[] =>
    content.split(/\r?\n/).map((line) => {
        if (line.trim() === '') {
            return { kind: 'blank' };
        }

        if (/^\s*[#!]/.test(line)) {
            return { kind: 'comment', text: line };
        }

        const match = line.match(/^([^=:#\s][^=:]*?)\s*([=:])\s*(.*)$/);

        if (match) {
            return {
                kind: 'property',
                key: match[1].trim(),
                value: match[3],
                separator: match[2] as '=' | ':',
            };
        }

        return { kind: 'comment', text: line };
    });

export const serializePropertiesFile = (lines: PropertiesLine[]): string =>
    lines
        .map((line) => {
            switch (line.kind) {
                case 'blank':
                    return '';
                case 'comment':
                    return line.text;
                case 'property':
                    return `${line.key}${line.separator}${line.value}`;
            }
        })
        .join('\n');

export const getPropertiesMap = (lines: PropertiesLine[]): Record<string, string> => {
    const map: Record<string, string> = {};

    for (const line of lines) {
        if (line.kind === 'property') {
            map[line.key] = line.value;
        }
    }

    return map;
};

export const setPropertyValue = (lines: PropertiesLine[], key: string, value: string): PropertiesLine[] => {
    let found = false;

    const updated = lines.map((line) => {
        if (line.kind === 'property' && line.key === key) {
            found = true;
            return { ...line, value };
        }

        return line;
    });

    if (!found) {
        updated.push({ kind: 'property', key, value, separator: '=' });
    }

    return updated;
};

export const parseBooleanProperty = (value: string | undefined): boolean =>
    value !== undefined && value.trim().toLowerCase() === 'true';

export const formatBooleanProperty = (value: boolean): string => (value ? 'true' : 'false');
