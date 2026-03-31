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
        Schema::create('contact_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });

        Schema::create('external_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('company')->nullable();
            $table->string('position')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('website')->nullable();
            $table->text('notes')->nullable();
            $table->string('photo_path')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->boolean('is_public')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('contact_group_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_group_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['contact_group_id', 'user_id']);
        });

        Schema::create('contact_group_external_contact', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_group_id')->constrained()->onDelete('cascade');
            $table->foreignId('external_contact_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['contact_group_id', 'external_contact_id'], 'contact_group_ext_contact_unique');
        });

        Schema::create('favorite_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->morphs('contactable'); // Can be user_id or external_contact_id
            $table->timestamps();

            $table->unique(['user_id', 'contactable_id', 'contactable_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorite_contacts');
        Schema::dropIfExists('contact_group_external_contact');
        Schema::dropIfExists('contact_group_user');
        Schema::dropIfExists('external_contacts');
        Schema::dropIfExists('contact_groups');
    }
};
