import http from '@/api/http';

interface TransferOptions {
    destination: string;
    files: string[];
    root?: string;
    destinationDirectory?: string;
    move?: boolean;
}

export default (uuid: string, { destination, files, root, destinationDirectory, move }: TransferOptions): Promise<void> => {
    return http
        .post(`/api/client/servers/${uuid}/files/transfer`, {
            destination,
            files,
            root: root ?? '/',
            destination_directory: destinationDirectory ?? '/',
            move: move ?? false,
        })
        .then(() => undefined);
};
