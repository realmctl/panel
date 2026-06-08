import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import { cleanDirectoryPath } from '@/helpers';

const splitFilePath = (filePath: string): { directory: string; name: string } => {
    const segments = filePath.split('/').filter(Boolean);
    const name = segments.pop() ?? filePath;

    return {
        directory: segments.length ? cleanDirectoryPath(`/${segments.join('/')}`) : '/',
        name,
    };
};

export const fileExistsOnServer = async (uuid: string, filePath: string): Promise<boolean> => {
    const { directory, name } = splitFilePath(filePath);

    try {
        const files = await loadDirectory(uuid, directory);

        return files.some((file) => file.isFile && file.name === name);
    } catch {
        return false;
    }
};

/**
 * Resolves the first candidate path that actually exists on the server.
 *
 * Candidates are grouped by their parent directory so each directory is listed
 * exactly once, and all listings are fetched concurrently. This collapses what
 * used to be N sequential round trips to the daemon into a single parallel
 * batch, while still honouring the caller's priority order when picking a
 * winner.
 */
export const resolveConfigFilePath = async (uuid: string, paths: string[]): Promise<string | null> => {
    if (paths.length === 0) {
        return null;
    }

    const candidates = paths.map((path) => ({ path, ...splitFilePath(path) }));
    const directories = [...new Set(candidates.map((candidate) => candidate.directory))];

    const listings = new Map<string, FileObject[]>();
    await Promise.all(
        directories.map(async (directory) => {
            try {
                listings.set(directory, await loadDirectory(uuid, directory));
            } catch {
                listings.set(directory, []);
            }
        })
    );

    for (const { path, directory, name } of candidates) {
        const files = listings.get(directory);

        if (files?.some((file) => file.isFile && file.name === name)) {
            return path;
        }
    }

    return null;
};
