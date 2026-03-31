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
        Schema::create('integrations', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Integration name (e.g., "Logo Tiger", "İyzico")
            $table->string('code')->unique(); // Unique code (e.g., "logo_tiger", "iyzico")
            $table->string('type'); // Type (e.g., "accounting", "payment", "shipping")
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(false);
            $table->boolean('is_configured')->default(false);
            $table->json('config')->nullable(); // Configuration settings (encrypted)
            $table->json('sync_settings')->nullable(); // Sync direction and entities
            $table->timestamp('last_sync_at')->nullable();
            $table->string('last_sync_status')->nullable(); // success, failed, partial
            $table->text('last_sync_message')->nullable();
            $table->integer('sync_count')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('code');
            $table->index('type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integrations');
    }
};
