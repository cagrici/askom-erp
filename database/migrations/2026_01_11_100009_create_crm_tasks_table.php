<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_tasks', function (Blueprint $table) {
            $table->id();

            // Polymorphic relationship
            $table->morphs('subject');

            // Task Details
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['call', 'email', 'meeting', 'follow_up', 'proposal', 'demo', 'visit', 'other'])->default('follow_up');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');

            // Timing
            $table->datetime('due_date');
            $table->datetime('reminder_date')->nullable();
            $table->boolean('reminder_sent')->default(false);
            $table->datetime('completed_at')->nullable();

            // Assignment
            $table->foreignId('assigned_to')->constrained('users');
            $table->foreignId('completed_by')->nullable()->constrained('users');

            // Notes
            $table->text('completion_notes')->nullable();

            // Audit
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Indexes (morphs already creates subject_type + subject_id index)
            $table->index(['assigned_to', 'status', 'due_date']);
            $table->index(['status', 'due_date']);
            $table->index('reminder_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_tasks');
    }
};
