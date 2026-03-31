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
        Schema::create('sales_order_status_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sales_order_id');
            $table->string('previous_status')->nullable();
            $table->string('new_status');
            $table->unsignedBigInteger('changed_by_id');
            $table->timestamp('changed_at');
            $table->text('notes')->nullable();
            $table->text('reason')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            // Foreign Key Constraints
            $table->foreign('sales_order_id')->references('id')->on('sales_orders')->onDelete('cascade');
            $table->foreign('changed_by_id')->references('id')->on('users')->onDelete('restrict');
            
            // Indexes
            $table->index(['sales_order_id', 'changed_at']);
            $table->index('changed_at');
            $table->index('new_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_order_status_history');
    }
};
