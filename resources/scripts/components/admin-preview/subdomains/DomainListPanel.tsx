import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteSubdomainDomain, getSubdomainDomains } from '@/api/admin/subdomains';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

export default () => {
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR('admin-subdomain-domains', getSubdomainDomains);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-subdomains', error });
        } else {
            clearFlashes('admin-subdomains');
        }
    }, [error]);

    const onDelete = () => {
        if (confirmDelete === null) return;

        setDeleting(true);
        clearFlashes('admin-subdomains');

        deleteSubdomainDomain(confirmDelete)
            .then(() => {
                addFlash({
                    key: 'admin-subdomains',
                    type: 'success',
                    title: 'Domain removed',
                    message: 'The domain and all related data were deleted.',
                });
                setConfirmDelete(null);
                mutate();
            })
            .catch((deleteError) => {
                clearAndAddHttpError({ key: 'admin-subdomains', error: deleteError });
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    const domains = data?.domains ?? [];

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete domain"
                confirm="Delete"
                open={confirmDelete !== null}
                onClose={() => setConfirmDelete(null)}
                onConfirmed={onDelete}
            >
                Remove this domain? All related subdomains and record templates will also be deleted.
            </Dialog.Confirm>

            <div className="overflow-hidden rounded-md border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Domains</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            DNS provider credentials for customer subdomain creation.
                        </p>
                    </div>
                    <Link to={`${adminPreviewBasePath}/subdomains/new`} className="shrink-0 no-underline">
                        <Button disabled={deleting}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create domain
                        </Button>
                    </Link>
                </div>

                {domains.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">
                        No domains yet.{' '}
                        <Link
                            to={`${adminPreviewBasePath}/subdomains/new`}
                            className="text-blue-400 no-underline hover:text-blue-300"
                        >
                            Create your first domain
                        </Link>
                        .
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {domains.map((domain) => (
                            <div
                                key={domain.id}
                                className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                            >
                                <Link
                                    to={`${adminPreviewBasePath}/subdomains/${domain.id}`}
                                    className="min-w-0 flex-1 no-underline"
                                >
                                    <p className="text-sm font-medium text-foreground">{domain.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{domain.display_type}</p>
                                </Link>
                                <div className="flex shrink-0 items-center gap-3">
                                    <code className="text-xs text-muted-foreground">#{domain.id}</code>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        disabled={deleting}
                                        onClick={() => setConfirmDelete(domain.id)}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
