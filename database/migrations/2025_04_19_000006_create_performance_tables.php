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
        Schema::create('performance_review_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_tr');
            $table->foreignId('company_id')->constrained('companies');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['draft', 'active', 'completed', 'cancelled'])->default('draft');
            $table->text('description')->nullable();
            $table->text('description_tr')->nullable();
            $table->timestamps();
        });

        Schema::create('performance_criteria', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_tr');
            $table->text('description')->nullable();
            $table->text('description_tr')->nullable();
            $table->foreignId('company_id')->constrained('companies');
            $table->integer('weight')->default(1); // Percentage weight in overall score
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('review_cycle_id')->constrained('performance_review_cycles');
            $table->foreignId('reviewer_id')->constrained('users');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'acknowledged'])->default('pending');
            $table->date('completed_at')->nullable();
            $table->date('acknowledged_at')->nullable();
            $table->decimal('overall_score', 5, 2)->nullable();
            $table->text('strengths')->nullable();
            $table->text('areas_for_improvement')->nullable();
            $table->text('development_plan')->nullable();
            $table->text('employee_comments')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('performance_review_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('performance_review_id')->constrained('performance_reviews')->onDelete('cascade');
            $table->foreignId('criteria_id')->constrained('performance_criteria');
            $table->integer('score'); // 1-5 or 1-10 depending on company policy
            $table->text('comments')->nullable();
            $table->timestamps();
        });

        Schema::create('employee_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('review_cycle_id')->nullable()->constrained('performance_review_cycles');
            $table->string('title');
            $table->text('description');
            $table->date('due_date')->nullable();
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'cancelled'])->default('not_started');
            $table->integer('progress')->default(0); // 0-100%
            $table->text('result')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_goals');
        Schema::dropIfExists('performance_review_details');
        Schema::dropIfExists('performance_reviews');
        Schema::dropIfExists('performance_criteria');
        Schema::dropIfExists('performance_review_cycles');
    }
};
