import http from '@/api/http';

const getCsrfToken = (): string =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

const csrfHeaders = () => ({
    'X-CSRF-TOKEN': getCsrfToken(),
});

export const adminHttp = {
    get: <T>(url: string) => http.get<T>(url),

    patch: <T>(url: string, data: object) =>
        http.patch<T>(url, data, {
            headers: csrfHeaders(),
        }),

    post: <T>(url: string, data?: object) =>
        http.post<T>(url, data, {
            headers: csrfHeaders(),
        }),

    delete: <T>(url: string, data?: object) =>
        http.delete<T>(url, {
            headers: csrfHeaders(),
            data,
        }),

    postForm: <T>(url: string, data: FormData) =>
        http.post<T>(url, data, {
            headers: csrfHeaders(),
        }),
};
