import http from '@/api/http';

export default (email: string, captchaToken?: string, provider?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const data: Record<string, string | undefined> = { email };

        if (provider === 'turnstile') {
            data['cf-turnstile-response'] = captchaToken;
        } else {
            data['g-recaptcha-response'] = captchaToken;
        }

        http.post('/auth/password', data)
            .then((response) => resolve(response.data.status || ''))
            .catch(reject);
    });
};
