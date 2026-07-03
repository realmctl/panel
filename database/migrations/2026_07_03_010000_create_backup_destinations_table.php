<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('backup_destinations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name', 191);
            $table->string('adapter', 32)->default('s3');
            $table->string('bucket', 191)->nullable();
            $table->string('region', 191)->nullable();
            $table->text('access_key')->nullable();
            $table->text('secret_key')->nullable();
            $table->string('endpoint', 191)->nullable();
            $table->boolean('use_path_style_endpoint')->default(false);
            $table->string('storage_class', 64)->nullable();
            $table->timestamps();
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->unsignedBigInteger('backup_destination_id')->nullable()->after('long');

            $table->foreign('backup_destination_id')->references('id')->on('backup_destinations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropForeign(['backup_destination_id']);
            $table->dropColumn('backup_destination_id');
        });

        Schema::dropIfExists('backup_destinations');
    }
};
