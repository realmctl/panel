const ANSI_ESCAPE = /\u001b\[[0-9;]*m/;

const LEVEL_COLORS = {
    error: '\u001b[38;2;248;113;113m', // red-400
    warn: '\u001b[38;2;251;191;36m', // amber-400
    info: '\u001b[38;2;148;163;184m', // slate-400
    debug: '\u001b[38;2;100;116;139m', // slate-500
    default: '\u001b[38;2;203;213;225m', // slate-300
} as const;

export type LogLevel = keyof typeof LEVEL_COLORS;

const hasAnsiColor = (line: string): boolean => ANSI_ESCAPE.test(line);

export const detectLogLevel = (line: string): LogLevel => {
    const upper = line.toUpperCase();

    if (
        /\b(ERROR|ERR|FATAL|SEVERE|CRITICAL)\b/.test(upper) ||
        /\[(?:[^\]]+\/)?(?:ERROR|ERR|FATAL|SEVERE)\]/.test(upper) ||
        /\]: \[.*ERROR/.test(upper)
    ) {
        return 'error';
    }

    if (/\b(WARN|WARNING)\b/.test(upper) || /\[(?:[^\]]+\/)?(?:WARN|WARNING)\]/.test(upper)) {
        return 'warn';
    }

    if (/\b(DEBUG|TRACE)\b/.test(upper) || /\[(?:[^\]]+\/)?(?:DEBUG|TRACE)\]/.test(upper)) {
        return 'debug';
    }

    if (/\bINFO\b/.test(upper) || /\[(?:[^\]]+\/)?INFO\]/.test(upper)) {
        return 'info';
    }

    return 'default';
};

export const formatConsoleLine = (line: string): string => {
    const trimmed = line.replace(/(?:\r\n|\r|\n)$/i, '');

    if (!trimmed) {
        return '';
    }

    if (hasAnsiColor(trimmed)) {
        return `${trimmed}\u001b[0m`;
    }

    const level = detectLogLevel(trimmed);
    const color = LEVEL_COLORS[level];

    return `${color}${trimmed}\u001b[0m`;
};

/**
 * Classifies a console line by log level and returns both the detected level and the
 * ANSI-formatted string ready to write to the terminal. Lines that already carry their own
 * ANSI colouring keep it, but are still classified by keyword so they can be filtered.
 *
 * Returns null for empty lines.
 */
export const classifyAndFormat = (line: string): { level: LogLevel; formatted: string } | null => {
    const trimmed = line.replace(/(?:\r\n|\r|\n)$/i, '');

    if (!trimmed) {
        return null;
    }

    const level = detectLogLevel(trimmed);
    const formatted = hasAnsiColor(trimmed) ? `${trimmed}\u001b[0m` : `${LEVEL_COLORS[level]}${trimmed}\u001b[0m`;

    return { level, formatted };
};

export const formatDaemonErrorLine = (line: string): string => {
    const trimmed = line.replace(/(?:\r\n|\r|\n)$/i, '');

    if (!trimmed) {
        return '';
    }

    if (hasAnsiColor(trimmed)) {
        return `${trimmed}\u001b[0m`;
    }

    return `\u001b[38;2;248;113;113m\u001b[1m${trimmed}\u001b[0m`;
};
