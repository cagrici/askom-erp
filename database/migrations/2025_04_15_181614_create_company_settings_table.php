<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add company settings table
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->string('company_legal_name')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('company_email')->nullable();
            $table->string('company_phone')->nullable();
            $table->string('company_address')->nullable();
            $table->string('company_website')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('favicon_path')->nullable();
            $table->string('primary_color')->nullable()->default('#3490dc');
            $table->string('secondary_color')->nullable()->default('#6574cd');
            $table->string('currency')->default('TRY');
            $table->string('timezone')->default('Europe/Istanbul');
            $table->string('date_format')->default('Y-m-d');
            $table->string('time_format')->default('H:i');
            $table->string('fiscal_year_start')->default('01-01');
            $table->string('default_language')->default('tr');
            $table->text('smtp_settings')->nullable(); // JSON encoded SMTP settings
            $table->text('footer_text')->nullable();
            $table->boolean('maintenance_mode')->default(false);
            $table->json('available_modules')->nullable(); // Enabled modules
            $table->json('company_social_media')->nullable(); // Social media links
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};
