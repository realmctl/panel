<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('server_groups', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedInteger('user_id');
            $table->string('name', 191);
            $table->string('color', 32)->default('blue');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
        });

        Schema::create('server_group_server', function (Blueprint $table) {
            $table->unsignedBigInteger('group_id');
            $table->unsignedInteger('server_id');

            $table->primary(['group_id', 'server_id']);
            $table->foreign('group_id')->references('id')->on('server_groups')->onDelete('cascade');
            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('server_group_server');
        Schema::dropIfExists('server_groups');
    }
};
