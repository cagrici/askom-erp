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
        Schema::create('work_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_tr');
            $table->time('start_time');
            $table->time('end_time');
            $table->json('working_days'); // Monday to Friday by default
            $table->boolean('is_flextime')->default(false);
            $table->time('flex_start_time')->nullable();
            $table->time('flex_end_time')->nullable();
            $table->integer('break_duration')->default(60); // In minutes
            $table->foreignId('company_id')->constrained('companies');
            $table->timestamps();
        });

        Schema::create('employee_work_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('work_schedule_id')->constrained('work_schedules');
            $table->date('effective_date');
            $table->date('end_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->date('date');
            $table->timestamp('check_in')->nullable();
            $table->timestamp('check_out')->nullable();
            $table->decimal('total_hours', 5, 2)->nullable();
            $table->decimal('break_hours', 5, 2)->nullable();
            $table->enum('status', ['present', 'absent', 'late', 'half_day', 'on_leave', 'weekend', 'holiday'])->default('absent');
            $table->text('notes')->nullable();
            $table->boolean('is_manual_entry')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();

            // Unique constraint to prevent duplicate records
            $table->unique(['employee_id', 'date']);
        });

        Schema::create('overtime_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('hours', 5, 2);
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('overtime_requests');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('employee_work_schedules');
        Schema::dropIfExists('work_schedules');
    }
};
