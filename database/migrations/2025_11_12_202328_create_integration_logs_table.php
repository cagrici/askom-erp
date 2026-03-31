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
        Schema::create('integration_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_id')->constrained()->onDelete('cascade');
            $table->string('action'); // sync, test, export, import
            $table->string('entity_type')->nullable(); // current_accounts, products, invoices, etc.
            $table->string('status'); // success, failed, partial, in_progress
            $table->integer('records_processed')->default(0);
            $table->integer('records_success')->default(0);
            $table->integer('records_failed')->default(0);
            $table->text('message')->nullable();
            $table->json('errors')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['integration_id', 'created_at']);
            $table->index('status');
            $table->index('entity_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integration_logs');
    }
};
