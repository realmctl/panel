import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { duplicateServer, getServer } from '@/api/admin/servers';
import { SettingsSection } from '@/components/admin-preview/settings/settingsLayout';
import { adminPreviewBasePath } from '@/routers/adminPreviewRoutes';

const formatCpu = (cpu: number) => (cpu === 0 ? 'Unlimited' : `${cpu}%`);
const formatMemory = (memory: number) => (memory === 0 ? 'Unlimited' : `${memory} MiB`);
const formatSwap = (swap: number) => {
    if (swap === 0) return 'Not set';
    if (swap === -1) return 'Unlimited';
    return `${swap} MiB`;
};
const formatDisk = (disk: number) => (disk === 0 ? 'Unlimited' : `${disk} MiB`);

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
        <span className="min-w-0 text-sm text-foreground sm:text-right">{children}</span>
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
            <div className="space-y-4 lg:col-span-2">
                <SettingsSection title="General" description="Identifiers and egg configuration.">
                    <InfoRow label="Name">{server.name}</InfoRow>
                    <InfoRow label="Internal ID">
                        <code>#{server.id}</code>
                    </InfoRow>
                    <InfoRow label="UUID">
                        <code className="break-all">{server.uuid}</code>
                    </InfoRow>
                    <InfoRow label="External ID">
                        {server.external_id ? <code>{server.external_id}</code> : 'Not set'}
                    </InfoRow>
                    <InfoRow label="Egg">
                        {server.nest && server.egg ? (
                            <>
                                <Link
                                    to={`${adminPreviewBasePath}/nests/${server.nest.id}`}
                                    className="text-blue-400 no-underline hover:text-blue-300"
                                >
                                    {server.nest.name}
                                </Link>
                                {' · '}
                                <Link
                                    to={`${adminPreviewBasePath}/nests/eggs/${server.egg.id}`}
                                    className="text-blue-400 no-underline hover:text-blue-300"
                                >
                                    {server.egg.name}
                                </Link>
                            </>
                        ) : (
                            '—'
                        )}
                    </InfoRow>
                </SettingsSection>

                <SettingsSection title="Resources" description="CPU, memory, and disk limits.">
                    <InfoRow label="CPU">
                        <code>{formatCpu(server.cpu)}</code>
                    </InfoRow>
                    <InfoRow label="CPU pinning">
                        {server.threads ? <code>{server.threads}</code> : 'Not set'}
                    </InfoRow>
                    <InfoRow label="Memory">
                        <code>
                            {formatMemory(server.memory)} / {formatSwap(server.swap)} swap
                        </code>
                    </InfoRow>
                    <InfoRow label="Disk">
                        <code>{formatDisk(server.disk)}</code>
                    </InfoRow>
                    <InfoRow label="Block IO">
                        <code>{server.io}</code>
                    </InfoRow>
                </SettingsSection>

                <SettingsSection title="Network" description="Default connection details.">
                    <InfoRow label="Connection">
                        {server.allocation ? (
                            <code>
                                {server.allocation.ip}:{server.allocation.port}
                            </code>
                        ) : (
                            '—'
                        )}
                    </InfoRow>
                    <InfoRow label="Alias">
                        {server.allocation?.has_alias ? (
                            <code>
                                {server.allocation.alias}:{server.allocation.port}
                            </code>
                        ) : (
                            'No alias assigned'
                        )}
                    </InfoRow>
                </SettingsSection>
            </div>

            <div className="space-y-4">
                <div className="overflow-hidden rounded-md border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">Status</h2>
                    </div>
                    <div className="divide-y divide-border px-5 py-4 text-sm">
                        {server.is_suspended && (
                            <p className="pb-3 text-yellow-700 dark:text-yellow-200">This server is suspended.</p>
                        )}
                        {!server.is_installed && (
                            <p className="pb-3 text-blue-600 dark:text-blue-400">This server is still installing.</p>
                        )}
                        {server.is_installed && !server.is_suspended && (
                            <p className="text-emerald-600 dark:text-emerald-500">Active and installed.</p>
                        )}
                    </div>
                </div>

                {(server.owner || server.node) && (
                    <div className="overflow-hidden rounded-md border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-foreground">Related</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {server.owner && (
                                <Link
                                    to={`${adminPreviewBasePath}/users/${server.owner.id}`}
                                    className="block px-5 py-4 no-underline transition-colors hover:bg-muted/50"
                                >
                                    <p className="text-sm font-medium text-foreground">{server.owner.username}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">Owner</p>
                                </Link>
                            )}
                            {server.node && (
                                <Link
                                    to={`${adminPreviewBasePath}/nodes/${server.node.id}`}
                                    className="block px-5 py-4 no-underline transition-colors hover:bg-muted/50"
                                >
                                    <p className="text-sm font-medium text-foreground">{server.node.name}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">Node</p>
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                <div className="overflow-hidden rounded-md border border-border bg-card px-5 py-4">
                    <p className="text-sm text-muted-foreground">
                        Create a copy of this server with the same configuration.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="mt-3 w-full"
                        disabled={duplicating}
                        onClick={onDuplicate}
                    >
                        {duplicating ? 'Duplicating...' : 'Duplicate server'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
