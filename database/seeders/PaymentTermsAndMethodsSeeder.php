<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PaymentTermsAndMethodsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Payment Terms
        $paymentTerms = [
            [
                'name' => 'Peşin',
                'code' => 'CASH',
                'days' => 0,
                'type' => 'net',
                'discount_percentage' => 0,
                'discount_days' => 0,
                'description' => 'Peşin ödeme',
                'is_active' => true,
                'is_default' => true,
                'sort_order' => 1
            ],
            [
                'name' => '15 Gün Vade',
                'code' => 'NET15',
                'days' => 15,
                'type' => 'net',
                'discount_percentage' => 0,
                'discount_days' => 0,
                'description' => '15 gün vadeli ödeme',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 2
            ],
            [
                'name' => '30 Gün Vade',
                'code' => 'NET30',
                'days' => 30,
                'type' => 'net',
                'discount_percentage' => 0,
                'discount_days' => 0,
                'description' => '30 gün vadeli ödeme',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 3
            ],
            [
                'name' => '45 Gün Vade',
                'code' => 'NET45',
                'days' => 45,
                'type' => 'net',
                'discount_percentage' => 0,
                'discount_days' => 0,
                'description' => '45 gün vadeli ödeme',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 4
            ],
            [
                'name' => '60 Gün Vade',
                'code' => 'NET60',
                'days' => 60,
                'type' => 'net',
                'discount_percentage' => 0,
                'discount_days' => 0,
                'description' => '60 gün vadeli ödeme',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 5
            ],
            [
                'name' => '90 Gün Vade',
                'code' => 'NET90',
                'days' => 90,
                'type' => 'net',
                'discount_percentage' => 0,
                'discount_days' => 0,
                'description' => '90 gün vadeli ödeme',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 6
            ],
            [
                'name' => '2/10 Net 30',
                'code' => '2_10_NET30',
                'days' => 30,
                'type' => 'net',
                'discount_percentage' => 2.00,
                'discount_days' => 10,
                'description' => '10 gün içinde ödenirse %2 iskonto, aksi halde 30 gün vade',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 7
            ],
            [
                'name' => 'Kapıda Ödeme',
                'code' => 'COD',
                'days' => 0,
                'type' => 'cod',
                'discount_percentage' => 0,
                'discount_days' => 0,
                'description' => 'Teslimat sırasında ödeme',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 8
            ],
            [
                'name' => '%50 Avans',
                'code' => 'ADVANCE50',
                'days' => 0,
                'type' => 'advance',
                'discount_percentage' => 0,
                'discount_days' => 0,
                'description' => '%50 avans, kalan teslimatla',
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 9
            ]
        ];

        foreach ($paymentTerms as $term) {
            DB::table('payment_terms')->insertOrIgnore($term);
        }

        // Payment Methods
        $paymentMethods = [
            [
                'name' => 'Nakit',
                'code' => 'CASH',
                'type' => 'cash',
                'description' => 'Nakit ödeme',
                'settings' => json_encode([]),
                'requires_bank_account' => false,
                'is_active' => true,
                'is_default' => true,
                'sort_order' => 1
            ],
            [
                'name' => 'Kredi Kartı',
                'code' => 'CREDIT_CARD',
                'type' => 'card',
                'description' => 'Kredi kartı ile ödeme',
                'settings' => json_encode(['commission_rate' => 2.5]),
                'requires_bank_account' => false,
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 2
            ],
            [
                'name' => 'Banka Kartı',
                'code' => 'DEBIT_CARD',
                'type' => 'card',
                'description' => 'Banka kartı ile ödeme',
                'settings' => json_encode(['commission_rate' => 1.5]),
                'requires_bank_account' => false,
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 3
            ],
            [
                'name' => 'Havale/EFT',
                'code' => 'BANK_TRANSFER',
                'type' => 'bank_transfer',
                'description' => 'Banka havalesi veya EFT',
                'settings' => json_encode([]),
                'requires_bank_account' => true,
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 4
            ],
            [
                'name' => 'Çek',
                'code' => 'CHECK',
                'type' => 'check',
                'description' => 'Çek ile ödeme',
                'settings' => json_encode([]),
                'requires_bank_account' => false,
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 5
            ],
            [
                'name' => 'Senet',
                'code' => 'PROMISSORY_NOTE',
                'type' => 'promissory_note',
                'description' => 'Senet ile ödeme',
                'settings' => json_encode([]),
                'requires_bank_account' => false,
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 6
            ],
            [
                'name' => 'Akreditif',
                'code' => 'LETTER_OF_CREDIT',
                'type' => 'other',
                'description' => 'Akreditif ile ödeme',
                'settings' => json_encode([]),
                'requires_bank_account' => true,
                'is_active' => true,
                'is_default' => false,
                'sort_order' => 7
            ]
        ];

        foreach ($paymentMethods as $method) {
            DB::table('payment_methods')->insertOrIgnore($method);
        }

        // Sample bank accounts (skip if table doesn't exist)
        if (Schema::hasTable('bank_accounts')) {
            $bankAccounts = [
                [
                    'account_name' => 'Ana İşletme Hesabı',
                    'bank_name' => 'Türkiye İş Bankası',
                    'branch_name' => 'Kadıköy Şubesi',
                    'branch_code' => '1234',
                    'account_number' => '12345678901',
                    'iban' => 'TR330006400000112345678901',
                    'swift_code' => 'ISCBTR2A',
                    'currency' => 'TRY',
                    'account_type' => 'business',
                    'description' => 'Ana işletme hesabı - TL',
                    'is_active' => true,
                    'is_default' => true
                ],
                [
                    'account_name' => 'Döviz Hesabı USD',
                    'bank_name' => 'Garanti BBVA',
                    'branch_name' => 'Beşiktaş Şubesi',
                    'branch_code' => '5678',
                    'account_number' => '98765432109',
                    'iban' => 'TR630062000000098765432109',
                    'swift_code' => 'TGBATRIS',
                    'currency' => 'USD',
                    'account_type' => 'business',
                    'description' => 'Döviz hesabı - USD',
                    'is_active' => true,
                    'is_default' => false
                ],
                [
                    'account_name' => 'Döviz Hesabı EUR',
                    'bank_name' => 'Yapı Kredi Bankası',
                    'branch_name' => 'Şişli Şubesi',
                    'branch_code' => '9012',
                    'account_number' => '11223344556',
                    'iban' => 'TR670006700000011223344556',
                    'swift_code' => 'YAPITRIS',
                    'currency' => 'EUR',
                    'account_type' => 'business',
                    'description' => 'Döviz hesabı - EUR',
                    'is_active' => true,
                    'is_default' => false
                ]
            ];

            foreach ($bankAccounts as $account) {
                DB::table('bank_accounts')->insertOrIgnore($account);
            }
        }
    }
}