import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import Modal from '@/components/elements/Modal';
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
                // Refresh revisions list
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

            <Modal visible={visible} onDismissed={onDismissed} closeOnBackground closeOnEscape>
                <div css={tw`p-6`}>
                    <h2 css={tw`text-2xl font-header font-medium mb-1 text-neutral-100`}>File Revisions</h2>
                    <p css={tw`text-sm text-neutral-400 mb-4`}>{filePath}</p>

                    <SpinnerOverlay visible={loading || actionLoading} />

                    {previewContent !== null && previewRevision ? (
                        <div>
                            <div css={tw`flex items-center justify-between mb-4`}>
                                <div>
                                    <span css={tw`text-sm text-neutral-300`}>
                                        {diffMode ? 'Diff View' : 'Preview'} &mdash;{' '}
                                        {format(new Date(previewRevision.createdAt), 'MMM d, yyyy HH:mm:ss')}
                                    </span>
                                </div>
                                <Button isSecondary onClick={closePreview} css={tw`text-sm`}>
                                    &larr; Back to list
                                </Button>
                            </div>
                            {diffMode && currentContent !== null ? (
                                <div css={tw`grid grid-cols-2 gap-2`}>
                                    <div>
                                        <p css={tw`text-xs text-neutral-400 mb-1`}>Revision (old)</p>
                                        <pre css={tw`bg-black rounded p-3 text-xs text-neutral-300 overflow-auto max-h-96 whitespace-pre-wrap break-all`}>
                                            {previewContent}
                                        </pre>
                                    </div>
                                    <div>
                                        <p css={tw`text-xs text-neutral-400 mb-1`}>Current</p>
                                        <pre css={tw`bg-black rounded p-3 text-xs text-neutral-300 overflow-auto max-h-96 whitespace-pre-wrap break-all`}>
                                            {currentContent}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <pre css={tw`bg-black rounded p-3 text-xs text-neutral-300 overflow-auto max-h-96 whitespace-pre-wrap break-all`}>
                                    {previewContent}
                                </pre>
                            )}
                        </div>
                    ) : revisions.length === 0 && !loading ? (
                        <p css={tw`text-center text-neutral-400 py-8`}>No revisions found for this file.</p>
                    ) : (
                        <div css={tw`overflow-auto max-h-96`}>
                            <table css={tw`w-full text-sm`}>
                                <thead>
                                    <tr css={tw`text-left text-neutral-400 border-b border-neutral-700`}>
                                        <th css={tw`pb-2 pr-4`}>Date</th>
                                        <th css={tw`pb-2 pr-4`}>Action</th>
                                        <th css={tw`pb-2 pr-4`}>Size</th>
                                        <th css={tw`pb-2`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {revisions.map((revision) => (
                                        <tr key={revision.uuid} css={tw`border-b border-neutral-800 hover:bg-neutral-800`}>
                                            <td css={tw`py-2 pr-4 text-neutral-300`}>
                                                {format(new Date(revision.createdAt), 'MMM d, yyyy HH:mm:ss')}
                                            </td>
                                            <td css={tw`py-2 pr-4`}>
                                                <span css={tw`px-2 py-0.5 rounded text-xs bg-neutral-700 text-neutral-300`}>
                                                    {actionLabels[revision.action] || revision.action}
                                                </span>
                                            </td>
                                            <td css={tw`py-2 pr-4 text-neutral-400`}>
                                                {formatBytes(revision.size)}
                                            </td>
                                            <td css={tw`py-2`}>
                                                <div css={tw`flex gap-2`}>
                                                    <button
                                                        css={tw`text-xs text-cyan-400 hover:text-cyan-300`}
                                                        onClick={() => handlePreview(revision)}
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        css={tw`text-xs text-cyan-400 hover:text-cyan-300`}
                                                        onClick={() => handleDiff(revision)}
                                                    >
                                                        Diff
                                                    </button>
                                                    <button
                                                        css={tw`text-xs text-cyan-400 hover:text-cyan-300`}
                                                        onClick={() => handleDownload(revision)}
                                                    >
                                                        Download
                                                    </button>
                                                    <Can action={'file.revision-restore'}>
                                                        <button
                                                            css={tw`text-xs text-green-400 hover:text-green-300`}
                                                            onClick={() => setConfirmRestore(revision.uuid)}
                                                        >
                                                            Restore
                                                        </button>
                                                    </Can>
                                                    <Can action={'file.revision-delete'}>
                                                        <button
                                                            css={tw`text-xs text-red-400 hover:text-red-300`}
                                                            onClick={() => setConfirmDelete(revision.uuid)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </Can>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};
