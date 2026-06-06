import { FileObject } from '@/api/server/files/loadDirectory';
import { getFileName } from '@/components/server/files/fileEditorUtils';

export type MediaKind = 'audio' | 'video';

const MEDIA_EXTENSIONS: Record<string, MediaKind> = {
    mp3: 'audio',
    wav: 'audio',
    mp4: 'video',
};

export const getMediaKindFromPath = (path: string): MediaKind | null => {
    const name = getFileName(path);
    const dot = name.lastIndexOf('.');

    if (dot <= 0) {
        return null;
    }

    const extension = name.slice(dot + 1).toLowerCase();
    return MEDIA_EXTENSIONS[extension] ?? null;
};

export const isMediaFile = (file: FileObject): boolean => {
    return file.isFile && getMediaKindFromPath(file.name) !== null;
};

export const canOpenInEditor = (file: FileObject): boolean => {
    return file.isFile && (file.isEditable() || isMediaFile(file));
};
