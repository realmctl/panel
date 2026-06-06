const ANSI_ESCAPE = /\u001b\[[0-9;]*m/;

const LEVEL_COLORS = {
    error: '\u001b[38;2;248;113;113m', // red-400
    warn: '\u001b[38;2;251;191;36m', // amber-400
    info: '\u001b[38;2;148;163;184m', // slate-400
    debug: '\u001b[38;2;100;116;139m', // slate-500
    default: '\u001b[38;2;203;213;225m', // slate-300
} as const;

type LogLevel = keyof typeof LEVEL_COLORS;

const hasAnsiColor = (line: string): boolean => ANSI_ESCAPE.test(line);

const detectLogLevel = (line: string): LogLevel => {
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
