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

export default (uuid: string, params?: GetServerPlayersParams): Promise<MinecraftServerStatus> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/players`, { params })
            .then(({ data }) => resolve(data.attributes))
            .catch(reject);
    });
};
