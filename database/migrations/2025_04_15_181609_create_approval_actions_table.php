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
        Schema::create('approval_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approval_request_id')->constrained()->onDelete('cascade');
            $table->foreignId('step_id')->constrained('approval_steps');
            $table->foreignId('user_id')->constrained(); // User who took the action
            $table->string('action'); // approved, rejected, delegated
            $table->text('comments')->nullable();
            $table->foreignId('delegated_to')->nullable()->constrained('users')->nullOnDelete();
            $table->json('changes')->nullable(); // If the approver made changes
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_actions');
    }
};
