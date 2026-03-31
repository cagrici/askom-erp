<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SalesRepresentative;
use Carbon\Carbon;

class SalesRepresentativeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $salesReps = [
            [
                'first_name' => 'Ahmet',
                'last_name' => 'Yılmaz',
                'email' => 'ahmet.yilmaz@askom.com',
                'phone' => '0212 555 0101',
                'mobile' => '0532 123 4567',
                'department' => 'Satış',
                'title' => 'Satış Müdürü',
                'employee_id' => 'EMP001',
                'commission_rate' => 3.50,
                'hire_date' => Carbon::parse('2020-01-15'),
                'notes' => 'Kurumsal müşteriler sorumlusu',
                'is_active' => true,
            ],
            [
                'first_name' => 'Fatma',
                'last_name' => 'Demir',
                'email' => 'fatma.demir@askom.com',
                'phone' => '0212 555 0102',
                'mobile' => '0535 987 6543',
                'department' => 'Satış',
                'title' => 'Kıdemli Satış Temsilcisi',
                'employee_id' => 'EMP002',
                'commission_rate' => 2.75,
                'hire_date' => Carbon::parse('2021-03-20'),
                'notes' => 'İstanbul Avrupa yakası sorumlusu',
                'is_active' => true,
            ],
            [
                'first_name' => 'Mehmet',
                'last_name' => 'Kaya',
                'email' => 'mehmet.kaya@askom.com',
                'phone' => '0212 555 0103',
                'mobile' => '0541 456 7890',
                'department' => 'Satış',
                'title' => 'Satış Temsilcisi',
                'employee_id' => 'EMP003',
                'commission_rate' => 2.25,
                'hire_date' => Carbon::parse('2022-06-10'),
                'notes' => 'İstanbul Anadolu yakası sorumlusu',
                'is_active' => true,
            ],
            [
                'first_name' => 'Zeynep',
                'last_name' => 'Özkan',
                'email' => 'zeynep.ozkan@askom.com',
                'phone' => '0312 555 0104',
                'mobile' => '0533 321 6547',
                'department' => 'Satış',
                'title' => 'Bölge Satış Müdürü',
                'employee_id' => 'EMP004',
                'commission_rate' => 4.00,
                'hire_date' => Carbon::parse('2019-09-05'),
                'notes' => 'Ankara ve çevre iller sorumlusu',
                'is_active' => true,
            ],
            [
                'first_name' => 'Ali',
                'last_name' => 'Çelik',
                'email' => 'ali.celik@askom.com',
                'phone' => '0232 555 0105',
                'mobile' => '0538 654 3210',
                'department' => 'Satış',
                'title' => 'Satış Temsilcisi',
                'employee_id' => 'EMP005',
                'commission_rate' => 2.50,
                'hire_date' => Carbon::parse('2023-02-14'),
                'notes' => 'İzmir ve Ege bölgesi sorumlusu',
                'is_active' => true,
            ],
            [
                'first_name' => 'Ayşe',
                'last_name' => 'Şahin',
                'email' => 'ayse.sahin@askom.com',
                'phone' => '0212 555 0106',
                'mobile' => '0542 789 0123',
                'department' => 'İhracat',
                'title' => 'İhracat Uzmanı',
                'employee_id' => 'EMP006',
                'commission_rate' => 3.25,
                'hire_date' => Carbon::parse('2021-11-08'),
                'notes' => 'Uluslararası müşteriler sorumlusu',
                'is_active' => true,
            ]
        ];

        foreach ($salesReps as $salesRep) {
            SalesRepresentative::create($salesRep);
        }
    }
}
