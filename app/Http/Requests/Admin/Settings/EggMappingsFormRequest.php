<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class EggMappingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        $categories = array_keys(config('egg_categories.categories', []));

        return [
            'mappings' => 'nullable|array',
            'mappings.*' => 'array',
            'mappings.*.*' => [
                'integer',
                Rule::exists('eggs', 'id'),
            ],
            ...collect($categories)->mapWithKeys(fn (string $category) => [
                "mappings.{$category}" => 'nullable|array',
                "mappings.{$category}.*" => [
                    'integer',
                    Rule::exists('eggs', 'id'),
                ],
            ])->all(),
        ];
    }
}
