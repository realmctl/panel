import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FileObject } from '@/api/server/files/loadDirectory';
import { getFileExtensionIconUrl, getFolderExtensionIconUrl } from '@/lib/fileExtensionIcons';
import { getTreeFileIcon, getTreeFileIconColor, getTreeFolderIcon } from '@/components/server/files/fileTreeIcons';
import styles from './style.module.css';

interface Props {
    name: string;
    isFile?: boolean;
    isSymlink?: boolean;
    isArchive?: boolean;
    expanded?: boolean;
    isRoot?: boolean;
    className?: string;
    size?: number;
}

const toFallbackFile = ({ name, isFile = false, isSymlink = false, isArchive = false }: Props): FileObject => ({
    key: name,
    name,
    mode: '',
    modeBits: '',
    size: 0,
    isFile,
    isSymlink,
    mimetype: '',
    createdAt: new Date(0),
    modifiedAt: new Date(0),
    isArchiveType: () => isArchive,
    isEditable: () => isFile,
});

export default ({
    name,
    isFile = false,
    isSymlink = false,
    isArchive = false,
    expanded = false,
    isRoot = false,
    className,
    size = 16,
}: Props) => {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [name, isFile, expanded, isRoot]);

    const src = useMemo(() => {
        if (!isFile) {
            return getFolderExtensionIconUrl(name, expanded, isRoot);
        }

        return getFileExtensionIconUrl(name);
    }, [expanded, isFile, isRoot, name]);

    if (failed) {
        const fallbackFile = toFallbackFile({ name, isFile, isSymlink, isArchive });
        const icon = isFile ? getTreeFileIcon(fallbackFile) : getTreeFolderIcon(expanded);
        const iconColor = isFile ? getTreeFileIconColor(fallbackFile) : 'text-amber-400/90';

        return <FontAwesomeIcon icon={icon} className={classNames('text-xs flex-shrink-0', iconColor, className)} />;
    }

    return (
        <img
            src={src}
            alt={''}
            width={size}
            height={size}
            loading={'lazy'}
            decoding={'async'}
            className={classNames(styles.tree_file_icon, className)}
            onError={() => setFailed(true)}
        />
    );
};
