import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteSubdomainRecord, getSubdomainRecords } from '@/api/admin/subdomains';
import { adminBasePath } from '@/routers/adminRoutes';

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

            <div className="overflow-hidden rounded-md border border-border bg-card">
                <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Record templates</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Templates customers choose when creating a subdomain.
                        </p>
                    </div>
                    <Link to={`${adminBasePath}/subdomains/records/new`} className="shrink-0 no-underline">
                        <Button disabled={deleting}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create template
                        </Button>
                    </Link>
                </div>

                {records.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">
                        No record templates yet.{' '}
                        <Link
                            to={`${adminBasePath}/subdomains/records/new`}
                            className="text-blue-400 no-underline hover:text-blue-300"
                        >
                            Create your first template
                        </Link>
                        .
                    </p>
                ) : (
                    <div className="divide-y divide-border">
                        {records.map((record) => (
                            <div
                                key={record.id}
                                className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                            >
                                <Link
                                    to={`${adminBasePath}/subdomains/records/${record.id}`}
                                    className="min-w-0 flex-1 no-underline"
                                >
                                    <p className="text-sm font-medium text-foreground">{record.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {record.type} · {record.domain.name}
                                    </p>
                                </Link>
                                <div className="flex shrink-0 items-center gap-3">
                                    <code className="text-xs text-muted-foreground">#{record.id}</code>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        disabled={deleting}
                                        onClick={() => setConfirmDelete(record.id)}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
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
