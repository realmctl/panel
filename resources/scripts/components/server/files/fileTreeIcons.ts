import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
    faCog,
    faFileAlt,
    faFileArchive,
    faFileCode,
    faFileImage,
    faFileImport,
    faFolder,
    faFolderOpen,
} from '@fortawesome/free-solid-svg-icons';
import { FileObject } from '@/api/server/files/loadDirectory';

export const getTreeFolderIcon = (expanded: boolean): IconDefinition => (expanded ? faFolderOpen : faFolder);

export const getTreeFileIcon = (file: FileObject): IconDefinition => {
    if (file.isSymlink) {
        return faFileImport;
    }

    if (file.isArchiveType()) {
        return faFileArchive;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const name = file.name.toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext)) {
        return faFileImage;
    }

    if (['json', 'yml', 'yaml', 'toml', 'xml', 'mcmeta', 'lang'].includes(ext)) {
        return faFileCode;
    }

    if (['log', 'txt', 'md', 'csv'].includes(ext) || name.endsWith('.log')) {
        return faFileAlt;
    }

    if (['properties', 'conf', 'config', 'cfg', 'ini', 'env', 'opts'].includes(ext) || name === 'server.properties') {
        return faCog;
    }

    if (ext === 'jar' || ext === 'zip' || ext === 'tar' || ext === 'gz') {
        return faFileArchive;
    }

    return faFileAlt;
};

export const getTreeFileIconColor = (file: FileObject): string => {
    if (!file.isFile) {
        return 'text-amber-400/90';
    }

    if (file.isSymlink) {
        return 'text-purple-400/90';
    }

    if (file.isArchiveType()) {
        return 'text-orange-400/80';
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext)) {
        return 'text-pink-400/80';
    }

    if (['json', 'yml', 'yaml', 'toml', 'xml', 'mcmeta', 'lang'].includes(ext)) {
        return 'text-sky-400/80';
    }

    if (['log', 'txt', 'md', 'csv'].includes(ext)) {
        return 'text-neutral-400';
    }

    if (['properties', 'conf', 'config', 'cfg', 'ini', 'env', 'opts'].includes(ext)) {
        return 'text-emerald-400/80';
    }

    if (ext === 'jar') {
        return 'text-red-400/80';
    }

    return 'text-neutral-500';
};
