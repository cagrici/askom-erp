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
        Schema::create('inventory_alerts', function (Blueprint $table) {
            $table->id();
            
            // Alert type and level
            $table->enum('alert_type', [
                'low_stock', 'out_of_stock', 'overstock', 'expiry_warning',
                'expired_stock', 'damaged_stock', 'quality_issue', 'temperature_breach',
                'movement_anomaly', 'cost_variance', 'cycle_count_due', 'reorder_point'
            ]);
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            
            // Entity references
            $table->foreignId('inventory_item_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('inventory_stock_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_location_id')->nullable()->constrained()->onDelete('set null');
            
            // Alert content
            $table->string('title');
            $table->text('message');
            $table->text('description')->nullable();
            $table->json('alert_data')->nullable(); // Additional context data
            
            // Thresholds and values
            $table->decimal('threshold_value', 15, 4)->nullable();
            $table->decimal('current_value', 15, 4)->nullable();
            $table->decimal('variance_amount', 15, 4)->nullable();
            $table->decimal('variance_percentage', 8, 2)->nullable();
            
            // Status and lifecycle
            $table->enum('status', ['active', 'acknowledged', 'resolved', 'dismissed', 'escalated'])->default('active');
            $table->boolean('is_system_generated')->default(true);
            $table->boolean('auto_resolve')->default(false);
            $table->timestamp('triggered_at');
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('escalated_at')->nullable();
            
            // Assignment and ownership
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Actions and resolution
            $table->text('acknowledgment_notes')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->json('actions_taken')->nullable();
            $table->string('resolution_type')->nullable(); // fixed, false_positive, ignored, etc.
            
            // Notification tracking
            $table->json('notification_channels')->nullable(); // email, sms, push, etc.
            $table->json('notification_recipients')->nullable();
            $table->integer('notification_count')->default(0);
            $table->timestamp('last_notification_sent')->nullable();
            $table->boolean('notifications_enabled')->default(true);
            
            // Escalation settings
            $table->integer('escalation_level')->default(0);
            $table->integer('max_escalation_level')->default(3);
            $table->integer('escalation_interval_minutes')->default(60);
            $table->timestamp('next_escalation_at')->nullable();
            $table->json('escalation_rules')->nullable();
            
            // Recurrence and frequency
            $table->boolean('is_recurring')->default(false);
            $table->string('recurrence_pattern')->nullable(); // daily, weekly, monthly
            $table->integer('occurrence_count')->default(1);
            $table->timestamp('last_occurrence')->nullable();
            $table->timestamp('next_check_at')->nullable();
            
            // Business impact
            $table->enum('business_impact', ['none', 'low', 'medium', 'high', 'critical'])->default('none');
            $table->decimal('financial_impact', 15, 2)->default(0);
            $table->text('impact_description')->nullable();
            
            // Alert source
            $table->string('source_system')->nullable();
            $table->string('source_reference')->nullable();
            $table->json('source_data')->nullable();
            
            // Rules and conditions
            $table->json('trigger_conditions')->nullable();
            $table->string('rule_name')->nullable();
            $table->text('rule_description')->nullable();
            
            // Custom fields
            $table->json('custom_attributes')->nullable();
            $table->json('metadata')->nullable();
            
            // Tags and categorization
            $table->json('tags')->nullable();
            $table->string('category')->nullable();
            $table->string('subcategory')->nullable();
            
            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['alert_type', 'severity']);
            $table->index(['status', 'triggered_at']);
            $table->index(['inventory_item_id', 'status']);
            $table->index(['warehouse_id', 'status']);
            $table->index(['assigned_to', 'status']);
            $table->index(['is_recurring', 'next_check_at']);
            $table->index(['escalation_level', 'next_escalation_at']);
            $table->index(['triggered_at']);
            $table->index(['business_impact']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_alerts');
    }
};