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
        Schema::table('current_accounts', function (Blueprint $table) {
            // Check and add CRM fields only if they don't exist
            if (!Schema::hasColumn('current_accounts', 'employee_count')) {
                $table->integer('employee_count')->nullable()->after('trade_registry_no');
            }

            if (!Schema::hasColumn('current_accounts', 'annual_revenue')) {
                $table->decimal('annual_revenue', 15, 2)->nullable()->after('employee_count');
            }

            if (!Schema::hasColumn('current_accounts', 'establishment_year')) {
                $table->year('establishment_year')->nullable()->after('annual_revenue');
            }

            // Check and add foreign key references if they don't exist
            if (!Schema::hasColumn('current_accounts', 'country_id')) {
                $table->foreignId('country_id')->nullable()->after('country')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('current_accounts', 'city_id')) {
                $table->foreignId('city_id')->nullable()->after('city')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('current_accounts', 'district_id')) {
                $table->foreignId('district_id')->nullable()->after('district')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('current_accounts', 'tax_office_id')) {
                $table->foreignId('tax_office_id')->nullable()->after('tax_office')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('current_accounts', 'payment_term_id')) {
                $table->foreignId('payment_term_id')->nullable()->after('payment_term_days')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('current_accounts', 'payment_method_id')) {
                $table->foreignId('payment_method_id')->nullable()->after('payment_term_id')->constrained()->nullOnDelete();
            }

            // Check and add sales representative foreign key
            if (!Schema::hasColumn('current_accounts', 'sales_representative_id')) {
                $table->foreignId('sales_representative_id')->nullable()->after('region')->constrained()->nullOnDelete();
            }
            
            // Check and add other CRM fields
            if (!Schema::hasColumn('current_accounts', 'lead_source')) {
                $table->string('lead_source', 100)->nullable()->after('sales_representative_id');
            }

            if (!Schema::hasColumn('current_accounts', 'customer_segment')) {
                $table->string('customer_segment', 50)->nullable()->after('lead_source');
            }

            if (!Schema::hasColumn('current_accounts', 'preferred_language')) {
                $table->string('preferred_language', 10)->default('tr')->after('customer_segment');
            }

            if (!Schema::hasColumn('current_accounts', 'additional_contacts')) {
                $table->json('additional_contacts')->nullable()->after('contact_email');
            }

            if (!Schema::hasColumn('current_accounts', 'communication_preferences')) {
                $table->json('communication_preferences')->nullable()->after('additional_contacts');
            }

            if (!Schema::hasColumn('current_accounts', 'crm_notes')) {
                $table->text('crm_notes')->nullable()->after('communication_preferences');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('current_accounts', function (Blueprint $table) {
            $columnsToCheck = [
                'employee_count', 'annual_revenue', 'establishment_year',
                'country_id', 'city_id', 'district_id', 'tax_office_id',
                'payment_term_id', 'payment_method_id', 'sales_representative_id',
                'lead_source', 'customer_segment', 'preferred_language', 
                'additional_contacts', 'communication_preferences', 'crm_notes'
            ];

            foreach ($columnsToCheck as $column) {
                if (Schema::hasColumn('current_accounts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
