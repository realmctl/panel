<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddInstalledVersionColumnsToServersTable extends Migration
{
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->string('installed_software')->nullable();
            $table->string('installed_version')->nullable();
            $table->string('installed_build')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn(['installed_software', 'installed_version', 'installed_build']);
        });
    }
}
