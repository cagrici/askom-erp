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
        // First, update products table supplier_id foreign key to reference current_accounts
        Schema::table('products', function (Blueprint $table) {
            // Drop existing foreign key constraint
            $table->dropForeign(['supplier_id']);
            
            // Update foreign key to reference current_accounts instead of suppliers
            $table->foreign('supplier_id')->references('id')->on('current_accounts')->onDelete('set null');
        });

        // Drop the suppliers table since we're using current_accounts now
        Schema::dropIfExists('suppliers');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate suppliers table
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('Turkey');
            $table->string('tax_number')->nullable();
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->enum('payment_terms', ['cash', 'net_15', 'net_30', 'net_45', 'net_60', 'net_90'])->default('net_30');
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->string('currency', 3)->default('TRY');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Restore products table foreign key to suppliers
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('set null');
        });
    }
};
