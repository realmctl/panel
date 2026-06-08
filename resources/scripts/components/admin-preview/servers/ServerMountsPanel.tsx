import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { addServerMount, getServer, getServerMounts, removeServerMount } from '@/api/admin/servers';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data: serverData } = useSWR(
        Number.isFinite(serverId) ? `admin-server-${serverId}` : null,
        () => getServer(serverId)
    );
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(serverId) ? `admin-server-mounts-${serverId}` : null,
        () => getServerMounts(serverId)
    );
    const [workingId, setWorkingId] = useState<number | null>(null);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
        }
    }, [error, clearAndAddHttpError, clearFlashes]);

    const onToggle = (mountId: number, mounted: boolean) => {
        setWorkingId(mountId);
        clearFlashes('admin-servers');

        const action = mounted ? removeServerMount(serverId, mountId) : addServerMount(serverId, mountId);

        action
            .then((response: any) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: mounted ? 'Mount removed' : 'Mount added',
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-servers', error: submitError });
            })
            .finally(() => setWorkingId(null));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load mounts.</p>;
    }

    const mounts = data.mounts ?? [];
    const serverName = serverData?.server.name ?? `Server #${serverId}`;

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">{serverName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Mount assignments</p>
            </div>

            <div className="overflow-hidden rounded-md border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold text-foreground">Available mounts</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Compatible mounts for this server's egg and node.
                    </p>
                </div>

                {mounts.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">
                        No compatible mounts available.{' '}
                        <Link
                            to={`${adminPreviewBasePath}/mounts`}
                            className="text-blue-400 no-underline hover:text-blue-300"
                        >
                            Manage mounts
                        </Link>
                        .
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {mounts.map((mount) => (
                            <div key={mount.id} className="flex items-start justify-between gap-4 px-5 py-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link
                                            to={`${adminPreviewBasePath}/mounts/${mount.id}`}
                                            className="text-sm font-medium text-blue-400 no-underline hover:text-blue-300"
                                        >
                                            {mount.name}
                                        </Link>
                                        <code className="text-xs text-muted-foreground">#{mount.id}</code>
                                        <span
                                            className={
                                                mount.mounted
                                                    ? 'rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400'
                                                    : 'rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground'
                                            }
                                        >
                                            {mount.mounted ? 'Mounted' : 'Unmounted'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        <code>{mount.source}</code>
                                        {' → '}
                                        <code>{mount.target}</code>
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant={mount.mounted ? 'outline' : 'default'}
                                    size="sm"
                                    className={
                                        mount.mounted
                                            ? 'shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive'
                                            : 'shrink-0'
                                    }
                                    disabled={workingId === mount.id}
                                    onClick={() => onToggle(mount.id, mount.mounted)}
                                >
                                    {mount.mounted ? (
                                        <>
                                            <Minus className="mr-1.5 h-4 w-4" />
                                            Unmount
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-1.5 h-4 w-4" />
                                            Mount
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
