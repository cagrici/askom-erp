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
        // Create approval delegations for when users are out of office
        Schema::create('approval_delegations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained(); // User delegating their approval authority
            $table->foreignId('delegate_id')->constrained('users'); // User receiving the delegation
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('workflow_id')->nullable()->constrained('approval_workflows')->nullOnDelete(); // If null, applies to all workflows
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_delegations');
    }
};
