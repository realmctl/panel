export type EggCategory = 'minecraft';

export type EggCategoryFeature = 'players' | 'plugins' | 'versions';

const CATEGORY_FEATURES: Record<EggCategory, EggCategoryFeature[]> = {
    minecraft: ['players', 'plugins', 'versions'],
};

export const serverHasEggFeature = (
    eggCategory: string | null | undefined,
    feature: EggCategoryFeature
): boolean => {
    if (!eggCategory) {
        return false;
    }

    const features = CATEGORY_FEATURES[eggCategory as EggCategory];

    return Array.isArray(features) && features.includes(feature);
};
