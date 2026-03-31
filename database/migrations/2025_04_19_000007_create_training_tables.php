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
        Schema::create('training_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_tr');
            $table->text('description')->nullable();
            $table->text('description_tr')->nullable();
            $table->foreignId('company_id')->constrained('companies');
            $table->timestamps();
        });

        Schema::create('training_programs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('title_tr');
            $table->foreignId('category_id')->nullable()->constrained('training_categories');
            $table->text('description')->nullable();
            $table->text('description_tr')->nullable();
            $table->enum('type', ['internal', 'external', 'online', 'workshop', 'certification', 'other'])->default('internal');
            $table->integer('duration')->nullable(); // In hours
            $table->decimal('cost', 15, 2)->nullable();
            $table->string('currency', 3)->default('TRY');
            $table->string('provider')->nullable();
            $table->string('location')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('max_participants')->nullable();
            $table->boolean('is_mandatory')->default(false);
            $table->boolean('is_active')->default(true);
            $table->foreignId('company_id')->constrained('companies');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('training_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_program_id')->constrained('training_programs')->onDelete('cascade');
            $table->string('title')->nullable();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('location')->nullable();
            $table->string('instructor')->nullable();
            $table->text('notes')->nullable();
            $table->integer('max_participants')->nullable();
            $table->boolean('is_cancelled')->default(false);
            $table->timestamps();
        });

        Schema::create('employee_trainings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('training_program_id')->constrained('training_programs');
            $table->foreignId('training_session_id')->nullable()->constrained('training_sessions');
            $table->enum('status', ['registered', 'confirmed', 'completed', 'cancelled', 'no_show'])->default('registered');
            $table->boolean('is_passed')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->date('completion_date')->nullable();
            $table->date('certificate_expiry')->nullable();
            $table->timestamps();
        });

        Schema::create('training_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_program_id')->constrained('training_programs')->onDelete('cascade');
            $table->string('title');
            $table->string('title_tr')->nullable();
            $table->text('description')->nullable();
            $table->text('description_tr')->nullable();
            $table->foreignId('file_id')->nullable()->constrained('files');
            $table->string('external_url')->nullable();
            $table->enum('type', ['document', 'video', 'presentation', 'ebook', 'link', 'other'])->default('document');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_materials');
        Schema::dropIfExists('employee_trainings');
        Schema::dropIfExists('training_sessions');
        Schema::dropIfExists('training_programs');
        Schema::dropIfExists('training_categories');
    }
};
