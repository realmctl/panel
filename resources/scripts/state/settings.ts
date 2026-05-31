import { action, Action } from 'easy-peasy';

export interface CaptchaSettings {
    provider: 'recaptcha' | 'turnstile' | 'none';
    siteKey: string;
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
