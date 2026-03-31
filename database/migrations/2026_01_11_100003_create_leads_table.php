<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('lead_no')->unique();

            // Contact Information
            $table->string('company_name')->nullable();
            $table->string('contact_name');
            $table->string('contact_title')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->string('website')->nullable();

            // Address
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('district')->nullable();
            $table->string('country')->nullable()->default('Türkiye');
            $table->string('postal_code')->nullable();

            // Business Information
            $table->string('industry')->nullable();
            $table->string('company_size')->nullable();
            $table->decimal('estimated_value', 15, 2)->nullable();
            $table->string('currency', 3)->default('TRY');

            // CRM Classification
            $table->foreignId('lead_stage_id')->constrained('lead_stages');
            $table->foreignId('lead_source_id')->nullable()->constrained('lead_sources')->nullOnDelete();
            $table->integer('lead_score')->default(0);
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->json('tags')->nullable();

            // Assignment
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('sales_representative_id')->nullable()->constrained('sales_representatives')->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();

            // Dates
            $table->date('expected_close_date')->nullable();
            $table->datetime('last_contact_at')->nullable();
            $table->datetime('next_follow_up_at')->nullable();

            // Conversion
            $table->foreignId('converted_account_id')->nullable()->constrained('current_accounts')->nullOnDelete();
            $table->datetime('converted_at')->nullable();
            $table->foreignId('converted_by')->nullable()->constrained('users')->nullOnDelete();

            // Notes
            $table->text('notes')->nullable();
            $table->text('requirements')->nullable();
            $table->text('lost_reason')->nullable();

            // Audit
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['lead_stage_id', 'assigned_to']);
            $table->index(['location_id', 'created_at']);
            $table->index('lead_score');
            $table->index('expected_close_date');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
