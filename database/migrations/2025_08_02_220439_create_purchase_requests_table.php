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
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'converted', 'cancelled'])->default('draft');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('request_type', ['regular', 'urgent', 'maintenance', 'project'])->default('regular');
            
            // Relations
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Dates
            $table->date('requested_date');
            $table->date('required_date');
            $table->timestamp('approved_at')->nullable();
            
            // Totals
            $table->decimal('total_amount', 15, 4)->default(0);
            $table->string('currency', 3)->default('TRY');
            $table->decimal('exchange_rate', 10, 6)->default(1);
            $table->decimal('total_amount_base_currency', 15, 4)->default(0);
            
            // Additional fields
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('budget_code')->nullable();
            $table->boolean('is_urgent')->default(false);
            $table->boolean('requires_approval')->default(true);
            $table->json('custom_fields')->nullable();
            
            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('deleted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['status', 'requested_date']);
            $table->index(['location_id', 'status']);
            $table->index(['requested_by', 'status']);
            $table->index(['department_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');
    }
};
