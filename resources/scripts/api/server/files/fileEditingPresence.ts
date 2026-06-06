import http from '@/api/http';
import { encodePathSegments } from '@/helpers';

export interface FileEditorPresence {
    uuid: string;
    username: string;
    email: string;
    file: string;
    line: number;
    updated_at: number;
}

export const getFileEditingPresence = async (server: string): Promise<FileEditorPresence[]> => {
    const { data } = await http.get(`/api/client/servers/${server}/files/presence`);

    return data.data ?? [];
};

export const updateFileEditingPresence = (server: string, file: string, line: number): Promise<void> => {
    return http
        .post(`/api/client/servers/${server}/files/presence`, {
            file: encodePathSegments(file),
            line,
        })
        .then(() => undefined);
};

export const clearFileEditingPresence = (server: string): Promise<void> => {
    return http.delete(`/api/client/servers/${server}/files/presence`).then(() => undefined);
};
