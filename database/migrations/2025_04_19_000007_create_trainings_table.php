<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('trainings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('training_type');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('location')->nullable();
            $table->string('trainer')->nullable();
            $table->string('status')->default('scheduled');
            $table->decimal('cost', 10, 2)->nullable();
            $table->string('currency')->default('TRY');
            $table->text('materials')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('employee_training', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('training_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('enrolled');
            $table->boolean('is_completed')->default(false);
            $table->date('completion_date')->nullable();
            $table->text('feedback')->nullable();
            $table->integer('score')->nullable();
            $table->string('certificate')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_training');
        Schema::dropIfExists('trainings');
    }
};
