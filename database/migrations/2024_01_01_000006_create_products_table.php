<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('barcode')->nullable()->index();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('short_description')->nullable();
            $table->foreignId('category_id')->constrained('categories');
            $table->foreignId('brand_id')->nullable()->constrained('brands');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
            
            // Fiyat bilgileri
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('sale_price', 15, 2)->default(0);
            $table->decimal('wholesale_price', 15, 2)->nullable();
            $table->decimal('min_sale_price', 15, 2)->nullable();
            $table->integer('tax_rate')->default(18);
            $table->string('currency', 3)->default('TRY');
            
            // Stok bilgileri
            $table->string('sku')->unique();
            $table->integer('stock_quantity')->default(0);
            $table->integer('min_stock_level')->default(0);
            $table->integer('max_stock_level')->nullable();
            $table->boolean('track_inventory')->default(true);
            $table->boolean('allow_backorder')->default(false);
            
            // Fiziksel özellikler
            $table->decimal('weight', 10, 3)->nullable();
            $table->decimal('width', 10, 2)->nullable();
            $table->decimal('height', 10, 2)->nullable();
            $table->decimal('depth', 10, 2)->nullable();
            $table->decimal('volume', 10, 3)->nullable();
            $table->string('unit_of_measure')->default('adet');
            
            // Paketleme bilgileri
            $table->integer('items_per_package')->default(1);
            $table->integer('items_per_box')->nullable();
            $table->integer('boxes_per_pallet')->nullable();
            $table->string('package_type')->nullable();
            
            // Durum ve tip bilgileri
            $table->enum('product_type', ['simple', 'variable', 'bundle', 'grouped'])->default('simple');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_digital')->default(false);
            $table->boolean('is_new')->default(false);
            
            // SEO ve meta
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords')->nullable();
            
            // Diğer bilgiler
            $table->json('specifications')->nullable();
            $table->json('tags')->nullable();
            $table->integer('sort_order')->default(0);
            $table->string('country_of_origin')->nullable();
            $table->date('expiry_date')->nullable();
            $table->integer('warranty_period')->nullable();
            $table->text('warranty_info')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['category_id', 'is_active']);
            $table->index(['brand_id', 'is_active']);
            $table->index(['supplier_id', 'is_active']);
            $table->index(['product_type', 'is_active']);
            $table->index('stock_quantity');
            $table->fullText(['name', 'description']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('products');
    }
};