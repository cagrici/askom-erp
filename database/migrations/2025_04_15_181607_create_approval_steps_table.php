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
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('approval_workflows')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('order')->default(1);
            $table->string('approval_type'); // user, role, department_head, manager
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete(); // Used when approval_type is 'user'
            $table->foreignId('role_id')->nullable()->constrained()->nullOnDelete(); // Used when approval_type is 'role'
            $table->boolean('requires_all_in_role')->default(false); // If true, all users with the role must approve
            $table->integer('approval_timeout_hours')->nullable(); // Auto-approve after X hours
            $table->boolean('can_edit')->default(false); // If true, approver can edit the request
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_steps');
    }
};
