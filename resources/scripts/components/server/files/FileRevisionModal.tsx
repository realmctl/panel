import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import Drawer from '@/components/elements/Drawer';
import { ServerContext } from '@/state/server';
import getFileRevisions, { FileRevision } from '@/api/server/files/getFileRevisions';
import getRevisionContent from '@/api/server/files/getRevisionContent';
import restoreFileRevision from '@/api/server/files/restoreFileRevision';
import deleteFileRevision from '@/api/server/files/deleteFileRevision';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { httpErrorToHuman } from '@/api/http';
import useFlash from '@/plugins/useFlash';
import Can from '@/components/elements/Can';
import Button from '@/components/elements/Button';
import { Dialog } from '@/components/elements/dialog';
import { format } from 'date-fns';
import { getFileName } from '@/components/server/files/fileEditorUtils';
import styles from './style.module.css';

interface Props {
    visible: boolean;
    filePath: string;
    onDismissed: () => void;
    onRestored?: () => void;
}

const actionLabels: Record<string, string> = {
    created: 'Created',
    edited: 'Edited',
    uploaded: 'Uploaded',
    deleted: 'Deleted',
    restored: 'Restored',
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default ({ visible, filePath, onDismissed, onRestored }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();

    const [loading, setLoading] = useState(true);
    const [revisions, setRevisions] = useState<FileRevision[]>([]);
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [previewRevision, setPreviewRevision] = useState<FileRevision | null>(null);
    const [diffMode, setDiffMode] = useState(false);
    const [currentContent, setCurrentContent] = useState<string | null>(null);
    const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!visible) return;

        setLoading(true);
        setPreviewContent(null);
        setPreviewRevision(null);
        setCurrentContent(null);
        setDiffMode(false);
        clearFlashes('file:revisions');
        getFileRevisions(uuid, filePath)
            .then(setRevisions)
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'file:revisions' }))
            .finally(() => setLoading(false));
    }, [visible, filePath, uuid]);

    const handlePreview = (revision: FileRevision) => {
        setActionLoading(true);
        setDiffMode(false);
        getRevisionContent(uuid, revision.uuid)
            .then((content) => {
                setPreviewContent(content);
                setPreviewRevision(revision);
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'file:revisions' }))
            .finally(() => setActionLoading(false));
    };

    const handleDiff = (revision: FileRevision) => {
        setActionLoading(true);
        Promise.all([
            getRevisionContent(uuid, revision.uuid),
            import('@/api/server/files/getFileContents').then((mod) => mod.default(uuid, filePath)),
        ])
            .then(([revContent, curContent]) => {
                setPreviewContent(revContent);
                setCurrentContent(curContent);
                setPreviewRevision(revision);
                setDiffMode(true);
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'file:revisions' }))
            .finally(() => setActionLoading(false));
    };

    const handleRestore = (revisionUuid: string) => {
        setActionLoading(true);
        clearFlashes('file:revisions');
        restoreFileRevision(uuid, revisionUuid)
            .then(() => {
                setConfirmRestore(null);
                return getFileRevisions(uuid, filePath);
            })
            .then(setRevisions)
            .then(() => onRestored?.())
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'file:revisions' }))
            .finally(() => setActionLoading(false));
    };

    const handleDelete = (revisionUuid: string) => {
        setActionLoading(true);
        clearFlashes('file:revisions');
        deleteFileRevision(uuid, revisionUuid)
            .then(() => {
                setConfirmDelete(null);
                setRevisions((prev) => prev.filter((r) => r.uuid !== revisionUuid));
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'file:revisions' }))
            .finally(() => setActionLoading(false));
    };

    const handleDownload = (revision: FileRevision) => {
        getRevisionContent(uuid, revision.uuid)
            .then((content) => {
                const blob = new Blob([content], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filePath.split('/').pop() + '.rev-' + format(new Date(revision.createdAt), 'yyyy-MM-dd_HHmmss');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            })
            .catch((error) => addError({ message: httpErrorToHuman(error), key: 'file:revisions' }));
    };

    const closePreview = () => {
        setPreviewContent(null);
        setPreviewRevision(null);
        setCurrentContent(null);
        setDiffMode(false);
    };

    return (
        <>
            <Dialog.Confirm
                open={!!confirmRestore}
                onClose={() => setConfirmRestore(null)}
                title={'Restore Revision'}
                confirm={'Restore'}
                onConfirmed={() => confirmRestore && handleRestore(confirmRestore)}
            >
                Are you sure you want to restore this revision? The current file will be saved as a new revision
                before restoring, so you can undo this action later.
            </Dialog.Confirm>
            <Dialog.Confirm
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title={'Delete Revision'}
                confirm={'Delete'}
                onConfirmed={() => confirmDelete && handleDelete(confirmDelete)}
            >
                Are you sure you want to permanently delete this revision? This action cannot be undone.
            </Dialog.Confirm>

            <Drawer
                visible={visible}
                onDismissed={onDismissed}
                title={'History'}
                subtitle={getFileName(filePath)}
                width={'32rem'}
            >
                <div className={styles.revision_drawer_content}>
                    <SpinnerOverlay visible={loading || actionLoading} />

                    {previewContent !== null && previewRevision ? (
                        <div>
                            <div css={tw`flex items-center justify-between gap-3 mb-4`}>
                                <div css={tw`min-w-0`}>
                                    <p css={tw`text-sm text-neutral-200 m-0`}>
                                        {diffMode ? 'Diff view' : 'Preview'}
                                    </p>
                                    <p css={tw`text-xs text-neutral-500 mt-1 mb-0`}>
                                        {format(new Date(previewRevision.createdAt), 'MMM d, yyyy HH:mm:ss')}
                                    </p>
                                </div>
                                <Button isSecondary onClick={closePreview} css={tw`text-sm flex-shrink-0`}>
                                    Back
                                </Button>
                            </div>
                            {diffMode && currentContent !== null ? (
                                <div css={tw`space-y-3`}>
                                    <div>
                                        <p css={tw`text-xs text-neutral-500 mb-1`}>Revision (old)</p>
                                        <pre className={styles.revision_preview}>{previewContent}</pre>
                                    </div>
                                    <div>
                                        <p css={tw`text-xs text-neutral-500 mb-1`}>Current</p>
                                        <pre className={styles.revision_preview}>{currentContent}</pre>
                                    </div>
                                </div>
                            ) : (
                                <pre className={styles.revision_preview}>{previewContent}</pre>
                            )}
                        </div>
                    ) : revisions.length === 0 && !loading ? (
                        <p css={tw`text-center text-neutral-500 py-10 m-0`}>No revisions found for this file.</p>
                    ) : (
                        <div className={styles.revision_list}>
                            {revisions.map((revision) => (
                                <div key={revision.uuid} className={styles.revision_item}>
                                    <div className={styles.revision_item_header}>
                                        <div css={tw`min-w-0`}>
                                            <p css={tw`text-sm text-neutral-200 m-0`}>
                                                {format(new Date(revision.createdAt), 'MMM d, yyyy HH:mm:ss')}
                                            </p>
                                            <p css={tw`text-xs text-neutral-500 mt-1 mb-0`}>{formatBytes(revision.size)}</p>
                                        </div>
                                        <span className={styles.revision_badge}>
                                            {actionLabels[revision.action] || revision.action}
                                        </span>
                                    </div>
                                    <div className={styles.revision_actions}>
                                        <button type={'button'} onClick={() => handlePreview(revision)}>
                                            Preview
                                        </button>
                                        <button type={'button'} onClick={() => handleDiff(revision)}>
                                            Diff
                                        </button>
                                        <button type={'button'} onClick={() => handleDownload(revision)}>
                                            Download
                                        </button>
                                        <Can action={'file.revision-restore'}>
                                            <button
                                                type={'button'}
                                                className={styles.revision_action_restore}
                                                onClick={() => setConfirmRestore(revision.uuid)}
                                            >
                                                Restore
                                            </button>
                                        </Can>
                                        <Can action={'file.revision-delete'}>
                                            <button
                                                type={'button'}
                                                className={styles.revision_action_delete}
                                                onClick={() => setConfirmDelete(revision.uuid)}
                                            >
                                                Delete
                                            </button>
                                        </Can>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Drawer>
        </>
    );
};
