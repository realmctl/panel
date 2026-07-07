import { findModeByFilename } from '@/lib/monacoLanguages';

export interface OpenFileTab {
    path: string;
    content: string;
    savedContent: string;
    mode: string;
    loading: boolean;
    error: string | null;
    isNew?: boolean;
}

export const getFileName = (path: string): string => path.split('/').filter(Boolean).pop() ?? path;

export const detectModeFromFilename = (filename: string): string => findModeByFilename(filename)?.mime ?? 'text/plain';

export const isTabDirty = (tab: OpenFileTab): boolean => tab.content !== tab.savedContent;
