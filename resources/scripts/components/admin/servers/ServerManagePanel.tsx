import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { Ban, Play, RefreshCw, ToggleLeft, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import {
    getServer,
    getServerManage,
    reinstallServer,
    suspendServer,
    toggleServerInstall,
    transferServer,
} from '@/api/admin/servers';
import { selectClass } from '@/components/admin/settings/fieldClass';
import { SettingRow, SettingsSection } from '@/components/admin/settings/settingsLayout';

type ConfirmAction = 'reinstall' | 'toggle-install' | 'suspend' | null;

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data: serverData } = useSWR(
        Number.isFinite(serverId) ? `admin-server-${serverId}` : null,
        () => getServer(serverId)
    );
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
        const nodeOptions = data?.node_options;
        if (!nodeOptions?.length) return;

        const firstNode = nodeOptions[0];
        setTransferForm({
            node_id: firstNode.id,
            allocation_id: firstNode.allocations?.[0]?.id ?? 0,
            allocation_additional: [],
        });
    }, [data]);

    const nodeOptionsFromData = data?.node_options ?? [];

    const selectedNode = useMemo(
        () => nodeOptionsFromData.find((node) => node.id === transferForm.node_id) ?? null,
        [nodeOptionsFromData, transferForm.node_id]
    );

    const additionalOptions = useMemo(
        () =>
            (selectedNode?.allocations ?? []).filter(
                (allocation) => allocation.id !== transferForm.allocation_id
            ),
        [selectedNode, transferForm.allocation_id]
    );

    const runAction = (action: () => Promise<{ success: boolean; message: string }>, title: string) => {
        setWorking(true);
        clearFlashes('admin-servers');

        action()
            .then((response: any) => {
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
            .then((response: any) => {
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
    const serverName = serverData?.server.name ?? `Server #${server.id}`;

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
                {transferOpen && (
                <div className="mt-4 divide-y divide-border overflow-hidden rounded-md border border-border">
                    <SettingRow label="Target node" htmlFor="transfer-node" description="Wings node to move the server to.">
                        <select
                            id="transfer-node"
                            className={selectClass}
                            value={transferForm.node_id}
                            onChange={(event) => {
                                const nodeId = Number(event.target.value);
                                const node = nodeOptionsFromData.find((item) => item.id === nodeId);
                                setTransferForm({
                                    node_id: nodeId,
                                    allocation_id: node?.allocations?.[0]?.id ?? 0,
                                    allocation_additional: [],
                                });
                            }}
                        >
                            {nodeOptionsFromData.map((node) => (
                                <option key={node.id} value={node.id}>
                                    {node.text}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow
                        label="Default allocation"
                        htmlFor="transfer-allocation"
                        description="Primary game port on the target node."
                    >
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
                                        (item) => item !== allocationId
                                    ),
                                }));
                            }}
                        >
                            {(selectedNode?.allocations ?? []).map((allocation) => (
                                <option key={allocation.id} value={allocation.id}>
                                    {allocation.text}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow
                        label="Additional allocations"
                        htmlFor="transfer-additional"
                        description="Hold Cmd/Ctrl to select multiple ports on the new node."
                        wide
                    >
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
                    </SettingRow>
                </div>
                )}
                <Dialog.Footer>
                    <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="button" disabled={working || transferForm.allocation_id === 0} onClick={onTransfer}>
                        Confirm transfer
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <div className="space-y-4">
                <div className="overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-foreground">{serverName}</h2>
                        {server.is_installed ? (
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                Installed
                            </span>
                        ) : (
                            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                                Installing
                            </span>
                        )}
                        {server.is_suspended ? (
                            <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-500">
                                Suspended
                            </span>
                        ) : (
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                Active
                            </span>
                        )}
                        {transferInProgress && (
                            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                                Transferring
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Lifecycle and transfer actions for this server.
                    </p>
                    {transferInProgress && (
                        <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
                            Transfer initiated at <strong>{server.transfer?.created_at}</strong>. Lifecycle actions are
                            disabled until the transfer finishes.
                        </p>
                    )}
                </div>

                <SettingsSection
                    title="Lifecycle"
                    description="Reinstall, install status, and access control."
                >
                    <SettingRow
                        label="Reinstall"
                        description="Re-run the egg install script. Files written by the script will be overwritten."
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                            disabled={!server.is_installed || working || transferInProgress}
                            onClick={() => setConfirm('reinstall')}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reinstall server
                        </Button>
                    </SettingRow>
                    <SettingRow
                        label="Install status"
                        description="Flip between installed and installing to unblock a stuck install."
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            disabled={working || transferInProgress}
                            onClick={() => setConfirm('toggle-install')}
                        >
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            {server.is_installed ? 'Mark as installing' : 'Mark as installed'}
                        </Button>
                    </SettingRow>
                    <SettingRow
                        label={server.is_suspended ? 'Unsuspend' : 'Suspend'}
                        description={
                            server.is_suspended
                                ? 'Restore user access and let the daemon start the server again.'
                                : 'Stop processes and revoke all user access to this server.'
                        }
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
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
                    </SettingRow>
                </SettingsSection>

                <SettingsSection
                    title="Transfer"
                    description="Move this server to a different Wings node."
                >
                    <SettingRow
                        label="Transfer to another node"
                        description={
                            transferInProgress
                                ? `In progress since ${server.transfer?.created_at}.`
                                : !data.can_transfer
                                  ? 'No other nodes are available to transfer this server to.'
                                  : 'The server is stopped during the transfer and started on the target node when complete.'
                        }
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            disabled={!data.can_transfer || transferInProgress || working}
                            onClick={() => setTransferOpen(true)}
                        >
                            <Truck className="mr-2 h-4 w-4" />
                            {transferInProgress ? 'Transfer in progress' : 'Transfer server'}
                        </Button>
                    </SettingRow>
                </SettingsSection>
            </div>
        </>
    );
};
