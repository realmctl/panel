export interface ServerSoftware {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export const SERVER_SOFTWARE: ServerSoftware[] = [
    {
        id: 'vanilla',
        name: 'Vanilla',
        description: 'The original version of Minecraft: Java Edition without any modifications.',
        icon: '/assets/icons/Grass_Block.png',
    },
    {
        id: 'paper',
        name: 'Paper',
        description: 'An alternative fork of Spigot focused on high performance.',
        icon: '/assets/icons/papermc.webp',
    },
    {
        id: 'forge',
        name: 'Forge',
        description: 'The traditional and popular modded Minecraft, great for unique experiences.',
        icon: '/assets/icons/forge.jpeg',
    },
    {
        id: 'neoforge',
        name: 'NeoForge',
        description: 'Actively maintained fork of Forge with a modernized modding API.',
        icon: '/assets/icons/neoforge.png',
    },
    {
        id: 'fabric',
        name: 'Fabric',
        description: 'A lightweight version of modded Minecraft.',
        icon: '/assets/icons/fabricmc.png',
    },
    {
        id: 'folia',
        name: 'Folia',
        description: "Paper's fork for large worlds — regionizes the game across multiple threads.",
        icon: '/assets/icons/papermc_official.png',
    },
    {
        id: 'purpur',
        name: 'Purpur',
        description: 'A Paper fork with extra configuration options and gameplay features.',
        icon: '/assets/icons/purpur.svg',
    },
    {
        id: 'velocity',
        name: 'Velocity',
        description: 'A modern, high performance Minecraft proxy server.',
        icon: '/assets/icons/velocity.webp',
    },
    {
        id: 'waterfall',
        name: 'Waterfall',
        description: "PaperMC's fork of BungeeCord, a Minecraft proxy server.",
        icon: '/assets/icons/papermc_official.png',
    },
    {
        id: 'snapshot',
        name: 'Snapshot',
        description: 'Vanilla development builds — not recommended for production servers.',
        icon: '/assets/icons/Grass_Block.png',
    },
];

export const getServerSoftware = (id: string | null): ServerSoftware | null =>
    SERVER_SOFTWARE.find((entry) => entry.id === id) ?? null;
