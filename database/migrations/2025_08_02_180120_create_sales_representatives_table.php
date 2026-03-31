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
        Schema::create('sales_representatives', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('full_name')->virtualAs('CONCAT(first_name, " ", last_name)');
            $table->string('email', 150)->unique()->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('mobile', 20)->nullable();
            $table->string('department', 100)->nullable();
            $table->string('title', 100)->nullable();
            $table->string('employee_id', 50)->unique()->nullable();
            $table->decimal('commission_rate', 5, 2)->default(0)->comment('Commission rate percentage');
            $table->date('hire_date')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes
            $table->index(['is_active', 'department']);
            $table->index('employee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_representatives');
    }
};
