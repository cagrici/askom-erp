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
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();

            // Location information
            $table->text('address');
            $table->string('city', 100);
            $table->string('state', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country', 100)->default('Turkey');

            // Physical specifications
            $table->decimal('total_area', 10, 2)->nullable(); // m²
            $table->decimal('storage_area', 10, 2)->nullable(); // m²
            $table->decimal('office_area', 10, 2)->nullable(); // m²
            $table->decimal('height', 8, 2)->nullable(); // meters

            // Capacity information
            $table->integer('max_capacity')->nullable(); // total items
            $table->decimal('max_weight', 12, 2)->nullable(); // kg
            $table->decimal('max_volume', 12, 2)->nullable(); // m³

            // Warehouse type and status
            $table->enum('warehouse_type', [
                'main', 'storage', 'regional', 'distribution', 'retail', 'production',
                'cross_dock', 'cold_storage', 'hazardous'
            ])->default('main');

            $table->enum('status', ['active', 'inactive', 'maintenance', 'planned'])->default('active');
            $table->boolean('is_default')->default(false);

            // Contact information
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('contact_person')->nullable();

            // Operating hours
            $table->json('operating_hours')->nullable(); // {mon: {open: '08:00', close: '17:00'}, ...}
            $table->json('special_hours')->nullable(); // holiday schedules, etc.

            // Features and capabilities
            $table->json('features')->nullable(); // ['climate_controlled', 'security_system', 'loading_dock', ...]
            $table->json('equipment')->nullable(); // ['forklift', 'conveyor', 'scanner', ...]

            // Integration settings
            $table->json('integration_settings')->nullable(); // WMS, ERP connections

            // GPS coordinates
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            // Audit fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('manager_id')->nullable(); // warehouse manager

            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('manager_id')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index(['status', 'warehouse_type']);
            $table->index('city');
            $table->index('manager_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
