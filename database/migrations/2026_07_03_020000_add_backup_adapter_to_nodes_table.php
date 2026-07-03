<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds a per-node backup adapter override. When set, backups created for
     * servers on this node use the given adapter (e.g. "rustic") instead of the
     * Panel-wide default configured in config/backups.php.
     */
    public function up(): void
    {
        Schema::table('nodes', function (Blueprint $table) {
            $table->string('backup_adapter')->nullable()->after('maintenance_mode');
        });
    }

    public function down(): void
    {
        Schema::table('nodes', function (Blueprint $table) {
            $table->dropColumn('backup_adapter');
        });
    }
};
