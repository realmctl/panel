<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('allocations', function (Blueprint $table) {
            $table->boolean('whitelist_enabled')->default(false)->after('notes');
            $table->enum('protocol', ['tcp', 'udp', 'both'])->default('tcp')->after('whitelist_enabled');
            $table->json('allowed_ips')->nullable()->after('protocol');
        });
    }

    public function down(): void
    {
        Schema::table('allocations', function (Blueprint $table) {
            $table->dropColumn(['whitelist_enabled', 'protocol', 'allowed_ips']);
        });
    }
};
