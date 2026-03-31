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
        Schema::create('sales_targets', function (Blueprint $table) {
            $table->id();

            // Basic Information
            $table->string('name')->comment('Hedef Adı');
            $table->string('code', 50)->unique()->comment('Hedef Kodu');
            $table->text('description')->nullable()->comment('Açıklama');

            // Period
            $table->date('start_date')->comment('Başlangıç Tarihi');
            $table->date('end_date')->comment('Bitiş Tarihi');
            $table->enum('period_type', ['monthly', 'quarterly', 'yearly', 'custom'])->comment('Dönem Tipi');
            $table->integer('year')->comment('Yıl');
            $table->integer('month')->nullable()->comment('Ay (1-12)');
            $table->integer('quarter')->nullable()->comment('Çeyrek (1-4)');

            // Assignment
            $table->enum('assignment_type', ['salesperson', 'team', 'department', 'location', 'company'])->comment('Atama Tipi');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()->comment('Satış Temsilcisi');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete()->comment('Departman');
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete()->comment('Lokasyon');

            // Target Metrics
            $table->decimal('revenue_target', 15, 2)->default(0)->comment('Ciro Hedefi (TL)');
            $table->integer('quantity_target')->default(0)->comment('Adet Hedefi');
            $table->integer('order_target')->default(0)->comment('Sipariş Sayısı Hedefi');
            $table->integer('new_customer_target')->default(0)->comment('Yeni Müşteri Hedefi');

            // Actual Performance (calculated from orders)
            $table->decimal('actual_revenue', 15, 2)->default(0)->comment('Gerçekleşen Ciro');
            $table->integer('actual_quantity')->default(0)->comment('Gerçekleşen Adet');
            $table->integer('actual_orders')->default(0)->comment('Gerçekleşen Sipariş');
            $table->integer('actual_new_customers')->default(0)->comment('Gerçekleşen Yeni Müşteri');

            // Achievement Percentages
            $table->decimal('revenue_achievement', 5, 2)->default(0)->comment('Ciro Başarı Oranı (%)');
            $table->decimal('quantity_achievement', 5, 2)->default(0)->comment('Adet Başarı Oranı (%)');
            $table->decimal('order_achievement', 5, 2)->default(0)->comment('Sipariş Başarı Oranı (%)');
            $table->decimal('new_customer_achievement', 5, 2)->default(0)->comment('Yeni Müşteri Başarı Oranı (%)');
            $table->decimal('overall_achievement', 5, 2)->default(0)->comment('Genel Başarı Oranı (%)');

            // Weights for overall calculation
            $table->integer('revenue_weight')->default(40)->comment('Ciro Ağırlığı (%)');
            $table->integer('quantity_weight')->default(30)->comment('Adet Ağırlığı (%)');
            $table->integer('order_weight')->default(20)->comment('Sipariş Ağırlığı (%)');
            $table->integer('new_customer_weight')->default(10)->comment('Yeni Müşteri Ağırlığı (%)');

            // Status
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active')->comment('Durum');
            $table->boolean('is_active')->default(true)->comment('Aktif mi?');

            // Rewards/Bonuses
            $table->decimal('bonus_amount', 15, 2)->nullable()->comment('Bonus Tutarı');
            $table->decimal('bonus_percentage', 5, 2)->nullable()->comment('Bonus Yüzdesi');
            $table->text('bonus_conditions')->nullable()->comment('Bonus Koşulları');

            // Notes
            $table->text('notes')->nullable()->comment('Notlar');

            // Last calculation
            $table->timestamp('last_calculated_at')->nullable()->comment('Son Hesaplama Zamanı');

            // Audit Fields
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('code');
            $table->index('period_type');
            $table->index('year');
            $table->index('assignment_type');
            $table->index('user_id');
            $table->index('status');
            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_targets');
    }
};
