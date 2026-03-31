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
        Schema::create('barcodes', function (Blueprint $table) {
            $table->id();
            $table->string('barcode')->unique();
            $table->string('barcode_type')->default('CODE128'); // CODE128, EAN13, QR, etc.
            
            // Entity information
            $table->string('entity_type'); // inventory_item, inventory_stock, warehouse_location, etc.
            $table->unsignedBigInteger('entity_id');
            $table->json('entity_data')->nullable(); // Additional data encoded in barcode
            
            // Barcode specifications
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->integer('dpi')->default(300);
            $table->string('format')->default('PNG'); // PNG, JPG, SVG, PDF
            
            // Generation information
            $table->boolean('is_primary')->default(false); // Primary barcode for entity
            $table->boolean('is_active')->default(true);
            $table->string('purpose')->nullable(); // identification, tracking, shipping, etc.
            
            // Print settings
            $table->string('label_template')->nullable();
            $table->json('print_settings')->nullable();
            $table->integer('times_printed')->default(0);
            $table->timestamp('last_printed_at')->nullable();
            
            // Scan tracking
            $table->integer('scan_count')->default(0);
            $table->timestamp('last_scanned_at')->nullable();
            $table->foreignId('last_scanned_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Validation and security
            $table->string('check_digit')->nullable();
            $table->string('validation_algorithm')->nullable();
            $table->boolean('requires_validation')->default(false);
            
            // File storage
            $table->string('image_path')->nullable();
            $table->string('pdf_path')->nullable();
            $table->string('svg_path')->nullable();
            
            // Expiry and lifecycle
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->enum('status', ['active', 'inactive', 'expired', 'damaged', 'replaced'])->default('active');
            $table->text('notes')->nullable();
            
            // Replacement tracking
            $table->foreignId('replaced_by_id')->nullable()->constrained('barcodes')->onDelete('set null');
            $table->foreignId('replaces_id')->nullable()->constrained('barcodes')->onDelete('set null');
            
            // Custom fields
            $table->json('custom_attributes')->nullable();
            
            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['entity_type', 'entity_id']);
            $table->index(['barcode_type']);
            $table->index(['is_primary', 'is_active']);
            $table->index(['status']);
            $table->index(['valid_from', 'valid_until']);
            $table->index(['scan_count']);
            $table->index(['last_scanned_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barcodes');
    }
};