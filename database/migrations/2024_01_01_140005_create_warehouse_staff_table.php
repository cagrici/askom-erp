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
        Schema::create('warehouse_staff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('warehouse_id');

            // Employment details
            $table->string('employee_id')->nullable();
            $table->enum('employment_type', ['full_time', 'part_time', 'contractor', 'seasonal'])->default('full_time');
            $table->enum('shift', ['day', 'evening', 'night', 'rotating'])->default('day');

            // Role and responsibilities
            $table->enum('role', [
                'warehouse_manager', 'supervisor', 'team_leader',
                'receiver', 'picker', 'packer', 'shipper',
                'forklift_operator', 'quality_control', 'maintenance',
                'inventory_controller', 'returns_processor'
            ]);

            $table->json('permissions')->nullable(); // specific warehouse permissions
            $table->json('zone_access')->nullable(); // accessible zones
            $table->json('operation_types')->nullable(); // allowed operation types

            // Skills and certifications
            $table->json('skills')->nullable(); // ['forklift', 'hazmat', 'quality_control']
            $table->json('certifications')->nullable(); // with expiry dates
            $table->json('equipment_authorizations')->nullable(); // authorized equipment

            // Performance tracking
            $table->decimal('performance_rating', 3, 2)->nullable(); // 1-5 scale
            $table->integer('operations_completed')->default(0);
            $table->decimal('accuracy_rate', 5, 2)->nullable(); // %
            $table->decimal('productivity_rate', 5, 2)->nullable(); // items/hour

            // Attendance and availability
            $table->json('work_schedule')->nullable(); // weekly schedule
            $table->boolean('is_available')->default(true);
            $table->timestamp('last_activity')->nullable();
            $table->enum('current_status', ['available', 'busy', 'break', 'offline'])->default('available');

            // Training and development
            $table->json('training_completed')->nullable();
            $table->json('training_required')->nullable();
            $table->date('last_training_date')->nullable();
            $table->date('next_review_date')->nullable();

            // Contact and emergency information
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->text('medical_conditions')->nullable();
            $table->text('safety_notes')->nullable();

            // Employment dates
            $table->date('hire_date')->nullable();
            $table->date('termination_date')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended', 'terminated'])->default('active');

            // Supervisor relationship
            $table->unsignedBigInteger('supervisor_id')->nullable();

            // Audit fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('cascade');
            $table->foreign('supervisor_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->unique(['user_id', 'warehouse_id']);
            $table->index(['warehouse_id', 'role']);
            $table->index(['status', 'is_available']);
            $table->index('employee_id');
            $table->index('current_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouse_staff');
    }
};
