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
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('original_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->string('extension');
            $table->bigInteger('size'); // Size in bytes
            $table->string('file_type')->nullable(); // Documents, Media, etc.
            $table->foreignId('folder_id')->nullable()->constrained('file_folders')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->boolean('is_public')->default(false);
            $table->boolean('is_favorite')->default(false);
            $table->integer('download_count')->default(0);
            $table->dateTime('last_accessed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
