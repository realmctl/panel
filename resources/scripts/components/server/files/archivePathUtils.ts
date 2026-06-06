import { join } from 'pathe';
import { FileObject } from '@/api/server/files/loadDirectory';

export const ARCHIVE_PATH_SEPARATOR = '::';

export const isBrowsableArchive = (file: FileObject): boolean =>
    file.isFile && file.name.toLowerCase().endsWith('.jar');

export const isArchiveTreeRoot = (path: string): boolean =>
    path.toLowerCase().endsWith('.jar') && !path.includes(ARCHIVE_PATH_SEPARATOR);

export const parseArchiveTreePath = (path: string): { archivePath: string; internalPath: string } | null => {
    const separatorIndex = path.indexOf(ARCHIVE_PATH_SEPARATOR);
    if (separatorIndex === -1) {
        return null;
    }

    const internalPath = path.slice(separatorIndex + ARCHIVE_PATH_SEPARATOR.length) || '/';

    return {
        archivePath: path.slice(0, separatorIndex),
        internalPath: internalPath.startsWith('/') ? internalPath : `/${internalPath}`,
    };
};

export const joinTreePath = (parentPath: string, name: string): string => {
    const parsed = parseArchiveTreePath(parentPath);
    if (parsed) {
        const internal =
            parsed.internalPath === '/' ? `/${name}` : `${parsed.internalPath}/${name}`;
        return `${parsed.archivePath}${ARCHIVE_PATH_SEPARATOR}${internal}`;
    }

    if (isArchiveTreeRoot(parentPath)) {
        return `${parentPath}${ARCHIVE_PATH_SEPARATOR}/${name}`;
    }

    return join(parentPath, name);
};

export const getArchiveFetchTarget = (
    path: string
): { archivePath: string; internalPath: string } | null => {
    const parsed = parseArchiveTreePath(path);
    if (parsed) {
        return parsed;
    }

    if (isArchiveTreeRoot(path)) {
        return { archivePath: path, internalPath: '/' };
    }

    return null;
};

export const getArchiveAncestorPaths = (path: string): string[] => {
    const parsed = parseArchiveTreePath(path);
    if (!parsed) {
        return [];
    }

    const paths: string[] = [];
    const internalParts = parsed.internalPath.split('/').filter(Boolean);

    paths.push(parsed.archivePath);

    let internalCurrent = '';
    for (const part of internalParts) {
        internalCurrent = internalCurrent ? `${internalCurrent}/${part}` : `/${part}`;
        paths.push(`${parsed.archivePath}${ARCHIVE_PATH_SEPARATOR}${internalCurrent}`);
    }

    return paths;
};
