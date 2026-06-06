<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('egg_category_mappings', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('egg_id');
            $table->string('category', 64);
            $table->timestamps();

            $table->unique('egg_id');
            $table->index('category');

            $table->foreign('egg_id')->references('id')->on('eggs')->onDelete('cascade');
        });

        $nestIds = DB::table('nests')
            ->where('name', 'LIKE', '%minecraft%')
            ->pluck('id');

        if ($nestIds->isEmpty()) {
            return;
        }

        $eggIds = DB::table('eggs')
            ->whereIn('nest_id', $nestIds)
            ->pluck('id');

        $now = now();

        foreach ($eggIds as $eggId) {
            DB::table('egg_category_mappings')->insert([
                'egg_id' => $eggId,
                'category' => 'minecraft',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('egg_category_mappings');
    }
};
