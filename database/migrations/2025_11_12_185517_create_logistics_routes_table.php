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
        Schema::create('logistics_routes', function (Blueprint $table) {
            $table->id();
            $table->string('route_number')->unique();
            $table->string('route_name');

            // Route Details
            $table->string('origin_location')->nullable();
            $table->string('destination_location')->nullable();
            $table->decimal('total_distance_km', 10, 2)->nullable();
            $table->integer('estimated_duration_minutes')->nullable();

            // Route Type and Frequency
            $table->enum('route_type', ['delivery', 'pickup', 'round_trip', 'multi_stop'])->default('delivery');
            $table->enum('frequency', ['daily', 'weekly', 'monthly', 'on_demand'])->default('on_demand');
            $table->text('schedule_notes')->nullable();

            // Cost Information
            $table->decimal('estimated_fuel_cost', 15, 2)->nullable();
            $table->decimal('estimated_toll_cost', 15, 2)->nullable();
            $table->decimal('total_cost_per_trip', 15, 2)->nullable();
            $table->string('currency', 3)->default('TRY');

            // Route Optimization
            $table->json('waypoints')->nullable(); // Store multiple stops
            $table->text('optimized_sequence')->nullable();
            $table->boolean('is_optimized')->default(false);
            $table->timestamp('last_optimized_at')->nullable();

            // Status and Active
            $table->enum('status', ['active', 'inactive', 'under_review'])->default('active');
            $table->boolean('is_favorite')->default(false);

            // Additional Info
            $table->text('description')->nullable();
            $table->text('road_conditions')->nullable();
            $table->text('special_instructions')->nullable();
            $table->text('notes')->nullable();

            // Usage Statistics
            $table->integer('total_trips')->default(0);
            $table->timestamp('last_used_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('route_number');
            $table->index('status');
            $table->index('route_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logistics_routes');
    }
};
