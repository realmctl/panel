import http from '@/api/http';

const getCsrfToken = (): string =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

export const adminHttp = {
    get: <T>(url: string) => http.get<T>(url),

    patch: <T>(url: string, data: Record<string, unknown>) =>
        http.patch<T>(url, data, {
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
            },
        }),
};
