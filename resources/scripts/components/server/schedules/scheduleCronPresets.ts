export interface CronFieldValues {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
}

export interface CronPreset {
    id: string;
    label: string;
    description: string;
    values: CronFieldValues;
}

export const CRON_PRESETS: CronPreset[] = [
    {
        id: 'every-5-min',
        label: 'Every 5 min',
        description: 'Runs twelve times per hour.',
        values: { minute: '*/5', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' },
    },
    {
        id: 'hourly',
        label: 'Hourly',
        description: 'At the start of every hour.',
        values: { minute: '0', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' },
    },
    {
        id: 'daily-4am',
        label: 'Daily 4 AM',
        description: 'Once per day during low traffic.',
        values: { minute: '0', hour: '4', dayOfMonth: '*', month: '*', dayOfWeek: '*' },
    },
    {
        id: 'weekly-mon',
        label: 'Weekly Mon',
        description: 'Every Monday at 3 AM.',
        values: { minute: '0', hour: '3', dayOfMonth: '*', month: '*', dayOfWeek: 'MON' },
    },
];

export const describeCronExpression = (values: CronFieldValues): string => {
    const { minute, hour, dayOfMonth, month, dayOfWeek } = values;

    if (minute === '*/5' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return 'Runs every 5 minutes.';
    }

    if (minute === '0' && hour === '*/6' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return 'Runs every 6 hours.';
    }

    if (minute === '0' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return 'Runs at the start of every hour.';
    }

    if (minute === '0' && hour === '4' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return 'Runs once daily at 4:00 AM.';
    }

    if (minute === '0' && hour === '3' && dayOfMonth === '*' && month === '*' && dayOfWeek === 'MON') {
        return 'Runs every Monday at 3:00 AM.';
    }

    if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return `Runs every ${minute.slice(2)} minutes.`;
    }

    if (minute === '0' && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return `Runs every ${hour.slice(2)} hours.`;
    }

    if (dayOfWeek !== '*' && dayOfMonth === '*' && month === '*') {
        return `Runs on ${dayOfWeek} at ${hour}:${minute.padStart(2, '0')}.`;
    }

    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*' && hour !== '*' && minute !== '*') {
        return `Runs daily at ${hour}:${minute.padStart(2, '0')}.`;
    }

    return 'Custom cron expression.';
};

export const matchesCronPreset = (values: CronFieldValues, preset: CronPreset): boolean =>
    preset.values.minute === values.minute &&
    preset.values.hour === values.hour &&
    preset.values.dayOfMonth === values.dayOfMonth &&
    preset.values.month === values.month &&
    preset.values.dayOfWeek === values.dayOfWeek;
