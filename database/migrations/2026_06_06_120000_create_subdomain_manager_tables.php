<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('domains', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type');
            $table->string('display_type');
            $table->text('key');
            $table->text('secret')->nullable();
            $table->text('consumer')->nullable();
            $table->string('cloudflare_id')->nullable();
            $table->string('ovh_api')->nullable();
            $table->timestamps();
        });

        Schema::create('subdomains', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type');
            $table->foreignId('domain_id');
            $table->foreignId('server_id');
            $table->foreignId('record_id');
            $table->string('api_id')->nullable();
            $table->timestamps();
        });

        Schema::create('records', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ttl')->nullable();
            $table->string('type');
            $table->string('protocol')->nullable();
            $table->string('priority')->nullable();
            $table->string('weight')->nullable();
            $table->string('service')->nullable();
            $table->foreignId('domain_id');
            $table->timestamps();
        });

        Schema::create('egg_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('record_id');
            $table->foreignId('egg_id');
            $table->timestamps();
        });

        Schema::table('servers', function (Blueprint $table) {
            $table->unsignedInteger('subdomain_limit')->default(0)->after('backup_limit');
        });
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropColumn('subdomain_limit');
        });

        Schema::dropIfExists('egg_records');
        Schema::dropIfExists('records');
        Schema::dropIfExists('subdomains');
        Schema::dropIfExists('domains');
    }
};
