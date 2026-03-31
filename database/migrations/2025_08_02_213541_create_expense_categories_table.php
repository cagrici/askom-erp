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
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 20)->unique();
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('expense_categories')->onDelete('cascade');
            
            // Muhasebe Entegrasyonu
            $table->string('account_code', 20)->nullable();
            $table->unsignedBigInteger('cost_center_id')->nullable();
            
            // Ayarlar
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_approval')->default(false);
            $table->decimal('approval_limit', 15, 2)->nullable();
            $table->string('color', 7)->default('#007bff');
            $table->string('icon', 50)->nullable();
            
            // Bütçe ve Limit
            $table->decimal('monthly_budget', 15, 2)->nullable();
            $table->decimal('yearly_budget', 15, 2)->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['parent_id']);
            $table->index(['is_active']);
            $table->index(['code']);
            $table->index(['name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense_categories');
    }
};
