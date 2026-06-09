import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getNests } from '@/api/admin/nests';
import NestEggImportModal from '@/components/admin/nests/NestEggImportModal';
import { adminBasePath } from '@/routers/adminRoutes';

export default () => {
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-nests', getNests);
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nests', error });
        } else {
            clearFlashes('admin-nests');
        }
    }, [error]);

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const nests = data?.nests ?? [];

    return (
        <>
            <NestEggImportModal
                open={importOpen}
                nests={nests}
                onClose={() => setImportOpen(false)}
                onImported={(eggId) => {
                    mutate();
                    history.push(`${adminBasePath}/nests/eggs/${eggId}`);
                }}
            />

            <p className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-muted-foreground">
                Editing eggs incorrectly can break servers. Avoid changing default eggs from{' '}
                <code>support@realmctl.com</code> unless you know what you are doing.
            </p>

            <div className="overflow-hidden rounded-md border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Nests</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Service categories and the eggs customers deploy from.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            disabled={nests.length === 0}
                            onClick={() => setImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import egg
                        </Button>
                        <Link to={`${adminBasePath}/nests/new`} className="no-underline">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create nest
                            </Button>
                        </Link>
                    </div>
                </div>

                {nests.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">
                        No nests yet.{' '}
                        <Link
                            to={`${adminBasePath}/nests/new`}
                            className="text-blue-400 no-underline hover:text-blue-300"
                        >
                            Create your first nest
                        </Link>
                        .
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {nests.map((nest) => (
                            <Link
                                key={nest.id}
                                to={`${adminBasePath}/nests/${nest.id}`}
                                className="block px-5 py-4 no-underline transition-colors hover:bg-muted/50"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground">{nest.name}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {nest.author}
                                            {nest.description ? ` · ${nest.description}` : ''}
                                            {' · '}
                                            {nest.eggs_count} {nest.eggs_count === 1 ? 'egg' : 'eggs'}
                                            {' · '}
                                            {nest.servers_count}{' '}
                                            {nest.servers_count === 1 ? 'server' : 'servers'}
                                        </p>
                                    </div>
                                    <code className="shrink-0 text-xs text-muted-foreground">#{nest.id}</code>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
