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
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            
            // Location fields
            $table->unsignedBigInteger('from_location_id');
            $table->unsignedBigInteger('to_location_id');
            
            // Transfer details
            $table->enum('transfer_type', [
                'internal', 
                'external', 
                'warehouse_to_store', 
                'store_to_warehouse', 
                'store_to_store', 
                'emergency', 
                'return'
            ])->default('internal');
            
            $table->enum('status', [
                'pending', 
                'approved', 
                'shipped', 
                'received', 
                'completed', 
                'cancelled'
            ])->default('pending');
            
            $table->enum('priority', [
                'low', 
                'normal', 
                'high', 
                'urgent'
            ])->default('normal');
            
            // Summary fields
            $table->integer('total_items')->default(0);
            $table->decimal('total_value', 15, 2)->default(0);
            
            // Date fields
            $table->date('expected_date')->nullable();
            $table->date('shipped_date')->nullable();
            $table->date('received_date')->nullable();
            
            // Shipping details
            $table->string('tracking_number')->nullable();
            $table->string('carrier')->nullable();
            $table->text('notes')->nullable();
            
            // User tracking
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->unsignedBigInteger('shipped_by')->nullable();
            $table->unsignedBigInteger('received_by')->nullable();
            
            // Timestamp tracking
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('received_at')->nullable();
            
            // Audit fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('from_location_id')->references('id')->on('locations')->onDelete('restrict');
            $table->foreign('to_location_id')->references('id')->on('locations')->onDelete('restrict');
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('shipped_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('received_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index(['status', 'created_at']);
            $table->index(['transfer_type', 'created_at']);
            $table->index(['from_location_id', 'status']);
            $table->index(['to_location_id', 'status']);
            $table->index('expected_date');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};