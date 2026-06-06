import loadDirectory from '@/api/server/files/loadDirectory';
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

export const resolveConfigFilePath = async (uuid: string, paths: string[]): Promise<string | null> => {
    for (const path of paths) {
        if (await fileExistsOnServer(uuid, path)) {
            return path;
        }
    }

    return null;
};
