import { MinecraftOnlinePlayer, MinecraftServerStatus } from '@/api/server/players/getServerPlayers';

const avatar = (name: string): MinecraftOnlinePlayer['avatar'] => ({
    provider: 'crafthead',
    head: `https://crafthead.net/avatar/${encodeURIComponent(name)}/64`,
    helm: `https://crafthead.net/helm/${encodeURIComponent(name)}/64`,
    body: `https://crafthead.net/body/${encodeURIComponent(name)}/128`,
});

const mockPlayer = (name: string, uuid: string): MinecraftOnlinePlayer => ({
    name,
    uuid,
    avatar: avatar(name),
});

// TODO: Set to false when done previewing the player bar UI.
export const USE_MOCK_PLAYER_DATA = true;

const MOCK_PLAYERS: MinecraftServerStatus['players'] = {
    online: 12,
    max: 20,
    list: [
        mockPlayer('Notch', '069a79f4-44e9-4726-a5be-fca90e38aaf5'),
        mockPlayer('jeb_', '853c80ef-3c37-49fd-aa49-938b5ada1134'),
        mockPlayer('Dream', 'cdb3fdf8-81c8-4bcf-9a7e-8f3e8c8f3e8c'),
        mockPlayer('Technoblade', 'b8764762-b6a1-451d-9dbd-65b69262a90a'),
        mockPlayer('CaptainSparklez', '825ec97c-ecff-402e-b1e0-fb7fc96d9390'),
        mockPlayer('Grian', '2b868637-b7cf-4e8f-9e8f-9e8f9e8f9e8f'),
        mockPlayer('Ph1LzA', '6817b240-8569-11e9-8df9-0800200c9a66'),
        mockPlayer('WilburSoot', '4129a138-5df9-4cd4-8d47-9c5c840f9a4a'),
        mockPlayer('TommyInnit', 'c3a4b5d6-e7f8-9012-3456-7890abcdef12'),
        mockPlayer('Tubbo', 'd4b5c6d7-e8f9-0123-4567-890abcdef123'),
        mockPlayer('Ranboo', 'e5c6d7e8-f9a0-1234-5678-90abcdef1234'),
        mockPlayer('Sapnap', 'f6d7e8f9-a0b1-2345-6789-0abcdef12345'),
    ],
};

export const MOCK_SERVER_PLAYERS = MOCK_PLAYERS;

export const MOCK_SERVER_STATUS: MinecraftServerStatus = {
    online: true,
    address: 'play.example.com:25565',
    hostname: null,
    ip: '127.0.0.1',
    port: 25565,
    version: '1.21.4',
    protocol: { version: 767, name: '1.21.4' },
    software: 'Paper',
    motd: null,
    icon: null,
    players: MOCK_PLAYERS,
    plugins: null,
    mods: null,
    debug: { ping: true, query: true, cache_hit: false, cache_expires_at: null },
    queried_at: new Date().toISOString(),
};
