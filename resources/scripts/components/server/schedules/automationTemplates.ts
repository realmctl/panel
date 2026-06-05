export interface AutomationTemplateTask {
    action: string;
    payload: string;
    time_offset: number;
    continue_on_failure?: boolean;
    condition?: string | null;
}

export interface AutomationTemplate {
    name: string;
    cron: {
        minute: string;
        hour: string;
        day_of_month: string;
        month: string;
        day_of_week: string;
    };
    only_when_online: boolean;
    is_active?: boolean;
    tasks: AutomationTemplateTask[];
}

export const AUTOMATION_TEMPLATES: { label: string; description: string; template: AutomationTemplate }[] = [
    {
        label: 'Daily restart at 4 AM',
        description: 'Restart the server once per day during low-traffic hours.',
        template: {
            name: 'Daily restart',
            cron: { minute: '0', hour: '4', day_of_month: '*', month: '*', day_of_week: '*' },
            only_when_online: true,
            is_active: false,
            tasks: [
                { action: 'power', payload: 'restart', time_offset: 0, continue_on_failure: false },
            ],
        },
    },
    {
        label: 'Backup every 6 hours',
        description: 'Create a backup four times per day.',
        template: {
            name: '6-hour backup',
            cron: { minute: '0', hour: '*/6', day_of_month: '*', month: '*', day_of_week: '*' },
            only_when_online: true,
            is_active: false,
            tasks: [
                { action: 'backup', payload: '', time_offset: 0, condition: 'require_backup_capacity' },
            ],
        },
    },
    {
        label: 'Restart + backup weekly',
        description: 'Restart then create a backup every Monday at 3 AM.',
        template: {
            name: 'Weekly maintenance',
            cron: { minute: '0', hour: '3', day_of_month: '*', month: '*', day_of_week: 'MON' },
            only_when_online: true,
            is_active: false,
            tasks: [
                { action: 'power', payload: 'restart', time_offset: 0 },
                { action: 'backup', payload: '', time_offset: 120, condition: 'require_backup_capacity' },
            ],
        },
    },
    {
        label: 'Discord webhook on restart',
        description: 'Restart the server and notify a Discord webhook.',
        template: {
            name: 'Restart with webhook',
            cron: { minute: '0', hour: '4', day_of_month: '*', month: '*', day_of_week: '*' },
            only_when_online: true,
            is_active: false,
            tasks: [
                { action: 'power', payload: 'restart', time_offset: 0 },
                {
                    action: 'webhook',
                    payload: JSON.stringify({
                        url: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN',
                        method: 'POST',
                        body: { content: 'Server restarted by automation.' },
                    }),
                    time_offset: 30,
                },
            ],
        },
    },
];
