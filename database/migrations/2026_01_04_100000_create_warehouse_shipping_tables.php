<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Depo, Sevkiyat ve Toplama sistemi tablolari
     * NOT: Vehicle ve Driver modelleri zaten mevcut, onlari kullaniyoruz.
     * Vehicle: vehicles tablosu (App\Models\Vehicle)
     * Driver: users tablosundan is_driver=true olanlar (App\Models\Driver extends User)
     */
    public function up(): void
    {
        // Sevk emirleri tablosu
        Schema::create('shipping_orders', function (Blueprint $table) {
            $table->id();
            $table->string('shipping_number', 50)->unique()->comment('Sevk emri numarasi');
            $table->foreignId('sales_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_id')->constrained('users')->comment('Olusturan (satisci)');
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete()
                ->comment('Sofor (is_driver=true olan user)');

            $table->enum('status', [
                'pending',           // Beklemede (depo listesinde)
                'picking_assigned',  // Toplama atandi
                'picking',           // Toplaniyor
                'ready_to_ship',     // Sevke hazir
                'shipped',           // Sevk edildi
                'delivered',         // Teslim edildi
                'cancelled'          // Iptal
            ])->default('pending');

            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');

            $table->date('requested_ship_date')->nullable()->comment('Istenen sevk tarihi');
            $table->datetime('shipped_at')->nullable();
            $table->datetime('delivered_at')->nullable();
            $table->datetime('cancelled_at')->nullable();
            $table->foreignId('cancelled_by_id')->nullable()->constrained('users');
            $table->string('cancellation_reason')->nullable();

            // Toplam bilgileri
            $table->integer('total_items')->default(0)->comment('Toplam kalem sayisi');
            $table->decimal('total_quantity', 12, 3)->default(0)->comment('Toplam miktar');
            $table->decimal('total_weight', 12, 3)->nullable()->comment('Toplam agirlik (kg)');
            $table->decimal('total_volume', 12, 3)->nullable()->comment('Toplam hacim (m3)');

            // Logo entegrasyonu
            $table->bigInteger('logo_dispatch_id')->nullable()->comment('Logo irsaliye ID');
            $table->string('logo_dispatch_number', 50)->nullable()->comment('Logo irsaliye no');
            $table->timestamp('logo_synced_at')->nullable();

            $table->text('notes')->nullable();
            $table->text('shipping_notes')->nullable()->comment('Sevkiyat notlari');
            $table->json('shipping_address')->nullable()->comment('Teslimat adresi');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
            $table->index('requested_ship_date');
        });

        // Sevk emri kalemleri
        Schema::create('shipping_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipping_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sales_order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();

            $table->decimal('ordered_quantity', 12, 3)->comment('Siparis miktari');
            $table->decimal('shipping_quantity', 12, 3)->comment('Sevk edilecek miktar');
            $table->decimal('picked_quantity', 12, 3)->default(0)->comment('Toplanan miktar');

            $table->enum('status', [
                'pending',     // Beklemede
                'picking',     // Toplaniyor
                'picked',      // Toplandi
                'shipped',     // Sevk edildi
                'cancelled'    // Iptal
            ])->default('pending');

            $table->string('corridor')->nullable()->comment('Koridor');
            $table->string('shelf')->nullable()->comment('Raf');
            $table->string('bin_location')->nullable()->comment('Konum kodu');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['shipping_order_id', 'status']);
        });

        // Toplama gorevleri
        Schema::create('picking_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('task_number', 50)->unique()->comment('Gorev numarasi');
            $table->foreignId('shipping_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to_id')->constrained('users')->comment('Atanan depo elemani');
            $table->foreignId('assigned_by_id')->constrained('users')->comment('Atayan depo yoneticisi');

            $table->enum('status', [
                'assigned',     // Atandi
                'in_progress',  // Devam ediyor
                'completed',    // Tamamlandi
                'cancelled'     // Iptal
            ])->default('assigned');

            $table->datetime('started_at')->nullable();
            $table->datetime('completed_at')->nullable();
            $table->datetime('cancelled_at')->nullable();

            $table->integer('total_items')->default(0);
            $table->integer('picked_items')->default(0);

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['assigned_to_id', 'status']);
            $table->index(['shipping_order_id', 'status']);
        });

        // Toplama gorev kalemleri (barkod okuma kayitlari)
        Schema::create('picking_task_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('picking_task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shipping_order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();

            $table->decimal('required_quantity', 12, 3)->comment('Toplanmasi gereken');
            $table->decimal('picked_quantity', 12, 3)->default(0)->comment('Toplanan');

            $table->enum('status', [
                'pending',      // Beklemede
                'in_progress',  // Toplaniyor
                'completed',    // Tamamlandi
                'partial',      // Kismi toplandi
                'skipped'       // Atlandi
            ])->default('pending');

            $table->string('corridor')->nullable();
            $table->string('shelf')->nullable();
            $table->string('bin_location')->nullable();

            $table->timestamps();

            $table->index(['picking_task_id', 'status']);
        });

        // Barkod okuma logları
        Schema::create('picking_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('picking_task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('picking_task_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->foreignId('scanned_by_id')->constrained('users');

            $table->string('barcode', 100)->comment('Okutulan barkod');
            $table->decimal('quantity', 12, 3)->default(1)->comment('Miktar');
            $table->enum('scan_result', ['success', 'wrong_product', 'wrong_order', 'not_found'])
                ->default('success');
            $table->string('error_message')->nullable();

            $table->string('corridor')->nullable();
            $table->string('shelf')->nullable();

            $table->timestamps();

            $table->index(['picking_task_id', 'created_at']);
        });

        // SalesOrder tablosuna yeni alanlar ekle
        Schema::table('sales_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_orders', 'shipping_status')) {
                $table->enum('shipping_status', [
                    'not_ready',        // Sevke hazir degil
                    'pending',          // Sevk bekliyor
                    'partially_shipped',// Kismi sevk
                    'shipped',          // Tam sevk
                    'delivered'         // Teslim edildi
                ])->default('not_ready')->after('status');
            }

            if (!Schema::hasColumn('sales_orders', 'total_shipped_quantity')) {
                $table->decimal('total_shipped_quantity', 12, 3)->default(0)
                    ->after('shipping_status')->comment('Toplam sevk edilen miktar');
            }
        });

        // SalesOrderItem tablosuna yeni alanlar ekle
        Schema::table('sales_order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_order_items', 'shipped_quantity')) {
                $table->decimal('shipped_quantity', 12, 3)->default(0)
                    ->after('delivered_quantity')->comment('Sevk edilen miktar');
            }

            if (!Schema::hasColumn('sales_order_items', 'reserved_quantity')) {
                $table->decimal('reserved_quantity', 12, 3)->default(0)
                    ->after('shipped_quantity')->comment('Rezerve edilen miktar');
            }

            if (!Schema::hasColumn('sales_order_items', 'corridor')) {
                $table->string('corridor', 20)->nullable()->after('notes')->comment('Koridor');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_order_items', function (Blueprint $table) {
            $columns = ['shipped_quantity', 'reserved_quantity', 'corridor'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('sales_order_items', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('sales_orders', function (Blueprint $table) {
            $columns = ['shipping_status', 'total_shipped_quantity'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('sales_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('picking_scans');
        Schema::dropIfExists('picking_task_items');
        Schema::dropIfExists('picking_tasks');
        Schema::dropIfExists('shipping_order_items');
        Schema::dropIfExists('shipping_orders');
    }
};
