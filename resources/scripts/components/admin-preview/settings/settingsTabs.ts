export interface SettingsTab {
    id: string;
    label: string;
    path: string;
    description: string;
}

export const settingsTabs: SettingsTab[] = [
    {
        id: 'general',
        label: 'General',
        path: '',
        description: 'Company name, language, registration, and two-factor authentication.',
    },
    {
        id: 'mail',
        label: 'Mail',
        path: '/mail',
        description: 'SMTP, Mailgun, Postmark, and Resend configuration.',
    },
    {
        id: 'security',
        label: 'Security',
        path: '/security',
        description: 'Captcha, encryption, and other security-related settings.',
    },
    {
        id: 'oauth',
        label: 'OAuth',
        path: '/oauth',
        description: 'Google, Discord, and GitHub login providers.',
    },
    {
        id: 'mappings',
        label: 'Mappings',
        path: '/mappings',
        description: 'Version changer and plugin installer mappings.',
    },
    {
        id: 'advanced',
        label: 'Advanced',
        path: '/advanced',
        description: 'CDN and other advanced panel options.',
    },
];
