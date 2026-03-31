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
        Schema::create('file_folders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('path')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('file_folders')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->boolean('is_public')->default(false);
            $table->integer('files_count')->default(0);
            $table->bigInteger('size')->default(0); // Size in bytes
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('file_folders');
    }
};
