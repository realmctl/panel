import { action, Action } from 'easy-peasy';

export interface CaptchaSettings {
    provider: 'recaptcha' | 'turnstile' | 'none';
    siteKey: string;
}

export interface SetupStep {
    id: string;
    label: string;
    description: string;
    complete: boolean;
    skipped?: boolean;
}

export interface SetupConfiguration {
    required: boolean;
    complete: boolean;
    currentStep: string;
    steps: SetupStep[];
    progress: {
        completed: number;
        total: number;
        percent: number;
    };
}

export interface PanelVersionInfo {
    current: string;
    latest: string;
    isLatest: boolean;
    discord: string;
    donations: string;
    commit: string | null;
}

export interface SiteSettings {
    name: string;
    locale: string;
    recaptcha: {
        enabled: boolean;
        siteKey: string;
    };
    captcha: CaptchaSettings;
    oauth: {
        google: boolean;
        discord: boolean;
        github: boolean;
    };
    registration: boolean;
    setup: SetupConfiguration;
    version?: PanelVersionInfo;
}

export interface SettingsStore {
    data?: SiteSettings;
    setSettings: Action<SettingsStore, SiteSettings>;
}

const settings: SettingsStore = {
    data: undefined,

    setSettings: action((state, payload) => {
        state.data = payload;
    }),
};

export default settings;
