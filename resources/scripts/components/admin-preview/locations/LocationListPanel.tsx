import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Globe, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getLocations } from '@/api/admin/locations';
import LocationCreateModal from '@/components/admin-preview/locations/LocationCreateModal';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

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
                    history.push(`${adminPreviewBasePath}/locations/${id}`);
                }}
            />

            <div className="rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Location list</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Organize nodes into geographic or logical groupings.
                        </p>
                    </div>
                    <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create new
                    </Button>
                </div>

                {locations.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-12 text-center">
                        <Globe className="mb-4 h-10 w-10 text-muted-foreground" />
                        <p className="text-base font-medium text-foreground">No locations</p>
                        <p className="mt-1 text-sm text-muted-foreground">Create a location to organize your nodes.</p>
                        <Button className="mt-5" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create new
                        </Button>
                    </div>
                ) : (
                    <div className={tableWrapClass}>
                        <table className={tableClass}>
                            <thead>
                                <tr className={tableHeadRowClass}>
                                    <th className={tableHeadCellClass}>ID</th>
                                    <th className={tableHeadCellClass}>Short code</th>
                                    <th className={tableHeadCellClass}>Description</th>
                                    <th className={cn(tableHeadCellClass, 'text-center')}>Nodes</th>
                                    <th className={cn(tableHeadCellClass, 'text-center')}>Servers</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.map((location) => (
                                    <tr key={location.id} className={tableBodyRowClass}>
                                        <td className={tableBodyCellClass}>
                                            <code className="text-xs text-muted-foreground">{location.id}</code>
                                        </td>
                                        <td className={tableBodyCellClass}>
                                            <Link
                                                to={`${adminPreviewBasePath}/locations/${location.id}`}
                                                className="font-medium text-primary no-underline hover:underline"
                                            >
                                                {location.short}
                                            </Link>
                                        </td>
                                        <td className={cn(tableBodyCellClass, 'max-w-md text-muted-foreground')}>
                                            {location.long || '—'}
                                        </td>
                                        <td className={cn(tableBodyCellClass, 'text-center')}>{location.nodes_count}</td>
                                        <td className={cn(tableBodyCellClass, 'text-center')}>{location.servers_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};
