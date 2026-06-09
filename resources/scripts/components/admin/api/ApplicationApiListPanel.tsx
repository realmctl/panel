import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
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
import { adminBasePath } from '@/routers/adminRoutes';

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

            <div className="overflow-hidden rounded-md border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">API credentials</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Keys for integrating with the panel programmatically.
                        </p>
                    </div>
                    <Link to={`${adminBasePath}/api/new`} className="shrink-0 no-underline">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create key
                        </Button>
                    </Link>
                </div>

                {keys.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">
                        No API keys yet.{' '}
                        <Link
                            to={`${adminBasePath}/api/new`}
                            className="text-blue-400 no-underline hover:text-blue-300"
                        >
                            Create your first key
                        </Link>
                        .
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {keys.map((key: ApplicationApiKey) => {
                            const lastUsed = formatDate(key.last_used_at);
                            const created = formatDate(key.created_at);

                            return (
                                <div
                                    key={key.identifier}
                                    className="flex items-start justify-between gap-4 px-5 py-4"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="text-sm font-medium text-foreground">
                                                {key.memo || 'Untitled key'}
                                            </span>
                                            <code className="text-xs text-muted-foreground">{key.identifier}</code>
                                        </div>
                                        <CopyOnClick
                                            text={key.display_key.endsWith('****') ? undefined : key.display_key}
                                        >
                                            <code
                                                className="mt-2 inline-block max-w-full truncate rounded bg-muted/50 px-2 py-1 font-mono text-xs text-foreground"
                                                title={key.display_key}
                                            >
                                                {key.display_key}
                                            </code>
                                        </CopyOnClick>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {lastUsed ? `Last used ${lastUsed}` : 'Never used'}
                                            {created ? ` · Created ${created}` : ''}
                                            {key.user ? (
                                                <>
                                                    {' · '}
                                                    <Link
                                                        to={`${adminBasePath}/users/${key.user.id}`}
                                                        className="text-foreground no-underline hover:text-blue-400"
                                                    >
                                                        {key.user.username}
                                                    </Link>
                                                </>
                                            ) : null}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                        disabled={revoking}
                                        onClick={() => setRevokeIdentifier(key.identifier)}
                                        title="Revoke"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};
