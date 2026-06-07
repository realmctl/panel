import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    Loader2,
    Pause,
    Play,
    RefreshCw,
    ToggleLeft,
    Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';

type ConfirmAction = 'reinstall' | 'toggle-install' | 'suspend' | null;

interface StatusBadgeProps {
    label: string;
    tone: 'success' | 'warning' | 'danger' | 'info' | 'muted';
    icon: React.ReactNode;
}

const toneClass: Record<StatusBadgeProps['tone'], string> = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    danger: 'border-red-500/30 bg-red-500/10 text-red-300',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    muted: 'border-border bg-muted/40 text-muted-foreground',
};

const StatusBadge = ({ label, tone, icon }: StatusBadgeProps) => (
    <span
        className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
            toneClass[tone]
        )}
    >
        {icon}
        {label}
    </span>
);

interface ActionCardProps {
    title: string;
    description: string;
    destructive?: boolean;
    accent?: 'destructive' | 'warning' | 'info' | 'success';
    children: React.ReactNode;
}

const accentBar: Record<NonNullable<ActionCardProps['accent']>, string> = {
    destructive: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
};

const ActionCard = ({ title, description, accent, children }: ActionCardProps) => (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
        {accent && <span className={cn('absolute inset-y-0 left-0 w-1', accentBar[accent])} />}
        <div className="border-b border-border px-5 py-4 pl-6">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="mt-auto p-5 pl-6">{children}</div>
    </div>
);

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
    const [confirm, setConfirm] = useState<ConfirmAction>(null);
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
            .finally(() => {
                setWorking(false);
                setConfirm(null);
            });
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
            <Dialog.Confirm
                appearance="admin"
                open={confirm === 'reinstall'}
                onClose={() => setConfirm(null)}
                title="Reinstall server?"
                confirm="Reinstall"
                onConfirmed={() => runAction(() => reinstallServer(serverId), 'Server reinstalled')}
            >
                This will re-run the install script for the assigned egg. Any files written by the script will be
                overwritten and the server will be unreachable until installation finishes.
            </Dialog.Confirm>

            <Dialog.Confirm
                appearance="admin"
                open={confirm === 'toggle-install'}
                onClose={() => setConfirm(null)}
                title="Toggle install status?"
                confirm="Toggle"
                onConfirmed={() => runAction(() => toggleServerInstall(serverId), 'Install status toggled')}
            >
                This flips the server between <em>installed</em> and <em>installing</em>. Use it to unblock a stuck
                install, or to re-mark a server as needing install. It does not run any scripts on Wings.
            </Dialog.Confirm>

            <Dialog.Confirm
                appearance="admin"
                open={confirm === 'suspend'}
                onClose={() => setConfirm(null)}
                title={server.is_suspended ? 'Unsuspend server?' : 'Suspend server?'}
                confirm={server.is_suspended ? 'Unsuspend' : 'Suspend'}
                onConfirmed={() =>
                    runAction(
                        () => suspendServer(serverId, server.is_suspended ? 'unsuspend' : 'suspend'),
                        server.is_suspended ? 'Server unsuspended' : 'Server suspended'
                    )
                }
            >
                {server.is_suspended
                    ? 'The user will regain access and any cron-based tasks will resume.'
                    : 'Running processes will be stopped, the user will lose all panel access, and the daemon will refuse to start the server until you unsuspend.'}
            </Dialog.Confirm>

            <Dialog
                appearance="admin"
                panelClassName="max-w-2xl"
                open={transferOpen}
                onClose={() => setTransferOpen(false)}
                title="Transfer server"
            >
                <p className="text-sm text-muted-foreground">
                    Move this server's files and configuration to another node. The server is stopped during transfer
                    and started again on the target node when the copy completes.
                </p>
                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="transfer-node">Target node</Label>
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
                        <p className="text-xs text-muted-foreground">
                            Hold ⌘ / Ctrl to pick multiple. These are assigned alongside the default allocation on
                            the new node.
                        </p>
                    </div>
                </div>
                <Dialog.Footer>
                    <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="button" disabled={working || transferForm.allocation_id === 0} onClick={onTransfer}>
                        Confirm transfer
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <div className="space-y-6">
                <div className="rounded-lg border border-border bg-card px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Server status</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Snapshot of the server's lifecycle, access, and any pending operations.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {server.is_installed ? (
                                <StatusBadge
                                    label="Installed"
                                    tone="success"
                                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                />
                            ) : (
                                <StatusBadge
                                    label="Installing"
                                    tone="info"
                                    icon={<Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                />
                            )}
                            {server.is_suspended ? (
                                <StatusBadge
                                    label="Suspended"
                                    tone="danger"
                                    icon={<Pause className="h-3.5 w-3.5" />}
                                />
                            ) : (
                                <StatusBadge
                                    label="Active"
                                    tone="success"
                                    icon={<Play className="h-3.5 w-3.5" />}
                                />
                            )}
                            {transferInProgress && (
                                <StatusBadge
                                    label="Transferring"
                                    tone="warning"
                                    icon={<Truck className="h-3.5 w-3.5" />}
                                />
                            )}
                        </div>
                    </div>
                    {transferInProgress && (
                        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                Transfer initiated at <strong>{server.transfer?.created_at}</strong>. Lifecycle actions
                                are disabled until the transfer finishes.
                            </span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ActionCard
                        title="Reinstall"
                        description="Re-run the egg install script on Wings. Any files the script writes will be overwritten."
                        accent="destructive"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                            disabled={!server.is_installed || working || transferInProgress}
                            onClick={() => setConfirm('reinstall')}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reinstall server
                        </Button>
                    </ActionCard>

                    <ActionCard
                        title="Install status"
                        description="Flip the install flag between installed and installing. Use this to unblock a stuck install."
                        accent="info"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={working || transferInProgress}
                            onClick={() => setConfirm('toggle-install')}
                        >
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            {server.is_installed ? 'Mark as installing' : 'Mark as installed'}
                        </Button>
                    </ActionCard>

                    <ActionCard
                        title={server.is_suspended ? 'Unsuspend access' : 'Suspend access'}
                        description={
                            server.is_suspended
                                ? 'Restore user access and let the daemon start the server again.'
                                : 'Stop processes and revoke all user access to this server.'
                        }
                        accent={server.is_suspended ? 'success' : 'warning'}
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className={cn(
                                'w-full',
                                server.is_suspended
                                    ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200'
                                    : 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200'
                            )}
                            disabled={working || (!server.is_suspended && transferInProgress)}
                            onClick={() => setConfirm('suspend')}
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
                    </ActionCard>

                    <ActionCard
                        title="Transfer to another node"
                        description={
                            transferInProgress
                                ? `In progress since ${server.transfer?.created_at}.`
                                : !data.can_transfer
                                  ? 'No other nodes are available to transfer this server to.'
                                  : 'Move this server to a different Wings node. The server is stopped during the transfer.'
                        }
                        accent="info"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-blue-500/40 text-blue-300 hover:bg-blue-500/10 hover:text-blue-200"
                            disabled={!data.can_transfer || transferInProgress || working}
                            onClick={() => setTransferOpen(true)}
                        >
                            <Truck className="mr-2 h-4 w-4" />
                            {transferInProgress ? 'Transfer in progress' : 'Transfer server'}
                        </Button>
                    </ActionCard>
                </div>
            </div>
        </>
    );
};
