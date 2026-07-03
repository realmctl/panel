/**
 * Resolves the banner/background image for a server based on its egg
 * configuration, falling back to detection from the egg name or docker image.
 */
interface ServerLike {
    eggBackground?: string | null;
    eggName: string;
    dockerImage: string;
}

const detectFromString = (value: string): string | null => {
    if (value.includes('minecraft')) return '/assets/backgrounds/minecraft.png';
    if (value.includes('rust')) return '/assets/backgrounds/rust.jpg';
    if (value.includes('valheim')) return '/assets/backgrounds/valheim.jpeg';
    if (value.includes('ark')) return '/assets/backgrounds/ark.webp';
    if (value.includes('terraria')) return '/assets/backgrounds/terraria.jpg';
    if (value.includes('csgo') || value.includes('cs2') || value.includes('counter-strike') || value.includes('counter strike'))
        return '/assets/backgrounds/csgo.jpg';
    if (value.includes('gmod') || value.includes('garry')) return '/assets/backgrounds/gmod.jpeg';
    if (value.includes('fivem')) return '/assets/backgrounds/fivem.jpeg';

    return null;
};

export const getServerBackground = (server: ServerLike): string => {
    if (server.eggBackground) {
        return `/assets/backgrounds/${server.eggBackground}`;
    }

    return (
        detectFromString(server.eggName.toLowerCase()) ??
        detectFromString(server.dockerImage.toLowerCase()) ??
        '/assets/backgrounds/minecraft.png'
    );
};
