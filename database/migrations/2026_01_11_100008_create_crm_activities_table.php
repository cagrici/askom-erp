<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_activities', function (Blueprint $table) {
            $table->id();

            // Polymorphic relationship (Lead, CurrentAccount, SalesOffer)
            $table->morphs('subject');

            // Activity Details
            $table->enum('type', ['call', 'email', 'meeting', 'note', 'sms', 'visit', 'demo', 'other']);
            $table->string('title');
            $table->text('description')->nullable();

            // For calls/meetings
            $table->datetime('activity_date');
            $table->datetime('end_date')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->enum('direction', ['inbound', 'outbound'])->nullable();

            // For emails
            $table->string('email_subject')->nullable();
            $table->text('email_body')->nullable();

            // Outcome
            $table->string('outcome')->nullable();
            $table->text('outcome_notes')->nullable();

            // Location for meetings/visits
            $table->string('meeting_location')->nullable();
            $table->text('meeting_address')->nullable();

            // Related entities
            $table->unsignedBigInteger('contact_id')->nullable();
            $table->foreignId('sales_offer_id')->nullable()->constrained('sales_offers')->nullOnDelete();

            // Assignment and Audit
            $table->foreignId('performed_by')->constrained('users');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Indexes (morphs already creates subject_type + subject_id index)
            $table->index(['type', 'activity_date']);
            $table->index('performed_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_activities');
    }
};
