import React, { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { MinusSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import {
    deleteNodeAllocation,
    deleteNodeAllocationBlock,
    deleteNodeAllocations,
    getNodeAllocations,
} from '@/api/admin/nodes';
import AllocationAliasInput from '@/components/admin-preview/nodes/AllocationAliasInput';
import AllocationCreateForm from '@/components/admin-preview/nodes/AllocationCreateForm';
import {
    tableBodyCellClass,
    tableBodyRowClass,
    tableClass,
    tableHeadCellClass,
    tableHeadRowClass,
    tableWrapClass,
} from '@/components/admin-preview/adminTable';
import { fieldClass } from '@/components/admin-preview/settings/fieldClass';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

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
            .then((response) => {
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
            .then((response) => {
                addFlash({
                    key: 'admin-nodes',
                    type: 'success',
                    title: 'Allocations deleted',
                    message: response.message,
                });
                setConfirmMass(false);
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
            .then((response) => {
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
                title="Delete allocations for IP block"
            >
                <p className="text-sm text-muted-foreground">
                    Remove all unassigned allocations for a specific IP address.
                </p>
                <div className="mt-4 space-y-2">
                    <Label htmlFor="block-ip">IP address</Label>
                    <select
                        id="block-ip"
                        className={fieldClass}
                        value={blockIp}
                        onChange={(e) => setBlockIp(e.target.value)}
                    >
                        {ips.map((ip) => (
                            <option key={ip} value={ip}>
                                {ip}
                            </option>
                        ))}
                    </select>
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="rounded-lg border border-border bg-card">
                        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">Existing allocations</h2>
                                <p className="mt-1 text-sm text-muted-foreground">{pagination.total} total</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={selected.size === 0 || deleting}
                                    onClick={() => setConfirmMass(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete selected ({selected.size})
                                </Button>
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
                                        <MinusSquare className="mr-2 h-4 w-4" />
                                        Delete IP block
                                    </Button>
                                )}
                            </div>
                        </div>

                        {allocations.length === 0 ? (
                            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                                No allocations assigned to this node yet.
                            </div>
                        ) : (
                            <div className={tableWrapClass}>
                                <table className={tableClass}>
                                    <thead>
                                        <tr className={tableHeadRowClass}>
                                            <th className={cn(tableHeadCellClass, 'w-10')}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-border accent-primary"
                                                    checked={allSelectableSelected}
                                                    disabled={selectableCount === 0}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className={tableHeadCellClass}>IP address</th>
                                            <th className={tableHeadCellClass}>IP alias</th>
                                            <th className={tableHeadCellClass}>Port</th>
                                            <th className={tableHeadCellClass}>Assigned to</th>
                                            <th className={cn(tableHeadCellClass, 'w-10')} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allocations.map((allocation) => (
                                            <tr key={allocation.id} className={tableBodyRowClass}>
                                                <td className={tableBodyCellClass}>
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-border accent-primary"
                                                        disabled={Boolean(allocation.server_id)}
                                                        checked={selected.has(allocation.id)}
                                                        onChange={(e) =>
                                                            toggleSelect(allocation.id, e.target.checked)
                                                        }
                                                    />
                                                </td>
                                                <td className={tableBodyCellClass}>
                                                    <code className="text-xs text-foreground">{allocation.ip}</code>
                                                </td>
                                                <td className={tableBodyCellClass}>
                                                    <AllocationAliasInput
                                                        nodeId={nodeId}
                                                        allocationId={allocation.id}
                                                        initialValue={allocation.ip_alias}
                                                        onUpdated={(alias) => handleAliasUpdated(allocation.id, alias)}
                                                    />
                                                </td>
                                                <td className={tableBodyCellClass}>
                                                    <code className="text-xs text-foreground">{allocation.port}</code>
                                                </td>
                                                <td className={tableBodyCellClass}>
                                                    {allocation.server ? (
                                                        <a
                                                            href={`${adminPreviewBasePath}/servers/${allocation.server.id}`}
                                                            className="text-sm text-primary no-underline hover:underline"
                                                        >
                                                            {allocation.server.name}
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className={tableBodyCellClass}>
                                                    {!allocation.server_id && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            disabled={deleting}
                                                            onClick={() => setConfirmSingle(allocation.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
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

                <AllocationCreateForm nodeId={nodeId} ips={ips} onCreated={() => mutate()} />
            </div>
        </>
    );
};
