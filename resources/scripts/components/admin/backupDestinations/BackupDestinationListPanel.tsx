import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getBackupDestinations } from '@/api/admin/backupDestinations';
import BackupDestinationCreateModal from '@/components/admin/backupDestinations/BackupDestinationCreateModal';
import { adminBasePath } from '@/routers/adminRoutes';

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-backup-destinations', getBackupDestinations);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-backup-destinations', error });
        } else {
            clearFlashes('admin-backup-destinations');
        }
    }, [error]);

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const destinations = data?.backup_destinations ?? [];

    return (
        <>
            <BackupDestinationCreateModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(id) => {
                    mutate();
                    history.push(`${adminBasePath}/backup-destinations/${id}`);
                }}
            />

            <div className={'overflow-hidden rounded-md border border-border bg-card'}>
                <div className={'flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between'}>
                    <div>
                        <h2 className={'text-base font-semibold text-foreground'}>Backup Destinations</h2>
                        <p className={'mt-0.5 text-sm text-muted-foreground'}>
                            Named S3 buckets that can be assigned to one or more locations.
                        </p>
                    </div>
                    <Button className={'shrink-0'} onClick={() => setCreateOpen(true)}>
                        <Plus className={'mr-2 h-4 w-4'} />
                        Create destination
                    </Button>
                </div>

                {destinations.length === 0 ? (
                    <p className={'px-5 py-8 text-sm text-muted-foreground'}>
                        No backup destinations yet.{' '}
                        <button
                            type={'button'}
                            className={'text-blue-400 hover:text-blue-300'}
                            onClick={() => setCreateOpen(true)}
                        >
                            Create your first destination
                        </button>
                        .
                    </p>
                ) : (
                    <div className={'divide-y divide-border'}>
                        {destinations.map((destination) => (
                            <Link
                                key={destination.id}
                                to={`${adminBasePath}/backup-destinations/${destination.id}`}
                                className={'block px-5 py-4 no-underline transition-colors hover:bg-muted/50'}
                            >
                                <div className={'flex items-center justify-between gap-4'}>
                                    <div className={'min-w-0'}>
                                        <p className={'text-sm font-medium text-foreground'}>{destination.name}</p>
                                        <p className={'mt-1 truncate text-xs text-muted-foreground'}>
                                            {destination.bucket ?? 'No bucket configured'}
                                            {destination.region ? ` · ${destination.region}` : ''}
                                        </p>
                                    </div>
                                    <div className={'shrink-0 text-right text-xs text-muted-foreground'}>
                                        <p>
                                            {destination.locations_count}{' '}
                                            {destination.locations_count === 1 ? 'location' : 'locations'}
                                        </p>
                                        <code className={'mt-1 inline-block'}>#{destination.id}</code>
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
