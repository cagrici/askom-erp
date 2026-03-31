<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_offer_email_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_offer_id')->constrained()->cascadeOnDelete();
            $table->string('sent_to');
            $table->string('attachment_type', 10);
            $table->text('custom_message')->nullable();
            $table->string('status', 20)->default('sent');
            $table->string('error_message')->nullable();
            $table->string('tracking_hash', 64)->nullable()->unique();
            $table->timestamp('opened_at')->nullable();
            $table->integer('open_count')->default(0);
            $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('sales_offer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_offer_email_logs');
    }
};
