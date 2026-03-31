<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Check for overdue tasks every day at 9 AM
Schedule::command('tasks:send-overdue-notifications')->daily()->at('09:00')->withoutOverlapping()->runInBackground();
// Also check at 2 PM for urgent follow-ups
Schedule::command('tasks:send-overdue-notifications')->daily()->at('14:00')->withoutOverlapping()->runInBackground();
// ============================================
// Logo Tiger ERP Synchronization Schedule
// ============================================
// Sync inventory/stock hourly (incremental)
Schedule::command('logo:sync-inventory --incremental')->hourly()->withoutOverlapping()->runInBackground();
// Sync product prices every 4 hours (incremental)
Schedule::command('logo:sync-prices --firm=12 --incremental')->everyFourHours()->withoutOverlapping()->runInBackground();
// Ürün TL karşılıklarını Logo kur sync'inden sonra güncelle (15:30 + 5dk bekleme)
Schedule::command('products:update-try-prices')->dailyAt('15:35')->withoutOverlapping()->runInBackground();
// Sync products daily at 2 AM (full sync)
Schedule::command('logo:sync-products --firm=12')->dailyAt('02:00')->withoutOverlapping()->runInBackground();
// Sync customers/suppliers daily at 1 AM (full sync)
Schedule::command('logo:sync-current-accounts --firm=12')->dailyAt('01:00')->withoutOverlapping()->runInBackground();
// Sync orders every 30 minutes (incremental)
Schedule::command('logo:sync-orders --firm=12')->everyThirtyMinutes()->withoutOverlapping()->runInBackground();
// Sync product images weekly on Sunday at 3 AM (full sync)
Schedule::command('logo:sync-images --firm=12')->weeklyOn(0, '03:00')->withoutOverlapping()->runInBackground();
// Logo Tiger'dan döviz kurlarını her gün saat 08:00'da çek (Logo'daki güncel kurları al)
Schedule::command('logo:sync-exchange-rates --force')->dailyAt('08:00')->withoutOverlapping()->runInBackground();
// Öğleden sonra da bir kez daha çek (Logo'da gün içi kur güncellemelerini yakala)
Schedule::command('logo:sync-exchange-rates --force')->dailyAt('15:30')->withoutOverlapping()->runInBackground();
// Yeni eklenen ürünleri Logo'dan otomatik çek (10 dakikada bir)
Schedule::command('logo:sync-new-products --firm=12')->everyTenMinutes()->withoutOverlapping()->runInBackground();
// cari bakiyelerini al
Schedule::command('logo:sync-balances')->hourly()->withoutOverlapping()->runInBackground();
