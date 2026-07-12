import http from '@/api/http';

interface Params {
    id: string;
    hash: string;
    expires: string | null;
    signature: string | null;
}

export default ({ id, hash, expires, signature }: Params): Promise<string> => {
    return new Promise((resolve, reject) => {
        http.post(
            `/auth/verify-email/${id}/${hash}`,
            {},
            { params: { expires: expires ?? undefined, signature: signature ?? undefined } }
        )
            .then((response) => resolve(response.data.message || 'Your email address has been verified.'))
            .catch(reject);
    });
};
