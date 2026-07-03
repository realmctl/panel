<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('backups', function (Blueprint $table) {
            $table->unsignedBigInteger('backup_destination_id')->nullable()->after('disk');

            $table->foreign('backup_destination_id')->references('id')->on('backup_destinations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('backups', function (Blueprint $table) {
            $table->dropForeign(['backup_destination_id']);
            $table->dropColumn('backup_destination_id');
        });
    }
};
