import http from '@/api/http';

export interface MinecraftPlayerAvatarUrls {
    provider: string;
    head: string;
    helm: string;
    body: string;
}

export interface MinecraftOnlinePlayer {
    name: string;
    uuid: string | null;
    avatar: MinecraftPlayerAvatarUrls;
    ping: number | null;
    joinedAt: string | null;
}

export interface MinecraftServerMotd {
    raw: string[];
    clean: string[];
    html: string[];
}

export interface MinecraftServerStatus {
    online: boolean;
    address: string;
    hostname: string | null;
    ip: string | null;
    port: number | null;
    version: string | null;
    protocol: { version?: number; name?: string } | null;
    software: string | null;
    motd: MinecraftServerMotd | null;
    icon: string | null;
    players: {
        online: number;
        max: number;
        list: MinecraftOnlinePlayer[];
    };
    plugins: { name: string; version: string }[] | null;
    mods: { name: string; version: string }[] | null;
    debug: {
        ping: boolean;
        query: boolean;
        cache_hit: boolean;
        cache_expires_at: string | null;
    };
    queried_at: string;
}

export interface GetServerPlayersParams {
    allocation?: number;
}

const mapPlayer = (player: Record<string, unknown>): MinecraftOnlinePlayer => ({
    name: String(player.name ?? ''),
    uuid: typeof player.uuid === 'string' ? player.uuid : null,
    avatar: player.avatar as MinecraftPlayerAvatarUrls,
    ping: typeof player.ping === 'number' ? player.ping : null,
    joinedAt: typeof player.joined_at === 'string' ? player.joined_at : null,
});

const mapStatus = (attributes: Record<string, unknown>): MinecraftServerStatus => {
    const players = attributes.players as Record<string, unknown> | undefined;

    return {
        ...(attributes as unknown as MinecraftServerStatus),
        players: {
            online: Number(players?.online ?? 0),
            max: Number(players?.max ?? 0),
            list: Array.isArray(players?.list) ? players.list.map((entry) => mapPlayer(entry as Record<string, unknown>)) : [],
        },
    };
};

export default (uuid: string, params?: GetServerPlayersParams): Promise<MinecraftServerStatus> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/players`, { params })
            .then(({ data }) => resolve(mapStatus(data.attributes)))
            .catch(reject);
    });
};
