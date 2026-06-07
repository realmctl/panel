<?php

namespace Realm\Services\Minecraft;

class MinecraftAvatarService
{
    /**
     * Build Crafthead avatar URLs for a player.
     *
     * @return array{head: string, helm: string, body: string, provider: string}
     */
    public function urlsForPlayer(string $name, ?string $uuid = null): array
    {
        $identifier = $uuid ?: $name;
        $base = rtrim((string) config('minecraft.avatars.base_url'), '/');
        $sizes = config('minecraft.avatars.sizes');

        return [
            'provider' => (string) config('minecraft.avatars.provider', 'crafthead'),
            'head' => sprintf('%s/avatar/%s/%d', $base, $identifier, $sizes['head'] ?? 64),
            'helm' => sprintf('%s/helm/%s/%d', $base, $identifier, $sizes['helm'] ?? 64),
            'body' => sprintf('%s/body/%s/%d', $base, $identifier, $sizes['body'] ?? 128),
        ];
    }
}
