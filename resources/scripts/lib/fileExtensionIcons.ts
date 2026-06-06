import {
    DEFAULT_FILE,
    DEFAULT_FOLDER,
    DEFAULT_FOLDER_OPENED,
    DEFAULT_ROOT,
    DEFAULT_ROOT_OPENED,
    getIconForFile,
    getIconForFolder,
    getIconForOpenFolder,
} from 'vscode-icons-js';

const VSCODE_ICONS_BASE_URL =
    'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/';

export const getFileExtensionIconUrl = (fileName: string): string => {
    const icon = getIconForFile(fileName);

    return `${VSCODE_ICONS_BASE_URL}${icon || DEFAULT_FILE}`;
};

export const getFolderExtensionIconUrl = (folderName: string, expanded = false, isRoot = false): string => {
    if (isRoot) {
        return `${VSCODE_ICONS_BASE_URL}${expanded ? DEFAULT_ROOT_OPENED : DEFAULT_ROOT}`;
    }

    const icon = expanded ? getIconForOpenFolder(folderName) : getIconForFolder(folderName);

    return `${VSCODE_ICONS_BASE_URL}${icon || (expanded ? DEFAULT_FOLDER_OPENED : DEFAULT_FOLDER)}`;
};
