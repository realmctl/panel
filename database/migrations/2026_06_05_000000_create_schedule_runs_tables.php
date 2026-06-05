<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_runs', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('schedule_id');
            $table->string('status', 32);
            $table->string('trigger', 16);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->foreign('schedule_id')->references('id')->on('schedules')->onDelete('cascade');
            $table->index(['schedule_id', 'created_at']);
        });

        Schema::create('schedule_run_tasks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('schedule_run_id');
            $table->unsignedInteger('task_id')->nullable();
            $table->unsignedInteger('sequence_id');
            $table->string('action', 64);
            $table->text('payload')->nullable();
            $table->string('status', 32);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->foreign('schedule_run_id')->references('id')->on('schedule_runs')->onDelete('cascade');
            $table->foreign('task_id')->references('id')->on('tasks')->onDelete('set null');
            $table->index(['schedule_run_id', 'sequence_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_run_tasks');
        Schema::dropIfExists('schedule_runs');
    }
};
