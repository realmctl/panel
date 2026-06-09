import React, { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import {
    deleteNodeAllocation,
    deleteNodeAllocationBlock,
    deleteNodeAllocations,
    getNodeAllocations,
} from '@/api/admin/nodes';
import AllocationAliasInput from '@/components/admin/nodes/AllocationAliasInput';
import AllocationCreateForm from '@/components/admin/nodes/AllocationCreateForm';
import { selectClass } from '@/components/admin/settings/fieldClass';
import { SettingRow } from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';

export default () => {
    const { id } = useParams<{ id: string }>();
    const nodeId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const [confirmSingle, setConfirmSingle] = useState<number | null>(null);
    const [confirmMass, setConfirmMass] = useState(false);
    const [blockOpen, setBlockOpen] = useState(false);
    const [blockIp, setBlockIp] = useState('');
    const [deleting, setDeleting] = useState(false);

    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(nodeId) ? ['admin-node-allocations', nodeId, page] : null,
        () => getNodeAllocations(nodeId, page),
        { revalidateOnFocus: false }
    );

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nodes', error });
        }
    }, [error, clearAndAddHttpError]);

    useEffect(() => {
        setSelected(new Set());
    }, [page]);

    const handleAliasUpdated = useCallback(
        (allocationId: number, alias: string) => {
            mutate(
                (current) => {
                    if (!current) {
                        return current;
                    }

                    return {
                        ...current,
                        allocations: current.allocations.map((allocation) =>
                            allocation.id === allocationId
                                ? { ...allocation, ip_alias: alias || null }
                                : allocation
                        ),
                    };
                },
                false
            );
        },
        [mutate]
    );

    const toggleSelect = (allocationId: number, checked: boolean) => {
        setSelected((current) => {
            const next = new Set(current);
            if (checked) {
                next.add(allocationId);
            } else {
                next.delete(allocationId);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (!data) return;

        const selectable = data.allocations.filter((allocation) => !allocation.server_id).map((a) => a.id);
        const allSelected = selectable.every((allocationId) => selected.has(allocationId));

        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(selectable));
        }
    };

    const onDeleteSingle = () => {
        if (confirmSingle === null) return;

        setDeleting(true);
        clearFlashes('admin-nodes');

        deleteNodeAllocation(nodeId, confirmSingle)
            .then((response: any) => {
                addFlash({
                    key: 'admin-nodes',
                    type: 'success',
                    title: 'Allocation deleted',
                    message: response.message,
                });
                setConfirmSingle(null);
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-nodes', error: submitError });
                setConfirmSingle(null);
            })
            .finally(() => setDeleting(false));
    };

    const onDeleteMass = () => {
        setDeleting(true);
        clearFlashes('admin-nodes');

        deleteNodeAllocations(
            nodeId,
            Array.from(selected).map((allocationId) => ({ id: allocationId }))
        )
            .then((response: any) => {
                addFlash({
                    key: 'admin-nodes',
                    type: 'success',
                    title: 'Allocations deleted',
                    message: response.message,
                });
                setConfirmMass(false);
                setSelected(new Set());
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-nodes', error: submitError });
                setConfirmMass(false);
            })
            .finally(() => setDeleting(false));
    };

    const onDeleteBlock = () => {
        if (!blockIp) return;

        setDeleting(true);
        clearFlashes('admin-nodes');

        deleteNodeAllocationBlock(nodeId, blockIp)
            .then((response: any) => {
                addFlash({
                    key: 'admin-nodes',
                    type: 'success',
                    title: 'IP block deleted',
                    message: response.message,
                });
                setBlockOpen(false);
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-nodes', error: submitError });
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load allocations.</p>;
    }

    const allocations = Array.isArray(data.allocations) ? data.allocations : [];
    const ips = Array.isArray(data.ips) ? data.ips : [];
    const pagination = data.pagination ?? { current_page: 1, last_page: 1, total: 0 };
    const selectableCount = allocations.filter((allocation) => !allocation.server_id).length;
    const assignedCount = allocations.filter((allocation) => allocation.server_id).length;
    const allSelectableSelected =
        selectableCount > 0 && allocations.filter((a) => !a.server_id).every((a) => selected.has(a.id));

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete allocation"
                confirm="Delete"
                open={confirmSingle !== null}
                onClose={() => setConfirmSingle(null)}
                onConfirmed={onDeleteSingle}
            >
                Are you sure you want to delete this allocation?
            </Dialog.Confirm>

            <Dialog.Confirm
                appearance="admin"
                title="Delete selected allocations"
                confirm="Delete"
                open={confirmMass}
                onClose={() => setConfirmMass(false)}
                onConfirmed={onDeleteMass}
            >
                Are you sure you want to delete {selected.size} selected allocation(s)?
            </Dialog.Confirm>

            <Dialog
                appearance="admin"
                open={blockOpen}
                onClose={() => setBlockOpen(false)}
                title="Delete IP block"
            >
                <p className="text-sm text-muted-foreground">
                    Remove all unassigned allocations for a specific IP address.
                </p>
                <div className="mt-4">
                    <SettingRow label="IP address" description="Select the IP block to clear." stacked>
                        <select
                            id="block-ip"
                            className={selectClass}
                            value={blockIp}
                            onChange={(e) => setBlockIp(e.target.value)}
                        >
                            {ips.map((ip) => (
                                <option key={ip} value={ip}>
                                    {ip}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                </div>
                <Dialog.Footer>
                    <Button type="button" variant="outline" onClick={() => setBlockOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" disabled={deleting} onClick={onDeleteBlock}>
                        Delete allocations
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
                <div className="order-1 lg:order-2 lg:col-span-1">
                    <AllocationCreateForm nodeId={nodeId} ips={ips} onCreated={() => mutate()} />
                </div>

                <div className="order-2 lg:order-1 lg:col-span-2">
                    <div className="overflow-hidden rounded-md border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Allocations</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {pagination.total} total
                                {allocations.length > 0 && (
                                    <>
                                        {' · '}
                                        {assignedCount} assigned
                                        {' · '}
                                        {allocations.length - assignedCount} unassigned
                                    </>
                                )}
                            </p>
                        </div>

                        {(selectableCount > 0 || ips.length > 0) && (
                            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-5 py-3">
                                {selectableCount > 0 && (
                                    <label className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
                                        <input
                                            type="checkbox"
                                            className="rounded border-border accent-primary"
                                            checked={allSelectableSelected}
                                            onChange={toggleSelectAll}
                                        />
                                        Select all unassigned
                                    </label>
                                )}
                                {selected.size > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={deleting}
                                        onClick={() => setConfirmMass(true)}
                                    >
                                        Delete selected ({selected.size})
                                    </Button>
                                )}
                                {ips.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={deleting}
                                        onClick={() => {
                                            setBlockIp(ips[0]);
                                            setBlockOpen(true);
                                        }}
                                    >
                                        Delete IP block
                                    </Button>
                                )}
                            </div>
                        )}

                        {allocations.length === 0 ? (
                            <p className="px-5 py-8 text-sm text-muted-foreground">
                                No allocations on this node yet. Use the form to assign IP addresses and ports.
                            </p>
                        ) : (
                            <div className="divide-y divide-border">
                                {allocations.map((allocation) => {
                                    const isAssigned = Boolean(allocation.server_id);

                                    return (
                                        <div key={allocation.id} className="px-5 py-4">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 rounded border-border accent-primary"
                                                    disabled={isAssigned}
                                                    checked={selected.has(allocation.id)}
                                                    onChange={(e) =>
                                                        toggleSelect(allocation.id, e.target.checked)
                                                    }
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-foreground">
                                                                <code>{allocation.ip}</code>:
                                                                <code>{allocation.port}</code>
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {isAssigned && allocation.server ? (
                                                                    <>
                                                                        Assigned to{' '}
                                                                        <Link
                                                                            to={`${adminBasePath}/servers/${allocation.server.id}`}
                                                                            className="text-blue-400 no-underline hover:text-blue-300"
                                                                        >
                                                                            {allocation.server.name}
                                                                        </Link>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-emerald-600 dark:text-emerald-500">
                                                                        Unassigned
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        {!isAssigned && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                disabled={deleting}
                                                                onClick={() => setConfirmSingle(allocation.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 max-w-xs">
                                                        <p className="mb-1.5 text-xs text-muted-foreground">Alias</p>
                                                        <AllocationAliasInput
                                                            nodeId={nodeId}
                                                            allocationId={allocation.id}
                                                            initialValue={allocation.ip_alias}
                                                            onUpdated={(alias) =>
                                                                handleAliasUpdated(allocation.id, alias)
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {pagination.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-5 py-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {pagination.current_page} of {pagination.last_page}
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
                </div>
            </div>
        </>
    );
};
