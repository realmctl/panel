import { MinecraftOnlinePlayer } from '@/api/server/players/getServerPlayers';

export const quoteMinecraftPlayer = (name: string): string => (name.includes(' ') ? `"${name}"` : name);

export const resolvePlayerOnlineSeconds = (
    player: MinecraftOnlinePlayer,
    seenSince: Record<string, number>
): number | null => {
    if (player.joinedAt) {
        const joined = new Date(player.joinedAt).getTime();

        if (!Number.isNaN(joined)) {
            return Math.max(0, Math.floor((Date.now() - joined) / 1000));
        }
    }

    const firstSeen = seenSince[player.name];

    if (firstSeen) {
        return Math.max(0, Math.floor((Date.now() - firstSeen) / 1000));
    }

    return null;
};

export const formatPlayerOnlineDuration = (seconds: number | null): string => {
    if (seconds === null) {
        return '—';
    }

    if (seconds < 60) {
        return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};
