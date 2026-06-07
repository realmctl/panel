import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { AlertTriangle, Copy, Info, Network, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { duplicateServer, getServer } from '@/api/admin/servers';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

const formatCpu = (cpu: number) => (cpu === 0 ? 'Unlimited' : `${cpu}%`);

const formatMemory = (memory: number) => (memory === 0 ? 'Unlimited' : `${memory} MiB`);

const formatSwap = (swap: number) => {
    if (swap === 0) {
        return 'Not set';
    }

    if (swap === -1) {
        return 'Unlimited';
    }

    return `${swap} MiB`;
};

const formatDisk = (disk: number) => (disk === 0 ? 'Unlimited' : `${disk} MiB`);

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between px-5 py-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm text-foreground">{children}</span>
    </div>
);

export default () => {
    const { id } = useParams<{ id: string }>();
    const serverId = Number(id);
    const history = useHistory();
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { data, error, isValidating } = useSWR(
        Number.isFinite(serverId) ? `admin-server-${serverId}` : null,
        () => getServer(serverId)
    );
    const [duplicating, setDuplicating] = useState(false);

    useEffect(() => {
        if (error) {
            clearAndAddHttpError({ key: 'admin-servers', error });
        } else {
            clearFlashes('admin-servers');
        }
    }, [error, clearAndAddHttpError, clearFlashes]);

    const onDuplicate = () => {
        setDuplicating(true);
        clearFlashes('admin-servers');

        duplicateServer(serverId)
            .then((response) => {
                addFlash({
                    key: 'admin-servers',
                    type: 'success',
                    title: 'Server duplicated',
                    message: response.message,
                });
                history.push(`${adminPreviewBasePath}/servers/${response.server.id}`);
            })
            .catch((submitError) => {
                clearAndAddHttpError({ key: 'admin-servers', error: submitError });
            })
            .finally(() => setDuplicating(false));
    };

    if (!data && isValidating) {
        return <Spinner centered />;
    }

    if (!data) {
        return <p className="text-sm text-muted-foreground">Unable to load server.</p>;
    }

    const { server } = data;

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <div className="rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Information</h2>
                    </div>
                    <div className="divide-y divide-border">
                        <InfoRow label="Internal identifier">
                            <code className="text-xs">{server.id}</code>
                        </InfoRow>
                        <InfoRow label="External identifier">
                            {server.external_id ? (
                                <code className="text-xs">{server.external_id}</code>
                            ) : (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    Not set
                                </span>
                            )}
                        </InfoRow>
                        <InfoRow label="UUID / Docker container ID">
                            <code className="max-w-xs truncate text-xs" title={server.uuid}>
                                {server.uuid}
                            </code>
                        </InfoRow>
                        <InfoRow label="Current egg">
                            {server.nest && server.egg ? (
                                <span>
                                    <a
                                        href={`${adminPreviewBasePath}/nests/${server.nest.id}`}
                                        className="text-primary no-underline hover:underline"
                                    >
                                        {server.nest.name}
                                    </a>
                                    {' :: '}
                                    <a
                                        href={`${adminPreviewBasePath}/nests/eggs/${server.egg.id}`}
                                        className="text-primary no-underline hover:underline"
                                    >
                                        {server.egg.name}
                                    </a>
                                </span>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </InfoRow>
                        <InfoRow label="Server name">{server.name}</InfoRow>
                        <InfoRow label="CPU limit">
                            <code className="text-xs">{formatCpu(server.cpu)}</code>
                        </InfoRow>
                        <InfoRow label="CPU pinning">
                            {server.threads ? (
                                <code className="text-xs">{server.threads}</code>
                            ) : (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    Not set
                                </span>
                            )}
                        </InfoRow>
                        <InfoRow label="Memory">
                            <code className="text-xs">
                                {formatMemory(server.memory)} / {formatSwap(server.swap)}
                            </code>
                        </InfoRow>
                        <InfoRow label="Disk space">
                            <code className="text-xs">{formatDisk(server.disk)}</code>
                        </InfoRow>
                        <InfoRow label="Block IO weight">
                            <code className="text-xs">{server.io}</code>
                        </InfoRow>
                        <InfoRow label="Default connection">
                            {server.allocation ? (
                                <code className="text-xs">
                                    {server.allocation.ip}:{server.allocation.port}
                                </code>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </InfoRow>
                        <InfoRow label="Connection alias">
                            {server.allocation?.has_alias ? (
                                <code className="text-xs">
                                    {server.allocation.alias}:{server.allocation.port}
                                </code>
                            ) : (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    No alias assigned
                                </span>
                            )}
                        </InfoRow>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {server.is_suspended && (
                    <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Suspended</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">This server is currently suspended.</p>
                        </div>
                    </div>
                )}

                {!server.is_installed && (
                    <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Installing</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                This server is still being installed.
                            </p>
                        </div>
                    </div>
                )}

                {server.owner && (
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-4 px-5 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{server.owner.username}</p>
                                <p className="text-sm text-muted-foreground">Server owner</p>
                            </div>
                        </div>
                        <Link
                            to={`${adminPreviewBasePath}/users/${server.owner.id}`}
                            className="block border-t border-border px-5 py-3 text-sm text-primary no-underline hover:bg-muted/50"
                        >
                            More info →
                        </Link>
                    </div>
                )}

                {server.node && (
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-4 px-5 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                <Network className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{server.node.name}</p>
                                <p className="text-sm text-muted-foreground">Server node</p>
                            </div>
                        </div>
                        <a
                            href={`${adminPreviewBasePath}/nodes/${server.node.id}`}
                            className="block border-t border-border px-5 py-3 text-sm text-primary no-underline hover:bg-muted/50"
                        >
                            More info →
                        </a>
                    </div>
                )}

                <Button type="button" variant="outline" className="w-full" disabled={duplicating} onClick={onDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    {duplicating ? 'Duplicating...' : 'Duplicate server'}
                </Button>
            </div>
        </div>
    );
};
