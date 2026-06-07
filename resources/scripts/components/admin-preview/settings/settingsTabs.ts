export interface SettingsTab {
    id: string;
    label: string;
    path: string;
    legacyPath: string;
    description: string;
}

export const settingsTabs: SettingsTab[] = [
    {
        id: 'general',
        label: 'General',
        path: '',
        legacyPath: '/admin/settings',
        description: 'Company name, language, registration, and two-factor authentication.',
    },
    {
        id: 'mail',
        label: 'Mail',
        path: '/mail',
        legacyPath: '/admin/settings/mail',
        description: 'SMTP, Mailgun, Postmark, and Resend configuration.',
    },
    {
        id: 'security',
        label: 'Security',
        path: '/security',
        legacyPath: '/admin/settings/security',
        description: 'Captcha, encryption, and other security-related settings.',
    },
    {
        id: 'oauth',
        label: 'OAuth',
        path: '/oauth',
        legacyPath: '/admin/settings/oauth',
        description: 'Google, Discord, and GitHub login providers.',
    },
    {
        id: 'mappings',
        label: 'Mappings',
        path: '/mappings',
        legacyPath: '/admin/settings/mappings',
        description: 'Version changer and plugin installer mappings.',
    },
    {
        id: 'advanced',
        label: 'Advanced',
        path: '/advanced',
        legacyPath: '/admin/settings/advanced',
        description: 'Telemetry, CDN, and other advanced panel options.',
    },
];
