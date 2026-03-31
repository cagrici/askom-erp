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
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('shipment_number')->unique();

            // References
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->onDelete('set null');
            $table->foreignId('driver_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('current_account_id')->nullable()->constrained('current_accounts')->onDelete('set null');

            // Shipment Details
            $table->date('shipment_date');
            $table->date('planned_delivery_date')->nullable();
            $table->date('actual_delivery_date')->nullable();
            $table->time('departure_time')->nullable();
            $table->time('arrival_time')->nullable();

            // Status
            $table->enum('status', ['draft', 'planned', 'in_transit', 'delivered', 'cancelled', 'delayed'])->default('draft');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');

            // Origin
            $table->string('origin_address')->nullable();
            $table->string('origin_city')->nullable();
            $table->string('origin_postal_code')->nullable();
            $table->decimal('origin_latitude', 10, 8)->nullable();
            $table->decimal('origin_longitude', 11, 8)->nullable();

            // Destination
            $table->string('destination_name')->nullable();
            $table->text('destination_address')->nullable();
            $table->string('destination_city')->nullable();
            $table->string('destination_postal_code')->nullable();
            $table->decimal('destination_latitude', 10, 8)->nullable();
            $table->decimal('destination_longitude', 11, 8)->nullable();
            $table->string('destination_contact_name')->nullable();
            $table->string('destination_contact_phone')->nullable();

            // Route and Distance
            $table->decimal('estimated_distance_km', 10, 2)->nullable();
            $table->decimal('actual_distance_km', 10, 2)->nullable();
            $table->integer('estimated_duration_minutes')->nullable();
            $table->integer('actual_duration_minutes')->nullable();
            $table->text('route_notes')->nullable();

            // Cargo Details
            $table->decimal('total_weight_kg', 10, 2)->nullable();
            $table->decimal('total_volume_m3', 10, 2)->nullable();
            $table->integer('total_packages')->nullable();
            $table->text('cargo_description')->nullable();
            $table->boolean('requires_signature')->default(false);
            $table->boolean('requires_refrigeration')->default(false);
            $table->boolean('is_fragile')->default(false);

            // Costs
            $table->decimal('estimated_cost', 15, 2)->nullable();
            $table->decimal('actual_cost', 15, 2)->nullable();
            $table->decimal('fuel_cost', 15, 2)->nullable();
            $table->decimal('toll_cost', 15, 2)->nullable();
            $table->decimal('other_costs', 15, 2)->nullable();
            $table->string('currency', 3)->default('TRY');

            // Tracking
            $table->decimal('current_latitude', 10, 8)->nullable();
            $table->decimal('current_longitude', 11, 8)->nullable();
            $table->timestamp('last_location_update')->nullable();
            $table->integer('completion_percentage')->default(0);

            // Documentation
            $table->string('waybill_number')->nullable();
            $table->string('reference_number')->nullable();
            $table->text('special_instructions')->nullable();
            $table->text('delivery_notes')->nullable();
            $table->text('internal_notes')->nullable();

            // Ratings and Feedback
            $table->integer('customer_rating')->nullable();
            $table->text('customer_feedback')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('shipment_number');
            $table->index('status');
            $table->index('shipment_date');
            $table->index('vehicle_id');
            $table->index('driver_id');
            $table->index('current_account_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
