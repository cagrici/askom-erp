<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_offer_stage_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_offer_id')->constrained('sales_offers')->cascadeOnDelete();
            $table->foreignId('from_stage_id')->nullable()->constrained('pipeline_stages')->nullOnDelete();
            $table->foreignId('to_stage_id')->constrained('pipeline_stages');
            $table->text('notes')->nullable();
            $table->foreignId('changed_by')->constrained('users');
            $table->timestamps();

            $table->index(['sales_offer_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_offer_stage_history');
    }
};
