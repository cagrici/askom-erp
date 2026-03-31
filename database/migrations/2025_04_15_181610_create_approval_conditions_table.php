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
        // Create approval conditions for dynamic approval routing
        Schema::create('approval_conditions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('approval_workflows')->onDelete('cascade');
            $table->string('field_name'); // amount, department_id, etc.
            $table->string('operator'); // >, <, =, !=, etc.
            $table->string('value');
            $table->foreignId('next_step_id')->constrained('approval_steps');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_conditions');
    }
};
