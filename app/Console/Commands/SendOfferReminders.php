<?php

namespace App\Console\Commands;

use App\Mail\SalesOfferMail;
use App\Models\SalesOffer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendOfferReminders extends Command
{
    protected $signature = 'offers:send-reminders {--days=3 : Send reminder after X days without response}';
    protected $description = 'Send reminder emails for offers awaiting customer response';

    public function handle()
    {
        $days = (int) $this->option('days');

        $offers = SalesOffer::with(['items.product.images', 'items.unit', 'entity', 'currency'])
            ->where('email_sent_count', '>', 0)
            ->whereIn('status', ['sent', 'draft'])
            ->where('valid_until_date', '>=', now())
            ->where('email_sent_at', '<=', now()->subDays($days))
            ->get();

        $sent = 0;
        $failed = 0;

        foreach ($offers as $offer) {
            $email = $offer->getRecipientEmail();
            if (!$email) {
                continue;
            }

            try {
                if (!$offer->isApprovalTokenValid()) {
                    $offer->generateApprovalToken(30);
                }

                $reminderMessage = "Daha once gonderdigimiz {$offer->offer_no} numarali teklifimiz hakkinda bilgi almak istiyoruz. Teklifimiz {$offer->valid_until_date->format('d.m.Y')} tarihine kadar gecerlidir.";

                $pdf = PDF::loadView('pdf.sales-offer', ['offer' => $offer]);
                $attachmentContent = $pdf->output();

                $emailLog = $offer->recordEmailSent($email, 'pdf', $reminderMessage);
                $trackingPixelUrl = $emailLog->getTrackingPixelUrl();

                Mail::to($email)->send(new SalesOfferMail(
                    $offer,
                    $reminderMessage,
                    $attachmentContent,
                    'pdf',
                    $offer->getApprovalUrl(),
                    $trackingPixelUrl
                ));

                $sent++;
                $this->info("Hatirlatma gonderildi: {$offer->offer_no} -> {$email}");
            } catch (\Exception $e) {
                $failed++;
                $offer->recordEmailFailed($email, 'pdf', $e->getMessage(), $reminderMessage ?? null);
                $this->error("Hata: {$offer->offer_no} -> {$e->getMessage()}");
            }
        }

        $this->info("Tamamlandi. Gonderilen: {$sent}, Basarisiz: {$failed}");
    }
}
