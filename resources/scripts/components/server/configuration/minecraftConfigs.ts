export type ConfigFieldType = 'string' | 'number' | 'boolean' | 'select';

export interface ConfigFieldOption {
    value: string;
    label: string;
}

export interface ConfigFieldDefinition {
    key: string;
    label: string;
    description?: string;
    type: ConfigFieldType;
    options?: ConfigFieldOption[];
    min?: number;
    max?: number;
}

export interface ConfigGroupDefinition {
    id: string;
    label: string;
    description?: string;
    fields: ConfigFieldDefinition[];
}

export type MinecraftConfigFormat = 'properties' | 'eula' | 'raw';

export type MinecraftConfigLanguage = 'yaml' | 'properties' | 'plaintext' | 'json' | 'toml';

export interface ConfigCategoryDefinition {
    id: string;
    label: string;
    description: string;
}

export interface MinecraftConfigDefinition {
    id: string;
    category: string;
    label: string;
    description: string;
    path: string;
    alternatePaths?: string[];
    /** Match opened file paths that are not fixed (e.g. per-world paper-world.yml). */
    pathPatterns?: RegExp[];
    format: MinecraftConfigFormat;
    language?: MinecraftConfigLanguage;
    groups?: ConfigGroupDefinition[];
    unavailableHint?: string;
}

export const CONFIG_CATEGORIES: ConfigCategoryDefinition[] = [
    {
        id: 'core',
        label: 'Core',
        description: 'Essential settings every Minecraft server uses.',
    },
    {
        id: 'bukkit',
        label: 'Bukkit / Spigot',
        description: 'Configuration for plugin-enabled server software.',
    },
    {
        id: 'paper',
        label: 'Paper',
        description: 'Paper-specific performance and world settings.',
    },
    {
        id: 'forks',
        label: 'Forks',
        description: 'Purpur, Pufferfish, and other Paper-based server forks.',
    },
    {
        id: 'proxy',
        label: 'Proxy',
        description: 'BungeeCord and Velocity proxy configuration.',
    },
];

const SERVER_PROPERTIES_GROUPS: ConfigGroupDefinition[] = [
    {
        id: 'general',
        label: 'General',
        description: 'Server identity, player limits, and access control.',
        fields: [
            { key: 'motd', label: 'MOTD', description: 'Message shown in the server list.', type: 'string' },
            { key: 'max-players', label: 'Max players', description: 'Maximum number of players allowed online at once.', type: 'number', min: 1, max: 1000 },
            { key: 'online-mode', label: 'Online mode', description: 'Require Mojang authentication for joining players.', type: 'boolean' },
            { key: 'enable-status', label: 'Server list status', description: 'Show this server in the multiplayer server list.', type: 'boolean' },
            { key: 'server-port', label: 'Server port', description: 'TCP port the Minecraft server listens on.', type: 'number', min: 1, max: 65535 },
            { key: 'server-ip', label: 'Server IP', description: 'Leave empty to bind all network interfaces.', type: 'string' },
            { key: 'white-list', label: 'Whitelist enabled', description: 'Only players on the whitelist can join when enabled.', type: 'boolean' },
            { key: 'enforce-whitelist', label: 'Enforce whitelist', description: 'Kick players not on the whitelist, even ops.', type: 'boolean' },
        ],
    },
    {
        id: 'world',
        label: 'World',
        description: 'World generation, dimensions, and spawn protection.',
        fields: [
            { key: 'level-name', label: 'World name', description: 'Folder name of the primary world save.', type: 'string' },
            { key: 'level-seed', label: 'World seed', description: 'Leave empty for a random seed.', type: 'string' },
            {
                key: 'level-type',
                label: 'World type',
                description: 'World generation preset used when creating a new world.',
                type: 'select',
                options: [
                    { value: 'minecraft:normal', label: 'Normal' },
                    { value: 'minecraft:flat', label: 'Flat' },
                    { value: 'minecraft:large_biomes', label: 'Large biomes' },
                    { value: 'minecraft:amplified', label: 'Amplified' },
                ],
            },
            { key: 'generate-structures', label: 'Generate structures', description: 'Generate villages, strongholds, and other structures.', type: 'boolean' },
            { key: 'allow-nether', label: 'Allow Nether', description: 'Allow players to travel to the Nether dimension.', type: 'boolean' },
            { key: 'max-world-size', label: 'Max world size', description: 'Maximum radius of the world border in blocks.', type: 'number', min: 1, max: 29999984 },
            { key: 'spawn-protection', label: 'Spawn protection radius', description: 'Blocks non-ops from placing or breaking blocks near spawn.', type: 'number', min: 0, max: 1000 },
        ],
    },
    {
        id: 'gameplay',
        label: 'Gameplay',
        description: 'Gamemode, difficulty, and entity spawning rules.',
        fields: [
            {
                key: 'gamemode',
                label: 'Default gamemode',
                description: 'Gamemode assigned to new players joining the server.',
                type: 'select',
                options: [
                    { value: 'survival', label: 'Survival' },
                    { value: 'creative', label: 'Creative' },
                    { value: 'adventure', label: 'Adventure' },
                    { value: 'spectator', label: 'Spectator' },
                ],
            },
            { key: 'force-gamemode', label: 'Force gamemode', description: 'Always set players to the default gamemode on join.', type: 'boolean' },
            {
                key: 'difficulty',
                label: 'Difficulty',
                description: 'Base world difficulty affecting mob damage and hunger.',
                type: 'select',
                options: [
                    { value: 'peaceful', label: 'Peaceful' },
                    { value: 'easy', label: 'Easy' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'hard', label: 'Hard' },
                ],
            },
            { key: 'hardcore', label: 'Hardcore mode', description: 'Players are banned on death when enabled.', type: 'boolean' },
            { key: 'pvp', label: 'PvP enabled', description: 'Allow players to damage other players.', type: 'boolean' },
            { key: 'allow-flight', label: 'Allow flight', description: 'Allow survival players to fly without being kicked.', type: 'boolean' },
            { key: 'spawn-monsters', label: 'Spawn monsters', description: 'Allow hostile mobs to spawn in the world.', type: 'boolean' },
            { key: 'spawn-animals', label: 'Spawn animals', description: 'Allow passive mobs to spawn in the world.', type: 'boolean' },
            { key: 'spawn-npcs', label: 'Spawn NPCs', description: 'Allow villagers and other NPCs to spawn.', type: 'boolean' },
            { key: 'enable-command-block', label: 'Enable command blocks', description: 'Allow command blocks to execute server commands.', type: 'boolean' },
            { key: 'op-permission-level', label: 'OP permission level', description: 'Permission level granted to server operators (1–4).', type: 'number', min: 1, max: 4 },
            { key: 'function-permission-level', label: 'Function permission level', description: 'Permission level required to run datapack functions.', type: 'number', min: 1, max: 4 },
        ],
    },
    {
        id: 'performance',
        label: 'Performance',
        description: 'View distance, tick limits, and network settings.',
        fields: [
            { key: 'view-distance', label: 'View distance', description: 'How many chunks are sent to players. Higher values use more RAM.', type: 'number', min: 3, max: 32 },
            { key: 'simulation-distance', label: 'Simulation distance', description: 'How far from players the server ticks entities and redstone.', type: 'number', min: 3, max: 32 },
            { key: 'network-compression-threshold', label: 'Network compression threshold', description: 'Packet size above which data is compressed. Set to -1 to disable.', type: 'number', min: -1, max: 65535 },
            { key: 'max-tick-time', label: 'Max tick time (ms)', description: 'Milliseconds a single tick may take before watchdog actions trigger.', type: 'number', min: -1, max: 600000 },
            { key: 'sync-chunk-writes', label: 'Sync chunk writes', description: 'Write chunk data synchronously to disk for safer saves.', type: 'boolean' },
            { key: 'use-native-transport', label: 'Use native transport', description: 'Use optimized Linux networking when available.', type: 'boolean' },
        ],
    },
    {
        id: 'security',
        label: 'Security & RCON',
        description: 'Remote console and connection security options.',
        fields: [
            { key: 'prevent-proxy-connections', label: 'Prevent proxy connections', description: 'Block players joining through certain proxy setups.', type: 'boolean' },
            { key: 'enforce-secure-profile', label: 'Enforce secure profile', description: 'Require cryptographically signed player profiles.', type: 'boolean' },
            { key: 'hide-online-players', label: 'Hide online players', description: 'Hide the player list from server list pings.', type: 'boolean' },
            { key: 'enable-rcon', label: 'Enable RCON', description: 'Enable remote console access over TCP.', type: 'boolean' },
            { key: 'rcon.port', label: 'RCON port', description: 'TCP port used for RCON connections.', type: 'number', min: 1, max: 65535 },
            { key: 'rcon.password', label: 'RCON password', description: 'Password required for RCON access.', type: 'string' },
            { key: 'broadcast-rcon-to-ops', label: 'Broadcast RCON to ops', description: 'Send RCON command output to online operators.', type: 'boolean' },
            { key: 'broadcast-console-to-ops', label: 'Broadcast console to ops', description: 'Send console log output to online operators.', type: 'boolean' },
        ],
    },
];

export const MINECRAFT_CONFIGS: MinecraftConfigDefinition[] = [
    {
        id: 'server-properties',
        category: 'core',
        label: 'Server Properties',
        description: 'Main server settings: MOTD, gamemode, world options, and player limits.',
        path: 'server.properties',
        format: 'properties',
        groups: SERVER_PROPERTIES_GROUPS,
    },
    {
        id: 'eula',
        category: 'core',
        label: 'EULA',
        description: 'Minecraft End User License Agreement acceptance.',
        path: 'eula.txt',
        format: 'eula',
        unavailableHint: 'Created automatically when the server is installed or first started.',
    },
    {
        id: 'ops',
        category: 'core',
        label: 'Operators',
        description: 'Server operators and their permission levels.',
        path: 'ops.json',
        format: 'raw',
        language: 'json',
        unavailableHint: 'Created when operators are added. Vanilla and plugin servers use this file.',
    },
    {
        id: 'whitelist',
        category: 'core',
        label: 'Whitelist',
        description: 'Players allowed to join when the whitelist is enabled.',
        path: 'whitelist.json',
        format: 'raw',
        language: 'json',
        unavailableHint: 'Created when the whitelist is enabled and players are added.',
    },
    {
        id: 'banned-players',
        category: 'core',
        label: 'Banned Players',
        description: 'Players banned from the server.',
        path: 'banned-players.json',
        format: 'raw',
        language: 'json',
    },
    {
        id: 'banned-ips',
        category: 'core',
        label: 'Banned IPs',
        description: 'IP addresses banned from the server.',
        path: 'banned-ips.json',
        format: 'raw',
        language: 'json',
    },
    {
        id: 'bukkit',
        category: 'bukkit',
        label: 'Bukkit',
        description: 'Base plugin server configuration.',
        path: 'bukkit.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on Bukkit-based servers such as Paper, Spigot, or Purpur.',
    },
    {
        id: 'spigot',
        category: 'bukkit',
        label: 'Spigot',
        description: 'Spigot performance and entity limits.',
        path: 'spigot.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on Spigot-based servers. Vanilla servers do not use this file.',
    },
    {
        id: 'commands',
        category: 'bukkit',
        label: 'Commands',
        description: 'Custom command aliases and tab-completion overrides.',
        path: 'commands.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on Bukkit-based servers such as Paper, Spigot, or Purpur.',
    },
    {
        id: 'help',
        category: 'bukkit',
        label: 'Help',
        description: 'Custom entries shown by the /help command.',
        path: 'help.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on Bukkit-based servers such as Paper, Spigot, or Purpur.',
    },
    {
        id: 'permissions',
        category: 'bukkit',
        label: 'Permissions',
        description: 'Legacy Bukkit permission nodes (rarely used on modern servers).',
        path: 'permissions.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on Bukkit-based servers. Most servers rely on plugin permissions instead.',
    },
    {
        id: 'paper-global',
        category: 'paper',
        label: 'Paper Global',
        description: 'Global Paper server settings.',
        path: 'config/paper-global.yml',
        alternatePaths: ['paper-global.yml'],
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on Paper servers. The file is created after the first Paper start.',
    },
    {
        id: 'paper-world-defaults',
        category: 'paper',
        label: 'Paper World Defaults',
        description: 'Default world behaviour for new worlds on Paper.',
        path: 'config/paper-world-defaults.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on Paper servers. The file is created after the first Paper start.',
    },
    {
        id: 'paper-legacy',
        category: 'paper',
        label: 'Paper (Legacy)',
        description: 'Legacy Paper configuration used before the config/ split.',
        path: 'paper.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only used on older Paper versions. Modern Paper uses config/paper-global.yml instead.',
    },
    {
        id: 'paper-world',
        category: 'paper',
        label: 'Paper World',
        description: 'Per-world Paper overrides inside a world folder.',
        path: 'world/paper-world.yml',
        pathPatterns: [/(^|\/)paper-world\.yml$/],
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Created inside each world folder after the first Paper start for that world.',
    },
    {
        id: 'purpur',
        category: 'forks',
        label: 'Purpur',
        description: 'Purpur-specific gameplay and performance tweaks.',
        path: 'purpur.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on Purpur servers.',
    },
    {
        id: 'pufferfish',
        category: 'forks',
        label: 'Pufferfish',
        description: 'Pufferfish-specific performance settings.',
        path: 'pufferfish.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on Pufferfish servers.',
    },
    {
        id: 'leaves',
        category: 'forks',
        label: 'Leaves',
        description: 'Leaves fork configuration.',
        path: 'leaves.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on Leaves servers.',
    },
    {
        id: 'bungeecord',
        category: 'proxy',
        label: 'BungeeCord',
        description: 'BungeeCord proxy listeners, servers, and connection settings.',
        path: 'config.yml',
        format: 'raw',
        language: 'yaml',
        unavailableHint: 'Only available on BungeeCord proxy servers.',
    },
    {
        id: 'velocity',
        category: 'proxy',
        label: 'Velocity',
        description: 'Velocity proxy bind addresses, forwarding, and player limits.',
        path: 'velocity.toml',
        format: 'raw',
        language: 'toml',
        unavailableHint: 'Only available on Velocity proxy servers.',
    },
    {
        id: 'velocity-forwarding-secret',
        category: 'proxy',
        label: 'Velocity Forwarding Secret',
        description: 'Shared secret for Velocity modern IP forwarding on backend servers.',
        path: 'forwarding.secret',
        format: 'raw',
        language: 'plaintext',
        unavailableHint: 'Created when Velocity modern forwarding is enabled on a backend Minecraft server.',
    },
];

export const getMinecraftConfigById = (id: string): MinecraftConfigDefinition | undefined =>
    MINECRAFT_CONFIGS.find((config) => config.id === id);

const normalizeConfigPath = (filePath: string): string => filePath.replace(/^\/+/, '');

export const getMinecraftConfigByPath = (filePath: string): MinecraftConfigDefinition | undefined => {
    const normalized = normalizeConfigPath(filePath);

    const exactMatch = MINECRAFT_CONFIGS.find((config) =>
        getConfigPaths(config).some((path) => normalizeConfigPath(path) === normalized)
    );

    if (exactMatch) {
        return exactMatch;
    }

    return MINECRAFT_CONFIGS.find((config) =>
        config.pathPatterns?.some((pattern) => pattern.test(normalized))
    );
};

export const isVisualEditorCompatible = (config: MinecraftConfigDefinition): boolean =>
    config.format === 'properties' || config.format === 'eula' || config.format === 'raw';

export const getConfigPaths = (config: MinecraftConfigDefinition): string[] => {
    const paths = [config.path];

    if (config.alternatePaths) {
        paths.push(...config.alternatePaths);
    }

    return paths;
};

export const getConfigsByCategory = (categoryId: string): MinecraftConfigDefinition[] =>
    MINECRAFT_CONFIGS.filter((config) => config.category === categoryId);

export const getSchemaFieldKeys = (config: MinecraftConfigDefinition): Set<string> => {
    const keys = new Set<string>();

    for (const group of config.groups ?? []) {
        for (const field of group.fields) {
            keys.add(field.key);
        }
    }

    return keys;
};
