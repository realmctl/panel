import axios, { AxiosProgressEvent } from 'axios';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import createDirectory from '@/api/server/files/createDirectory';
import { cleanDirectoryPath } from '@/helpers';

export interface FileWithPath {
    file: File;
    relativePath: string;
}

export async function getAllFilesFromEntry(entry: FileSystemEntry, path = ''): Promise<FileWithPath[]> {
    if (entry.isFile) {
        return new Promise((resolve, reject) => {
            (entry as FileSystemFileEntry).file(
                (file) => resolve([{ file, relativePath: path + file.name }]),
                reject
            );
        });
    }

    if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();
        const allEntries: FileSystemEntry[] = [];

        await new Promise<void>((resolve, reject) => {
            const readBatch = () => {
                reader.readEntries((entries) => {
                    if (!entries.length) {
                        resolve();
                    } else {
                        allEntries.push(...entries);
                        readBatch();
                    }
                }, reject);
            };
            readBatch();
        });

        const results = await Promise.all(
            allEntries.map((entry) => getAllFilesFromEntry(entry, `${path}${dirEntry.name}/`))
        );

        return results.flat();
    }

    return [];
}

export async function collectFilesFromDataTransfer(items: DataTransferItemList): Promise<FileWithPath[]> {
    const entries = Array.from(items)
        .filter((item) => item.kind === 'file')
        .map((item) => item.webkitGetAsEntry())
        .filter((entry): entry is FileSystemEntry => entry !== null);

    const results = await Promise.all(entries.map((entry) => getAllFilesFromEntry(entry)));

    return results.flat();
}

export function hasExternalFiles(dataTransfer: DataTransfer): boolean {
    return Array.from(dataTransfer.types).some((type) => type.toLowerCase() === 'files');
}

interface UploadProgressHandlers {
    pushFileUpload: (payload: { name: string; data: { abort: AbortController; loaded: number; total: number } }) => void;
    removeFileUpload: (name: string) => void;
    setUploadProgress: (payload: { name: string; loaded: number }) => void;
    clearFileUploads: () => void;
}

export async function uploadFilesToDirectory(
    uuid: string,
    directory: string,
    filesWithPaths: FileWithPath[],
    handlers: UploadProgressHandlers,
    batchSignal?: AbortSignal
): Promise<void> {
    if (filesWithPaths.length === 0) {
        return;
    }

    const targetDirectory = cleanDirectoryPath(directory);
    const base = targetDirectory === '/' ? '' : targetDirectory;

    const dirSet = new Set<string>();
    for (const { relativePath } of filesWithPaths) {
        const parts = relativePath.split('/');
        for (let i = 1; i < parts.length; i++) {
            dirSet.add(parts.slice(0, i).join('/'));
        }
    }

    const dirsToCreate = Array.from(dirSet).sort((a, b) => a.split('/').length - b.split('/').length);
    for (const subDir of dirsToCreate) {
        const lastSlash = subDir.lastIndexOf('/');
        const dirRoot = lastSlash < 0 ? targetDirectory : cleanDirectoryPath(`${base}/${subDir.substring(0, lastSlash)}`);
        const dirName = lastSlash < 0 ? subDir : subDir.substring(lastSlash + 1);

        try {
            await createDirectory(uuid, dirRoot, dirName);
        } catch {
            // Directory may already exist.
        }
    }

    for (const { file, relativePath } of filesWithPaths) {
        // Stop queueing new files once the whole batch has been cancelled.
        if (batchSignal?.aborted) {
            break;
        }

        const controller = new AbortController();
        // Cancelling the entire batch should also abort the request that is in flight.
        const onBatchAbort = () => controller.abort();
        batchSignal?.addEventListener('abort', onBatchAbort);

        const lastSlash = relativePath.lastIndexOf('/');
        const subDir = lastSlash > 0 ? relativePath.substring(0, lastSlash) : '';
        const uploadDirectory = subDir ? cleanDirectoryPath(`${base}/${subDir}`) : targetDirectory;

        handlers.pushFileUpload({
            name: relativePath,
            data: { abort: controller, loaded: 0, total: file.size },
        });

        try {
            const url = await getFileUploadUrl(uuid);
            await axios.post(
                url,
                { files: file },
                {
                    signal: controller.signal,
                    headers: { 'Content-Type': 'multipart/form-data' },
                    params: { directory: uploadDirectory },
                    onUploadProgress: (data: AxiosProgressEvent) => {
                        handlers.setUploadProgress({ name: relativePath, loaded: data.loaded ?? 0 });
                    },
                }
            );

            handlers.removeFileUpload(relativePath);
        } catch (error) {
            handlers.removeFileUpload(relativePath);

            // A cancelled upload (single file or whole batch) is not an error. Skip the
            // file and keep going with the rest unless the entire batch was cancelled.
            if (axios.isCancel(error)) {
                if (batchSignal?.aborted) {
                    break;
                }
                continue;
            }

            throw error;
        } finally {
            batchSignal?.removeEventListener('abort', onBatchAbort);
        }
    }
}
