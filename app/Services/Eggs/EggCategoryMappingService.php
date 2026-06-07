<?php

namespace Realm\Services\Eggs;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Realm\Exceptions\DisplayException;
use Realm\Models\EggCategoryMapping;
use Realm\Models\Server;

class EggCategoryMappingService
{
    /** @var array<int, string>|null */
    private static ?array $eggCategoryCache = null;

    /**
     * @return array<string, array<int>>
     */
    public function getMappingsGroupedByCategory(): array
    {
        $categories = array_keys(config('egg_categories.categories', []));
        $grouped = array_fill_keys($categories, []);

        EggCategoryMapping::query()
            ->get(['egg_id', 'category'])
            ->each(function (EggCategoryMapping $mapping) use (&$grouped) {
                if (!array_key_exists($mapping->category, $grouped)) {
                    return;
                }

                $grouped[$mapping->category][] = $mapping->egg_id;
            });

        foreach ($grouped as $category => $eggIds) {
            sort($grouped[$category]);
        }

        return $grouped;
    }

    /**
     * @param array<string, array<int|string>> $mappings
     */
    public function syncMappings(array $mappings): void
    {
        $allowedCategories = array_keys(config('egg_categories.categories', []));
        $normalized = [];

        foreach ($mappings as $category => $eggIds) {
            if (!in_array($category, $allowedCategories, true)) {
                continue;
            }

            if (!is_array($eggIds)) {
                continue;
            }

            foreach ($eggIds as $eggId) {
                $eggId = (int) $eggId;

                if ($eggId <= 0) {
                    continue;
                }

                if (isset($normalized[$eggId])) {
                    throw new DisplayException('Each egg can only be assigned to one category.');
                }

                $normalized[$eggId] = $category;
            }
        }

        DB::transaction(function () use ($normalized) {
            EggCategoryMapping::query()->delete();

            $now = now();

            foreach ($normalized as $eggId => $category) {
                EggCategoryMapping::query()->create([
                    'egg_id' => $eggId,
                    'category' => $category,
                ]);
            }
        });

        self::$eggCategoryCache = null;
    }

    public function getCategoryForEgg(int $eggId): ?string
    {
        return $this->getEggCategoryLookup()[$eggId] ?? null;
    }

    public function serverHasCategory(Server $server, string $category): bool
    {
        return $this->getCategoryForEgg($server->egg_id) === $category;
    }

    public function serverSupportsFeature(Server $server, string $feature): bool
    {
        $eggCategory = $this->getCategoryForEgg($server->egg_id);

        if (!$eggCategory) {
            return false;
        }

        $features = config("egg_categories.categories.{$eggCategory}.features", []);

        return in_array($feature, $features, true);
    }

    /**
     * @return Collection<string, array<string, mixed>>
     */
    public function getCategoryDefinitions(): Collection
    {
        return Collection::make(config('egg_categories.categories', []));
    }

    /**
     * @return array<int, string>
     */
    private function getEggCategoryLookup(): array
    {
        if (self::$eggCategoryCache !== null) {
            return self::$eggCategoryCache;
        }

        self::$eggCategoryCache = EggCategoryMapping::query()
            ->pluck('category', 'egg_id')
            ->all();

        return self::$eggCategoryCache;
    }
}
