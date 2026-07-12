import { ArchiveIcon, DocumentIcon, FolderIcon, LinkIcon } from '@heroicons/react/outline';
import { encodePathSegments } from '@/helpers';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import React, { memo } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileDropdownMenu from '@/components/server/files/FileDropdownMenu';
import { ServerContext } from '@/state/server';
import { NavLink, useRouteMatch } from 'react-router-dom';
import isEqual from 'react-fast-compare';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import { usePermissions } from '@/plugins/usePermissions';
import { join } from 'pathe';
import { bytesToString } from '@/lib/formatters';

const Clickable: React.FC<{ file: FileObject }> = memo(({ file, children }) => {
    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const match = useRouteMatch();
    const linkClasses = 'flex items-center gap-3 min-w-0 flex-1 no-underline text-inherit';

    return (file.isFile && (!file.isEditable() || !canReadContents)) || (!file.isFile && !canRead) ? (
        <div className={`${linkClasses} cursor-default`}>{children}</div>
    ) : (
        <NavLink className={linkClasses} to={`${match.url}#${encodePathSegments(join(directory, file.name))}`}>
            {children}
        </NavLink>
    );
}, isEqual);

const FileObjectRow = ({ file }: { file: FileObject }) => (
    <div
        className={'grid grid-cols-12 gap-4 items-center px-4 py-2.5 hover:bg-neutral-800/40 transition-colors'}
        key={file.name}
        onContextMenu={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: e.clientX }));
        }}
    >
        <div className={'col-span-6 flex items-center gap-3 min-w-0'}>
            <SelectFileCheckbox name={file.name} />
            <Clickable file={file}>
                <span className={'flex-none text-neutral-400'}>
                    {file.isFile ? (
                        file.isSymlink ? (
                            <LinkIcon className={'w-4 h-4'} />
                        ) : file.isArchiveType() ? (
                            <ArchiveIcon className={'w-4 h-4'} />
                        ) : (
                            <DocumentIcon className={'w-4 h-4'} />
                        )
                    ) : (
                        <FolderIcon className={'w-4 h-4'} />
                    )}
                </span>
                <span className={'text-sm text-neutral-200 truncate'}>{file.name}</span>
            </Clickable>
        </div>
        <div className={'col-span-2 text-right'}>
            {file.isFile && <span className={'text-xs font-mono text-neutral-500'}>{bytesToString(file.size)}</span>}
        </div>
        <div className={'col-span-3'}>
            <p className={'text-xs text-neutral-500 m-0'} title={file.modifiedAt.toString()}>
                {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                    ? format(file.modifiedAt, 'MMM do, yyyy h:mma')
                    : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
            </p>
        </div>
        <div className={'col-span-1 flex items-center justify-end'}>
            <FileDropdownMenu file={file} />
        </div>
    </div>
);

export default memo(FileObjectRow, (prevProps, nextProps) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...prevFile } = prevProps.file;
    const { isArchiveType: nextIsArchiveType, isEditable: nextIsEditable, ...nextFile } = nextProps.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return isEqual(prevFile, nextFile);
});
