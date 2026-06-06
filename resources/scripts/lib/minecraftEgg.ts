const MINECRAFT_EGG_KEYWORDS = [
    'minecraft',
    'paper',
    'spigot',
    'forge',
    'fabric',
    'sponge',
    'purpur',
    'velocity',
    'bungee',
    'waterfall',
    'folia',
];

export const isMinecraftEgg = (eggName: string): boolean => {
    const normalized = eggName.toLowerCase();

    return MINECRAFT_EGG_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

export const serverSupportsPlayers = (eggName: string, eggCategory: string | null): boolean => {
    if (eggCategory === 'minecraft') {
        return true;
    }

    return isMinecraftEgg(eggName);
};
