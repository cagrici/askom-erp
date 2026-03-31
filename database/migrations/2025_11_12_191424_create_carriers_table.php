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
        Schema::create('carriers', function (Blueprint $table) {
            $table->id();
            $table->string('carrier_code')->unique();
            $table->string('company_name');
            $table->string('trade_name')->nullable();

            // Contact Information
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();

            // Address
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->default('TR');

            // Business Information
            $table->string('tax_office')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('registration_number')->nullable();

            // Service Information
            $table->enum('carrier_type', ['road', 'air', 'sea', 'rail', 'multimodal'])->default('road');
            $table->json('service_areas')->nullable(); // Cities/regions they serve
            $table->json('vehicle_types')->nullable(); // Types of vehicles available
            $table->integer('fleet_size')->nullable();

            // Rating and Performance
            $table->decimal('rating', 3, 2)->nullable(); // 0-5 stars
            $table->integer('total_shipments')->default(0);
            $table->integer('on_time_deliveries')->default(0);
            $table->decimal('on_time_percentage', 5, 2)->nullable();

            // Pricing
            $table->string('currency', 3)->default('TRY');
            $table->decimal('base_rate_per_km', 10, 2)->nullable();
            $table->decimal('min_charge', 10, 2)->nullable();
            $table->text('pricing_notes')->nullable();

            // Insurance and Certifications
            $table->string('insurance_company')->nullable();
            $table->string('insurance_policy_number')->nullable();
            $table->date('insurance_expiry_date')->nullable();
            $table->json('certifications')->nullable(); // ISO, etc.

            // Contract Information
            $table->enum('contract_type', ['permanent', 'temporary', 'spot'])->default('permanent');
            $table->date('contract_start_date')->nullable();
            $table->date('contract_end_date')->nullable();
            $table->text('contract_terms')->nullable();

            // Payment Terms
            $table->integer('payment_terms_days')->default(30); // Net 30, etc.
            $table->enum('payment_method', ['bank_transfer', 'check', 'cash', 'credit_card'])->default('bank_transfer');

            // Bank Information
            $table->string('bank_name')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('iban')->nullable();
            $table->string('swift_code')->nullable();

            // Status and Preferences
            $table->enum('status', ['active', 'inactive', 'suspended', 'blacklisted'])->default('active');
            $table->boolean('is_preferred')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->integer('priority_level')->default(0); // Higher = more preferred

            // Additional Information
            $table->text('notes')->nullable();
            $table->text('special_requirements')->nullable();
            $table->json('working_hours')->nullable();

            // Tracking
            $table->timestamp('last_shipment_date')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('carrier_code');
            $table->index('company_name');
            $table->index('status');
            $table->index('carrier_type');
            $table->index('is_preferred');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('carriers');
    }
};
