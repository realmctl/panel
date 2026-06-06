import modes from '@/modes';

export const getFileName = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? path;
};

export const detectModeFromFilename = (filename: string): string => {
    for (let i = 0; i < modes.length; i++) {
        const info = modes[i];

        if (info.file && info.file.test(filename)) {
            return info.mime;
        }
    }

    const dot = filename.lastIndexOf('.');
    const ext = dot > -1 ? filename.substring(dot + 1, filename.length) : null;

    if (ext) {
        for (let i = 0; i < modes.length; i++) {
            const info = modes[i];
            if (info.ext) {
                for (let j = 0; j < info.ext.length; j++) {
                    if (info.ext[j] === ext) {
                        return info.mime;
                    }
                }
            }
        }
    }

    return 'text/plain';
};

export interface OpenFileTab {
    path: string;
    content: string;
    savedContent: string;
    mode: string;
    loading: boolean;
    error: string | null;
    isNew?: boolean;
    mediaKind?: 'audio' | 'video' | null;
}

export const isTabDirty = (tab: OpenFileTab) => tab.content !== tab.savedContent;
