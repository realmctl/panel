import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getMounts } from '@/api/admin/mounts';
import MountCreateModal from '@/components/admin-preview/mounts/MountCreateModal';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-mounts', getMounts);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-mounts', error });
        } else {
            clearFlashes('admin-mounts');
        }
    }, [error]);

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const mounts = data?.mounts ?? [];

    return (
        <>
            <MountCreateModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(id) => {
                    mutate();
                    history.push(`${adminPreviewBasePath}/mounts/${id}`);
                }}
            />

            <div className="overflow-hidden rounded-md border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Mounts</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Bind host paths into server containers.
                        </p>
                    </div>
                    <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create mount
                    </Button>
                </div>

                {mounts.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">
                        No mounts yet.{' '}
                        <button
                            type="button"
                            className="text-blue-400 hover:text-blue-300"
                            onClick={() => setCreateOpen(true)}
                        >
                            Create your first mount
                        </button>
                        .
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {mounts.map((mount) => (
                            <Link
                                key={mount.id}
                                to={`${adminPreviewBasePath}/mounts/${mount.id}`}
                                className="block px-5 py-4 no-underline transition-colors hover:bg-muted/50"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground">{mount.name}</p>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">
                                            <code className="text-foreground">{mount.source}</code>
                                            {' → '}
                                            <code className="text-foreground">{mount.target}</code>
                                            {' · '}
                                            {mount.eggs_count} {mount.eggs_count === 1 ? 'egg' : 'eggs'}
                                            {' · '}
                                            {mount.nodes_count} {mount.nodes_count === 1 ? 'node' : 'nodes'}
                                            {' · '}
                                            {mount.servers_count}{' '}
                                            {mount.servers_count === 1 ? 'server' : 'servers'}
                                        </p>
                                    </div>
                                    <code className="shrink-0 text-xs text-muted-foreground">#{mount.id}</code>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
