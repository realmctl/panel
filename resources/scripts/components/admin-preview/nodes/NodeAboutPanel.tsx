import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useHistory, useParams } from 'react-router-dom';
import { AlertTriangle, HardDrive, MemoryStick, Server, Trash2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteNode, getNode, getNodeSystemInformation } from '@/api/admin/nodes';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';
import { cn } from '@/lib/utils';

const statBarColor = (css: 'green' | 'yellow' | 'red') => {
    switch (css) {
        case 'green':
            return 'bg-green-500';
        case 'yellow':
            return 'bg-yellow-500';
        default:
            return 'bg-red-500';
    }
};

export default () => {
    const { id } = useParams<{ id: string }>();
    const nodeId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR(
        Number.isFinite(nodeId) ? `admin-node-${nodeId}` : null,
        () => getNode(nodeId)
    );
    const [systemInfo, setSystemInfo] = useState<{
        version: string;
        system: string;
        cpus: number | string;
        loading: boolean;
    }>({ version: '—', system: '—', cpus: '—', loading: true });
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-nodes', error });
        } else {
            clearFlashes('admin-nodes');
        }
    }, [error]);

    useEffect(() => {
        if (!Number.isFinite(nodeId)) return;

        let cancelled = false;

        const poll = () => {
            setSystemInfo((current) => ({ ...current, loading: true }));

            getNodeSystemInformation(nodeId)
                .then((response) => {
                    if (cancelled) return;
                    setSystemInfo({
                        version: response.version,
                        system: `${response.system.type} (${response.system.arch}) ${response.system.release}`,
                        cpus: response.system.cpus,
                        loading: false,
                    });
                })
                .catch(() => {
                    if (cancelled) return;
                    setSystemInfo({
                        version: 'Unavailable',
                        system: 'Could not connect to daemon',
                        cpus: '—',
                        loading: false,
                    });
                });
        };

        poll();
        const interval = window.setInterval(poll, 10000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [nodeId]);

    const onDelete = () => {
        setDeleting(true);
        clearFlashes('admin-nodes');

        deleteNode(nodeId)
            .then((response) => {
                addFlash({
                    key: 'admin-nodes',
                    type: 'success',
                    title: 'Node deleted',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/nodes`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-nodes', error: submitError });
                setConfirmDelete(false);
            })
            .finally(() => setDeleting(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load node.</p>;
    }

    const { node, stats, latest_daemon_version } = data;
    const canDelete = node.servers_count < 1;

    return (
        <>
            <Dialog.Confirm
                appearance="admin"
                title="Delete node"
                confirm="Delete"
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={onDelete}
            >
                Deleting a node is irreversible and will immediately remove it from the panel. This node must have no
                servers associated with it.
            </Dialog.Confirm>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Information</h2>
                        </div>
                        <div className="divide-y divide-border">
                            <div className="flex items-center justify-between px-5 py-4">
                                <span className="text-sm text-muted-foreground">Daemon version</span>
                                <span className="text-sm text-foreground">
                                    <code>{systemInfo.loading ? '…' : systemInfo.version}</code>
                                    <span className="ml-2 text-muted-foreground">
                                        (Latest: <code>{latest_daemon_version}</code>)
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-5 py-4">
                                <span className="text-sm text-muted-foreground">System information</span>
                                <span className="text-sm text-foreground">
                                    {systemInfo.loading ? '…' : systemInfo.system}
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-5 py-4">
                                <span className="text-sm text-muted-foreground">Total CPU threads</span>
                                <span className="text-sm text-foreground">
                                    {systemInfo.loading ? '…' : systemInfo.cpus}
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-5 py-4">
                                <span className="text-sm text-muted-foreground">FQDN</span>
                                <code className="text-sm">{node.fqdn}</code>
                            </div>
                            <div className="flex items-center justify-between px-5 py-4">
                                <span className="text-sm text-muted-foreground">Location</span>
                                <span className="text-sm text-foreground">{node.location.short}</span>
                            </div>
                        </div>
                    </div>

                    {node.description && (
                        <div className="rounded-lg border border-border bg-card">
                            <div className="border-b border-border px-5 py-4">
                                <h2 className="text-base font-semibold text-foreground">Description</h2>
                            </div>
                            <pre className="whitespace-pre-wrap p-5 text-sm text-foreground">{node.description}</pre>
                        </div>
                    )}

                    <div className="rounded-lg border border-destructive/40 bg-card">
                        <div className="border-b border-destructive/30 px-5 py-4">
                            <h2 className="text-base font-semibold text-destructive">Delete node</h2>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-muted-foreground">
                                Deleting a node is irreversible and will immediately remove this node from the panel.
                                There must be no servers associated with this node in order to continue.
                            </p>
                        </div>
                        <div className="flex justify-end border-t border-destructive/30 px-5 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={!canDelete || deleting}
                                onClick={() => setConfirmDelete(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete node
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">At-a-glance</h2>
                    </div>
                    <div className="space-y-5 p-5">
                        {node.maintenance_mode && (
                            <div className="flex gap-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
                                <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                                <div>
                                    <p className="text-muted-foreground">This node is under</p>
                                    <p className="font-semibold text-foreground">Maintenance</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="mb-2 flex items-center gap-2 text-sm text-foreground">
                                <HardDrive className="h-4 w-4 text-muted-foreground" />
                                Disk space allocated
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn('h-full transition-all', statBarColor(stats.disk.css))}
                                    style={{ width: `${Math.min(100, stats.disk.percent)}%` }}
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats.disk.value} / {stats.disk.max} MiB
                            </p>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center gap-2 text-sm text-foreground">
                                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                                Memory allocated
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn('h-full transition-all', statBarColor(stats.memory.css))}
                                    style={{ width: `${Math.min(100, stats.memory.percent)}%` }}
                                />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats.memory.value} / {stats.memory.max} MiB
                            </p>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-foreground">
                                <Server className="h-4 w-4 text-muted-foreground" />
                                Total servers
                            </span>
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                                {node.servers_count}
                            </span>
                        </div>

                        {!canDelete && (
                            <div className="flex gap-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-foreground">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
                                <span>Remove all servers from this node before deleting it.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
