<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('tax_office')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('TR');
            $table->string('contact_person')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->integer('payment_term_days')->default(0);
            $table->enum('supplier_type', ['manufacturer', 'distributor', 'importer', 'other'])->default('distributor');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->json('bank_accounts')->nullable();
            $table->timestamps();
            
            $table->index(['code', 'is_active']);
            $table->index('name');
        });
    }

    public function down()
    {
        Schema::dropIfExists('suppliers');
    }
};