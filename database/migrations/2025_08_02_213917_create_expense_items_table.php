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
        Schema::create('expense_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expense_id')->constrained('expenses')->onDelete('cascade');
            
            // Kalem Detayları
            $table->string('description', 255);
            $table->decimal('quantity', 10, 3)->default(1);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_amount', 15, 2);
            
            // Vergi
            $table->decimal('vat_rate', 5, 2)->default(0);
            $table->decimal('vat_amount', 15, 2)->default(0);
            
            // Muhasebe
            $table->string('account_code', 20)->nullable();
            $table->unsignedBigInteger('cost_center_id')->nullable();
            
            $table->timestamps();
            
            // İndeksler
            $table->index(['expense_id']);
            $table->index(['total_amount']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense_items');
    }
};
