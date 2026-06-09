import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getLocations } from '@/api/admin/locations';
import LocationCreateModal from '@/components/admin/locations/LocationCreateModal';
import { adminBasePath } from '@/routers/adminRoutes';

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-locations', getLocations);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-locations', error });
        } else {
            clearFlashes('admin-locations');
        }
    }, [error]);

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const locations = data?.locations ?? [];

    return (
        <>
            <LocationCreateModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(id) => {
                    mutate();
                    history.push(`${adminBasePath}/locations/${id}`);
                }}
            />

            <div className="overflow-hidden rounded-md border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Locations</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Geographic or logical groupings for your nodes.
                        </p>
                    </div>
                    <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create location
                    </Button>
                </div>

                {locations.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">
                        No locations yet.{' '}
                        <button
                            type="button"
                            className="text-blue-400 hover:text-blue-300"
                            onClick={() => setCreateOpen(true)}
                        >
                            Create your first location
                        </button>
                        .
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {locations.map((location) => (
                            <Link
                                key={location.id}
                                to={`${adminBasePath}/locations/${location.id}`}
                                className="block px-5 py-4 no-underline transition-colors hover:bg-muted/50"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground">{location.short}</p>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">
                                            {location.long || 'No description'}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                                        <p>
                                            {location.nodes_count}{' '}
                                            {location.nodes_count === 1 ? 'node' : 'nodes'}
                                        </p>
                                        <p>
                                            {location.servers_count}{' '}
                                            {location.servers_count === 1 ? 'server' : 'servers'}
                                        </p>
                                        <code className="mt-1 inline-block">#{location.id}</code>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
