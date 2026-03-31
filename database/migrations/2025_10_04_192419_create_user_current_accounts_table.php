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
        Schema::create('user_current_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('current_account_id')->constrained('current_accounts')->onDelete('cascade');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            // Ensure unique user-account combinations
            $table->unique(['user_id', 'current_account_id']);

            // Index for faster queries
            $table->index(['user_id', 'is_default']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_current_accounts');
    }
};
