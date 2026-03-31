<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_offers', function (Blueprint $table) {
            $table->foreignId('pipeline_stage_id')->nullable()->after('status')->constrained('pipeline_stages')->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->after('entity_id')->constrained('leads')->nullOnDelete();
            $table->decimal('weighted_value', 15, 2)->nullable()->after('total_amount');
            $table->datetime('stage_entered_at')->nullable()->after('weighted_value');
            $table->integer('days_in_stage')->default(0)->after('stage_entered_at');
        });
    }

    public function down(): void
    {
        Schema::table('sales_offers', function (Blueprint $table) {
            $table->dropForeign(['pipeline_stage_id']);
            $table->dropForeign(['lead_id']);
            $table->dropColumn(['pipeline_stage_id', 'lead_id', 'weighted_value', 'stage_entered_at', 'days_in_stage']);
        });
    }
};
