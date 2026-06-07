import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { addServerMount, getServerMounts, removeServerMount } from '@/api/admin/servers';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
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
            .then((response) => {
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

    return (
        <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">Available mounts</h2>
            </div>
            {mounts.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No compatible mounts available for this server.
                </div>
            ) : (
                <div className={tableWrapClass}>
                    <table className={tableClass}>
                        <thead>
                            <tr className={tableHeadRowClass}>
                                <th className={tableHeadCellClass}>ID</th>
                                <th className={tableHeadCellClass}>Name</th>
                                <th className={tableHeadCellClass}>Source</th>
                                <th className={tableHeadCellClass}>Target</th>
                                <th className={tableHeadCellClass}>Status</th>
                                <th className={tableHeadCellClass} />
                            </tr>
                        </thead>
                        <tbody>
                            {mounts.map((mount) => (
                                <tr key={mount.id} className={tableBodyRowClass}>
                                    <td className={tableBodyCellClass}>
                                        <code className="text-xs">{mount.id}</code>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <Link
                                            to={`${adminPreviewBasePath}/mounts/${mount.id}`}
                                            className="text-primary no-underline hover:underline"
                                        >
                                            {mount.name}
                                        </Link>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <code className="text-xs">{mount.source}</code>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <code className="text-xs">{mount.target}</code>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <span
                                            className={
                                                mount.mounted
                                                    ? 'rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-500'
                                                    : 'rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary'
                                            }
                                        >
                                            {mount.mounted ? 'Mounted' : 'Unmounted'}
                                        </span>
                                    </td>
                                    <td className={tableBodyCellClass}>
                                        <Button
                                            type="button"
                                            variant={mount.mounted ? 'destructive' : 'default'}
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={workingId === mount.id}
                                            onClick={() => onToggle(mount.id, mount.mounted)}
                                        >
                                            {mount.mounted ? (
                                                <Minus className="h-4 w-4" />
                                            ) : (
                                                <Plus className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
