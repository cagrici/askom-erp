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
        Schema::table('currencies', function (Blueprint $table) {
            $table->string('name')->after('cur_code')->nullable();
            $table->decimal('exchange_rate', 15, 6)->after('cur_symbol')->default(1.000000);
            $table->boolean('is_default')->after('is_active')->default(false);
            $table->integer('decimal_places')->after('is_default')->default(2);
            $table->string('thousand_separator', 10)->after('decimal_places')->default(',');
            $table->string('decimal_separator', 10)->after('thousand_separator')->default('.');
            $table->enum('symbol_position', ['before', 'after'])->after('decimal_separator')->default('before');
            $table->timestamp('last_updated_at')->after('symbol_position')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('cur_code');
            $table->index('is_active');
            $table->index('is_default');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('currencies', function (Blueprint $table) {
            $table->dropIndex(['cur_code']);
            $table->dropIndex(['is_active']);
            $table->dropIndex(['is_default']);
            $table->dropColumn([
                'name',
                'exchange_rate',
                'is_default',
                'decimal_places',
                'thousand_separator',
                'decimal_separator',
                'symbol_position',
                'last_updated_at',
                'created_at',
                'updated_at'
            ]);
        });
    }
};
