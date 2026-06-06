import { cleanDirectoryPath } from '@/helpers';
import { dirname, join } from 'pathe';
import { getFileName } from '@/components/server/files/fileEditorUtils';

export const EXPLORER_DRAG_MIME = 'application/x-realm-explorer-path';

export const EXPLORER_DRAG_EXPAND_MS = 600;

export interface ExplorerDragPayload {
    path: string;
    isFile: boolean;
}

export const isDescendantPath = (ancestor: string, path: string): boolean => {
    const normalizedAncestor = cleanDirectoryPath(ancestor);
    const normalizedPath = cleanDirectoryPath(path);

    if (normalizedAncestor === normalizedPath) {
        return true;
    }

    if (normalizedAncestor === '/') {
        return normalizedPath !== '/';
    }

    return normalizedPath.startsWith(`${normalizedAncestor}/`);
};

export const getDropFolderForPath = (path: string, isFolder: boolean): string => {
    const normalized = cleanDirectoryPath(path);

    if (isFolder) {
        return normalized;
    }

    return dirname(normalized);
};

export const canMoveIntoFolder = (sourcePath: string, targetFolder: string): boolean => {
    const source = cleanDirectoryPath(sourcePath);
    const target = cleanDirectoryPath(targetFolder);

    if (source === target) {
        return false;
    }

    if (dirname(source) === target) {
        return false;
    }

    return !isDescendantPath(source, target);
};

export const buildMoveRenamePayload = (sourcePath: string, targetFolder: string) => {
    const source = cleanDirectoryPath(sourcePath);
    const target = cleanDirectoryPath(targetFolder);
    const name = getFileName(source);
    const from = source.replace(/^\//, '');
    const to = join(target === '/' ? '' : target.replace(/^\//, ''), name).replace(/^\//, '');

    return { root: '/', files: [{ from, to }] };
};

export const readExplorerDragPayload = (dataTransfer: DataTransfer): ExplorerDragPayload | null => {
    const raw = dataTransfer.getData(EXPLORER_DRAG_MIME);

    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as ExplorerDragPayload;
        if (!parsed.path) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
};
