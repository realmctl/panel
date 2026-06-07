import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { LayoutTemplate, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteSubdomainRecord, getSubdomainRecords } from '@/api/admin/subdomains';
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
    const [page, setPage] = useState(1);
    const { data, error, isValidating, mutate } = useSWR(
        ['admin-subdomain-records', page],
        () => getSubdomainRecords(page)
    );
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

        deleteSubdomainRecord(confirmDelete)
            .then(() => {
                addFlash({
                    key: 'admin-subdomains',
                    type: 'success',
                    title: 'Record removed',
                    message: 'The record template was deleted.',
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

    const records = data?.records ?? [];
    const pagination = data?.pagination ?? { current_page: 1, last_page: 1, total: 0 };

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete record template"
                confirm="Delete"
                open={confirmDelete !== null}
                onClose={() => setConfirmDelete(null)}
                onConfirmed={onDelete}
            >
                Remove this record template?
            </Dialog.Confirm>

            <div className="rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Record templates</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Templates customers choose when creating a subdomain.
                        </p>
                    </div>
                    <Link to={`${adminPreviewBasePath}/subdomains/records/new`} className="shrink-0 no-underline">
                        <Button disabled={deleting}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create new
                        </Button>
                    </Link>
                </div>

                {records.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-12 text-center">
                        <LayoutTemplate className="mb-4 h-10 w-10 text-muted-foreground" />
                        <p className="text-base font-medium text-foreground">No record templates</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create a template to let customers create subdomains.
                        </p>
                        <Link to={`${adminPreviewBasePath}/subdomains/records/new`} className="mt-5 no-underline">
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
                                    <th className={tableHeadCellClass}>Type</th>
                                    <th className={tableHeadCellClass}>Domain</th>
                                    <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => (
                                    <tr key={record.id} className={tableBodyRowClass}>
                                        <td className={tableBodyCellClass}>
                                            <code className="text-xs text-muted-foreground">{record.id}</code>
                                        </td>
                                        <td className={tableBodyCellClass}>
                                            <Link
                                                to={`${adminPreviewBasePath}/subdomains/records/${record.id}`}
                                                className="font-medium text-primary no-underline hover:underline"
                                            >
                                                {record.name}
                                            </Link>
                                        </td>
                                        <td className={tableBodyCellClass}>{record.type}</td>
                                        <td className={tableBodyCellClass}>{record.domain.name}</td>
                                        <td className={cn(tableBodyCellClass, 'text-right')}>
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    to={`${adminPreviewBasePath}/subdomains/records/${record.id}`}
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
                                                    onClick={() => setConfirmDelete(record.id)}
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

                {pagination.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-5 py-4">
                        <p className="text-sm text-muted-foreground">
                            Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page <= 1}
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => setPage((current) => current + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
