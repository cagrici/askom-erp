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
        Schema::create('sales_order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained()->onDelete('cascade');
            $table->string('previous_status')->nullable();
            $table->string('new_status');
            $table->foreignId('changed_by_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('changed_at')->useCurrent();
            $table->text('notes')->nullable();
            $table->string('reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->index(['sales_order_id', 'changed_at']);
            $table->index(['new_status', 'changed_at']);
            $table->index('changed_by_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_order_status_histories');
    }
};
