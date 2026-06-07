import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { Ban, Play, RefreshCw, ToggleLeft, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import {
    getServerManage,
    reinstallServer,
    suspendServer,
    toggleServerInstall,
    transferServer,
} from '@/api/admin/servers';
import { selectClass } from '@/components/admin-preview/settings/fieldClass';

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating, mutate } = useSWR(
        Number.isFinite(serverId) ? `admin-server-manage-${serverId}` : null,
        () => getServerManage(serverId)
    );
    const [working, setWorking] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferForm, setTransferForm] = useState({
        node_id: 0,
        allocation_id: 0,
        allocation_additional: [] as number[],
    });

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
        }
    }, [error, clearAndAddHttpError, clearFlashes]);

    useEffect(() => {
        if (!data?.node_options.length) return;

        const firstNode = data.node_options[0];
        setTransferForm({
            node_id: firstNode.id,
            allocation_id: firstNode.allocations[0]?.id ?? 0,
            allocation_additional: [],
        });
    }, [data]);

    const selectedNode = useMemo(
        () => data?.node_options.find((node) => node.id === transferForm.node_id) ?? null,
        [data, transferForm.node_id]
    );

    const additionalOptions = useMemo(
        () =>
            selectedNode?.allocations.filter((allocation) => allocation.id !== transferForm.allocation_id) ?? [],
        [selectedNode, transferForm.allocation_id]
    );

    const runAction = (action: () => Promise<{ success: boolean; message: string }>, title: string) => {
        setWorking(true);
        clearFlashes('admin-servers');

        action()
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title,
                    message: response.message,
                });
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-servers', error: submitError });
            })
            .finally(() => setWorking(false));
    };

    const onTransfer = () => {
        setWorking(true);
        clearFlashes('admin-servers');

        transferServer(serverId, {
            node_id: transferForm.node_id,
            allocation_id: transferForm.allocation_id,
            allocation_additional: transferForm.allocation_additional,
        })
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Transfer started',
                    message: response.message,
                });
                setTransferOpen(false);
                mutate();
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-servers', error: submitError });
            })
            .finally(() => setWorking(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load server management options.</p>;
    }

    const { server } = data;
    const transferInProgress = Boolean(server.transfer);

    return (
        <>
            <Dialog appearance="admin" open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer server">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="transfer-node">Node</Label>
                        <select
                            id="transfer-node"
                            className={selectClass}
                            value={transferForm.node_id}
                            onChange={(event) => {
                                const nodeId = Number(event.target.value);
                                const node = data.node_options.find((item) => item.id === nodeId);
                                setTransferForm({
                                    node_id: nodeId,
                                    allocation_id: node?.allocations[0]?.id ?? 0,
                                    allocation_additional: [],
                                });
                            }}
                        >
                            {data.node_options.map((node) => (
                                <option key={node.id} value={node.id}>
                                    {node.text}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="transfer-allocation">Default allocation</Label>
                        <select
                            id="transfer-allocation"
                            className={selectClass}
                            value={transferForm.allocation_id}
                            onChange={(event) => {
                                const allocationId = Number(event.target.value);
                                setTransferForm((current) => ({
                                    ...current,
                                    allocation_id: allocationId,
                                    allocation_additional: current.allocation_additional.filter(
                                        (id) => id !== allocationId
                                    ),
                                }));
                            }}
                        >
                            {selectedNode?.allocations.map((allocation) => (
                                <option key={allocation.id} value={allocation.id}>
                                    {allocation.text}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="transfer-additional">Additional allocations</Label>
                        <select
                            id="transfer-additional"
                            className={selectClass}
                            multiple
                            size={6}
                            value={transferForm.allocation_additional.map(String)}
                            onChange={(event) => {
                                const values = Array.from(event.target.selectedOptions).map((option) =>
                                    Number(option.value)
                                );
                                setTransferForm((current) => ({ ...current, allocation_additional: values }));
                            }}
                        >
                            {additionalOptions.map((allocation) => (
                                <option key={allocation.id} value={allocation.id}>
                                    {allocation.text}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <Dialog.Footer>
                    <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="button" disabled={working} onClick={onTransfer}>
                        Confirm transfer
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Reinstall server</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        <p className="text-sm text-muted-foreground">
                            Reinstall the server with the assigned service scripts. This may overwrite server data.
                        </p>
                        <Button
                            type="button"
                            variant="destructive"
                            className="w-full"
                            disabled={!server.is_installed || working}
                            onClick={() => runAction(() => reinstallServer(serverId), 'Server reinstalled')}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reinstall server
                        </Button>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Install status</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        <p className="text-sm text-muted-foreground">
                            Toggle the install status between installed and installing.
                        </p>
                        <Button
                            type="button"
                            className="w-full"
                            disabled={working}
                            onClick={() => runAction(() => toggleServerInstall(serverId), 'Install status toggled')}
                        >
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            Toggle install status
                        </Button>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">
                            {server.is_suspended ? 'Unsuspend server' : 'Suspend server'}
                        </h2>
                    </div>
                    <div className="space-y-4 p-5">
                        <p className="text-sm text-muted-foreground">
                            {server.is_suspended
                                ? 'Restore normal user access to this server.'
                                : 'Stop processes and block user access to this server.'}
                        </p>
                        <Button
                            type="button"
                            variant={server.is_suspended ? 'default' : 'outline'}
                            className="w-full"
                            disabled={working || (!server.is_suspended && transferInProgress)}
                            onClick={() =>
                                runAction(
                                    () => suspendServer(serverId, server.is_suspended ? 'unsuspend' : 'suspend'),
                                    server.is_suspended ? 'Server unsuspended' : 'Server suspended'
                                )
                            }
                        >
                            {server.is_suspended ? (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Unsuspend server
                                </>
                            ) : (
                                <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Suspend server
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Transfer server</h2>
                    </div>
                    <div className="space-y-4 p-5">
                        {transferInProgress ? (
                            <p className="text-sm text-muted-foreground">
                                Transfer initiated at {server.transfer?.created_at}.
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Transfer this server to another node connected to this panel.
                            </p>
                        )}
                        <Button
                            type="button"
                            className="w-full"
                            disabled={!data.can_transfer || transferInProgress || working}
                            onClick={() => setTransferOpen(true)}
                        >
                            <Truck className="mr-2 h-4 w-4" />
                            Transfer server
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};
