import { Server } from '@/api/server/getServer';
import { ServerStatus as ServerPowerStatus } from '@/state/server';
import { MinecraftServerStatus } from '@/api/server/players/getServerPlayers';
import { capitalize } from '@/lib/strings';
import { ip } from '@/lib/formatters';

export const getServerConnectionAddress = (server: Server): string | null => {
    const allocation = server.allocations.find((entry) => entry.isDefault);

    if (!allocation) {
        return null;
    }

    return `${allocation.alias || ip(allocation.ip)}:${allocation.port}`;
};

export const formatMinecraftVersion = (status: MinecraftServerStatus | null): string | null => {
    if (!status) {
        return null;
    }

    const version = status.protocol?.name || status.version;

    if (!version) {
        return null;
    }

    if (status.software && !version.toLowerCase().includes(status.software.toLowerCase())) {
        return `${status.software} ${version}`;
    }

    return version;
};

export const resolveServerDisplayStatus = (
    powerStatus: ServerPowerStatus,
    server: Server
): { label: string; tone: 'running' | 'starting' | 'stopping' | 'offline' | 'neutral' } => {
    if (server.isTransferring) {
        return { label: 'Transferring', tone: 'neutral' };
    }

    if (server.isNodeUnderMaintenance) {
        return { label: 'Maintenance', tone: 'neutral' };
    }

    switch (server.status) {
        case 'suspended':
            return { label: 'Suspended', tone: 'offline' };
        case 'installing':
            return { label: 'Installing', tone: 'starting' };
        case 'install_failed':
            return { label: 'Install failed', tone: 'offline' };
        case 'reinstall_failed':
            return { label: 'Reinstall failed', tone: 'offline' };
        case 'restoring_backup':
            return { label: 'Restoring backup', tone: 'starting' };
        default:
            break;
    }

    if (!powerStatus) {
        return { label: 'Offline', tone: 'offline' };
    }

    return {
        label: capitalize(powerStatus),
        tone: powerStatus,
    };
};
