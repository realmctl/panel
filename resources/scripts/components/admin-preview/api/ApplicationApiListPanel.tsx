import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Key, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import CopyOnClick from '@/components/elements/CopyOnClick';
import useFlash from '@/plugins/useFlash';
import {
    ApplicationApiKey,
    getApplicationApiKeys,
    revokeApplicationApiKey,
} from '@/api/admin/applicationApi';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableMetaLabelClass,
    tableMetaValueClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

const formatDate = (value: string | null) => {
    if (!value) return null;

    return format(new Date(value), 'MMM d, yyyy · HH:mm');
};

export default () => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-application-api', getApplicationApiKeys);
    const [revokeIdentifier, setRevokeIdentifier] = useState('');
    const [revoking, setRevoking] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-api', error });
        } else {
            clearFlashes('admin-api');
        }
    }, [error]);

    const onRevoke = () => {
        if (!revokeIdentifier) return;

        setRevoking(true);
        clearFlashes('admin-api');

        revokeApplicationApiKey(revokeIdentifier)
            .then(() => {
                addFlash({
                    key: 'admin-api',
                    type: 'success',
                    title: 'Key revoked',
                    message: 'The API key has been revoked.',
                });
                setRevokeIdentifier('');
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-api', error: submitError });
            })
            .finally(() => setRevoking(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const keys = data?.keys ?? [];

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Revoke API key"
                confirm="Revoke"
                open={!!revokeIdentifier}
                onClose={() => setRevokeIdentifier('')}
                onConfirmed={onRevoke}
            >
                Once this API key is revoked, any applications currently using it will stop working.
            </Dialog.Confirm>

            <div className="rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">API credentials</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Application API keys for integrating with the panel programmatically.
                        </p>
                    </div>
                    <Link to={`${adminPreviewBasePath}/api/new`} className="shrink-0 no-underline">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create new
                        </Button>
                    </Link>
                </div>

                {keys.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-12 text-center">
                        <Key className="mb-4 h-10 w-10 text-muted-foreground" />
                        <p className="text-base font-medium text-foreground">No API keys</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create your first API key to get started.
                        </p>
                        <Link to={`${adminPreviewBasePath}/api/new`} className="mt-5 no-underline">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create new
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className={tableWrapClass}>
                        <table className={tableClass}>
                            <thead>
                                <tr className={tableHeadRowClass}>
                                    <th className={tableHeadCellClass}>Description</th>
                                    <th className={tableHeadCellClass}>Key</th>
                                    <th className={tableHeadCellClass}>Last used</th>
                                    <th className={tableHeadCellClass}>Created</th>
                                    <th className={tableHeadCellClass}>Created by</th>
                                    <th className={cn(tableHeadCellClass, 'w-16 text-right')}> </th>
                                </tr>
                            </thead>
                            <tbody>
                                {keys.map((key: ApplicationApiKey) => {
                                    const lastUsed = formatDate(key.last_used_at);
                                    const created = formatDate(key.created_at);

                                    return (
                                        <tr key={key.identifier} className={tableBodyRowClass}>
                                            <td className={tableBodyCellClass}>
                                                <p className="font-medium text-foreground">{key.memo || 'Untitled key'}</p>
                                                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                                    {key.identifier}
                                                </p>
                                            </td>
                                            <td className={tableBodyCellClass}>
                                                <CopyOnClick text={key.display_key.endsWith('****') ? undefined : key.display_key}>
                                                    <code
                                                        className="block max-w-xs truncate rounded-md border border-border bg-muted/60 px-2.5 py-1.5 font-mono text-xs text-foreground sm:max-w-sm"
                                                        title={key.display_key}
                                                    >
                                                        {key.display_key}
                                                    </code>
                                                </CopyOnClick>
                                            </td>
                                            <td className={tableBodyCellClass}>
                                                {lastUsed ? (
                                                    <span className={tableMetaValueClass}>{lastUsed}</span>
                                                ) : (
                                                    <span className={tableMetaLabelClass}>Never</span>
                                                )}
                                            </td>
                                            <td className={tableBodyCellClass}>
                                                {created ? (
                                                    <span className={tableMetaValueClass}>{created}</span>
                                                ) : (
                                                    <span className={tableMetaLabelClass}>—</span>
                                                )}
                                            </td>
                                            <td className={tableBodyCellClass}>
                                                {key.user ? (
                                                    <Link
                                                        to={`${adminPreviewBasePath}/users/${key.user.id}`}
                                                        className="inline-flex rounded-md bg-muted/60 px-2.5 py-1 text-sm font-medium text-foreground no-underline transition-colors hover:bg-muted hover:text-primary"
                                                    >
                                                        {key.user.username}
                                                    </Link>
                                                ) : (
                                                    <span className={tableMetaLabelClass}>—</span>
                                                )}
                                            </td>
                                            <td className={cn(tableBodyCellClass, 'text-right')}>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    disabled={revoking}
                                                    onClick={() => setRevokeIdentifier(key.identifier)}
                                                    title="Revoke"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};
