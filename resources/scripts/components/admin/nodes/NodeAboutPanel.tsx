import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useHistory, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';
import { deleteNode, getNode, getNodeSystemInformation } from '@/api/admin/nodes';
import { SettingsSection } from '@/components/admin/settings/settingsLayout';
import { adminBasePath } from '@/routers/adminRoutes';
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

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
        <span className="min-w-0 text-sm text-foreground sm:text-right">{children}</span>
    </div>
);

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
        online: boolean;
    }>({ version: '—', system: '—', cpus: '—', loading: true, online: false });
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
                .then((response: any) => {
                    if (cancelled) return;
                    setSystemInfo({
                        version: response.version,
                        system: `${response.system.type} (${response.system.arch}) ${response.system.release}`,
                        cpus: response.system.cpus,
                        loading: false,
                        online: true,
                    });
                })
                .catch(() => {
                    if (cancelled) return;
                    setSystemInfo({
                        version: 'Unavailable',
                        system: 'Could not connect to daemon',
                        cpus: '—',
                        loading: false,
                        online: false,
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
            .then((response: any) => {
                addFlash({
                    key: 'admin-nodes',
                    type: 'success',
                    title: 'Node deleted',
                    message: response.message,
                });
                history.push(`${adminBasePath}/nodes`);
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

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
                <div className="flex flex-col gap-4 lg:col-span-2">
                    <SettingsSection title="Information" description="Daemon and system details from Wings.">
                        <InfoRow label="Daemon">
                            {systemInfo.loading ? (
                                'Checking…'
                            ) : (
                                <span>
                                    <span
                                        className={cn(
                                            'font-medium',
                                            systemInfo.online
                                                ? 'text-emerald-600 dark:text-emerald-500'
                                                : 'text-red-500'
                                        )}
                                    >
                                        {systemInfo.online ? 'Online' : 'Offline'}
                                    </span>
                                    {systemInfo.online && (
                                        <>
                                            {' · '}
                                            <code>{systemInfo.version}</code>
                                        </>
                                    )}
                                    <span className="text-muted-foreground">
                                        {' '}
                                        (latest <code>{latest_daemon_version}</code>)
                                    </span>
                                </span>
                            )}
                        </InfoRow>
                        <InfoRow label="System">
                            {systemInfo.loading ? (
                                '…'
                            ) : (
                                <>
                                    {systemInfo.system}
                                    {systemInfo.online && (
                                        <span className="text-muted-foreground"> · {systemInfo.cpus} threads</span>
                                    )}
                                </>
                            )}
                        </InfoRow>
                        <InfoRow label="FQDN">
                            <code>{node.fqdn}</code>
                        </InfoRow>
                        <InfoRow label="Location">{node.location.short}</InfoRow>
                        {node.description && (
                            <InfoRow label="Description">
                                <span className="whitespace-pre-wrap">{node.description}</span>
                            </InfoRow>
                        )}
                    </SettingsSection>

                    <div className="overflow-hidden rounded-md border border-destructive/40 bg-card">
                        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                {canDelete
                                    ? 'Permanently remove this node from the panel.'
                                    : 'Remove all servers before deleting this node.'}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={!canDelete || deleting}
                                onClick={() => setConfirmDelete(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete node
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-md border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Capacity</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">Resource usage on this node.</p>
                    </div>
                    <div className="space-y-5 px-5 py-4">
                        {node.maintenance_mode && (
                            <p className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-200">
                                Maintenance mode enabled.
                            </p>
                        )}

                        <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Disk</span>
                                <span className="tabular-nums text-foreground">
                                    {stats.disk.value} / {stats.disk.max} MiB
                                </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn('h-full transition-all', statBarColor(stats.disk.css))}
                                    style={{ width: `${Math.min(100, stats.disk.percent)}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Memory</span>
                                <span className="tabular-nums text-foreground">
                                    {stats.memory.value} / {stats.memory.max} MiB
                                </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn('h-full transition-all', statBarColor(stats.memory.css))}
                                    style={{ width: `${Math.min(100, stats.memory.percent)}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
                            <span className="text-muted-foreground">Servers</span>
                            <span className="font-medium tabular-nums text-foreground">{node.servers_count}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
