import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Globe, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteSubdomainDomain, getSubdomainDomains } from '@/api/admin/subdomains';
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

            <div className="rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Domains</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            DNS provider credentials for customer subdomain creation.
                        </p>
                    </div>
                    <Link to={`${adminPreviewBasePath}/subdomains/new`} className="shrink-0 no-underline">
                        <Button disabled={deleting}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create new
                        </Button>
                    </Link>
                </div>

                {domains.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-12 text-center">
                        <Globe className="mb-4 h-10 w-10 text-muted-foreground" />
                        <p className="text-base font-medium text-foreground">No domains configured</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add a domain to allow customers to create subdomains.
                        </p>
                        <Link to={`${adminPreviewBasePath}/subdomains/new`} className="mt-5 no-underline">
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
                                    <th className={tableHeadCellClass}>ID</th>
                                    <th className={tableHeadCellClass}>Name</th>
                                    <th className={tableHeadCellClass}>Provider</th>
                                    <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {domains.map((domain) => (
                                    <tr key={domain.id} className={tableBodyRowClass}>
                                        <td className={tableBodyCellClass}>
                                            <code className="text-xs text-muted-foreground">{domain.id}</code>
                                        </td>
                                        <td className={tableBodyCellClass}>
                                            <Link
                                                to={`${adminPreviewBasePath}/subdomains/${domain.id}`}
                                                className="font-medium text-primary no-underline hover:underline"
                                            >
                                                {domain.name}
                                            </Link>
                                        </td>
                                        <td className={tableBodyCellClass}>{domain.display_type}</td>
                                        <td className={cn(tableBodyCellClass, 'text-right')}>
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    to={`${adminPreviewBasePath}/subdomains/${domain.id}`}
                                                    className="no-underline"
                                                >
                                                    <Button variant="outline" size="sm">
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={deleting}
                                                    onClick={() => setConfirmDelete(domain.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
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
