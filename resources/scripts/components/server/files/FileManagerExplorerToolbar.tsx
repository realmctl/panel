import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile } from '@fortawesome/free-solid-svg-icons';
import Can from '@/components/elements/Can';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import PullFileButton from '@/components/server/files/PullFileButton';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import UploadButton from '@/components/server/files/UploadButton';
import styles from './style.module.css';
import ExplorerIconTooltip from '@/components/server/files/ExplorerIconTooltip';

interface Props {
    onNewFile: () => void;
    onTreeChange?: () => void;
    newFolderOpen?: boolean;
    onNewFolderOpenChange?: (open: boolean) => void;
}

export default ({ onNewFile, onTreeChange, newFolderOpen, onNewFolderOpenChange }: Props) => (
    <Can action={'file.create'}>
        <nav className={styles.explorer_toolbar} aria-label={'File actions'}>
            <FileManagerStatus />
            <PullFileButton iconOnly onImported={onTreeChange} />
            <NewDirectoryButton
                iconOnly
                onCreated={onTreeChange}
                open={newFolderOpen}
                onOpenChange={onNewFolderOpenChange}
            />
            <UploadButton iconOnly onUploaded={onTreeChange} />
            <ExplorerIconTooltip label={'New file'}>
                <button type={'button'} className={styles.explorer_icon_btn} onClick={onNewFile}>
                    <FontAwesomeIcon icon={faFile} className={'text-sm'} />
                </button>
            </ExplorerIconTooltip>
        </nav>
    </Can>
);
