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
        Schema::create('warehouse_zones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('warehouse_id');
            $table->string('code');
            $table->string('name');
            $table->text('description')->nullable();
            
            // Zone specifications
            $table->enum('zone_type', [
                'receiving', 'storage', 'picking', 'packing', 'shipping',
                'returns', 'quarantine', 'office', 'maintenance', 'staging'
            ]);
            
            $table->decimal('area', 10, 2)->nullable(); // m²
            $table->decimal('height', 8, 2)->nullable(); // meters
            $table->integer('capacity')->nullable(); // items
            $table->decimal('max_weight', 12, 2)->nullable(); // kg
            
            // Zone properties
            $table->enum('temperature_control', ['none', 'ambient', 'refrigerated', 'frozen'])->default('ambient');
            $table->decimal('min_temperature', 5, 2)->nullable(); // °C
            $table->decimal('max_temperature', 5, 2)->nullable(); // °C
            $table->boolean('climate_controlled')->default(false);
            $table->boolean('security_required')->default(false);
            $table->boolean('hazmat_approved')->default(false);
            
            // Access control
            $table->json('access_restrictions')->nullable(); // user roles, time restrictions
            $table->json('safety_requirements')->nullable(); // PPE, certifications
            
            // Layout information
            $table->json('coordinates')->nullable(); // x1, y1, x2, y2 for floor plan
            $table->string('floor_level')->default('Ground'); // Ground, Mezzanine, etc.
            
            $table->enum('status', ['active', 'inactive', 'maintenance', 'planned'])->default('active');
            
            // Audit fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('warehouse_id')->references('id')->on('warehouses')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->unique(['warehouse_id', 'code']);
            $table->index(['warehouse_id', 'zone_type']);
            $table->index(['status', 'zone_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouse_zones');
    }
};