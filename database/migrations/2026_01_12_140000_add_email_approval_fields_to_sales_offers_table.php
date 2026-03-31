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
        Schema::table('sales_offers', function (Blueprint $table) {
            // Approval token for customer approval via link
            $table->string('approval_token', 64)->nullable()->unique()->after('status');
            $table->timestamp('approval_token_expires_at')->nullable()->after('approval_token');

            // Email tracking
            $table->timestamp('email_sent_at')->nullable()->after('approval_token_expires_at');
            $table->string('email_sent_to')->nullable()->after('email_sent_at');
            $table->string('email_attachment_type')->nullable()->after('email_sent_to'); // pdf or excel
            $table->integer('email_sent_count')->default(0)->after('email_attachment_type');

            // Customer approval via link
            $table->timestamp('customer_approved_at')->nullable()->after('email_sent_count');
            $table->string('customer_approved_ip')->nullable()->after('customer_approved_at');
            $table->text('customer_approval_notes')->nullable()->after('customer_approved_ip');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_offers', function (Blueprint $table) {
            $table->dropColumn([
                'approval_token',
                'approval_token_expires_at',
                'email_sent_at',
                'email_sent_to',
                'email_attachment_type',
                'email_sent_count',
                'customer_approved_at',
                'customer_approved_ip',
                'customer_approval_notes',
            ]);
        });
    }
};
