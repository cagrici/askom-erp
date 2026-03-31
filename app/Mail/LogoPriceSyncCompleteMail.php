<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LogoPriceSyncCompleteMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $stats;
    public bool $success;
    public ?string $errorMessage;

    public function __construct(bool $success, array $stats = [], ?string $errorMessage = null)
    {
        $this->success = $success;
        $this->stats = $stats;
        $this->errorMessage = $errorMessage;
    }

    public function envelope(): Envelope
    {
        $subject = $this->success
            ? 'Logo Fiyat Senkronizasyonu Tamamlandı'
            : 'Logo Fiyat Senkronizasyonu Başarısız';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    protected function buildHtml(): string
    {
        $date = now()->format('d.m.Y H:i');

        if (!$this->success) {
            return "
                <h2>Logo Fiyat Senkronizasyonu Başarısız</h2>
                <p>Tarih: {$date}</p>
                <p style='color: red;'>Hata: {$this->errorMessage}</p>
            ";
        }

        $total = $this->stats['total'] ?? 0;
        $updated = $this->stats['updated'] ?? 0;
        $skipped = $this->stats['skipped'] ?? 0;
        $errors = isset($this->stats['errors']) && is_array($this->stats['errors'])
            ? count($this->stats['errors'])
            : 0;

        return "
            <h2>Logo Fiyat Senkronizasyonu Tamamlandı</h2>
            <p>Tarih: {$date}</p>
            <table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse;'>
                <tr><td><strong>Toplam İşlenen</strong></td><td>{$total}</td></tr>
                <tr><td><strong>Güncellenen</strong></td><td>{$updated}</td></tr>
                <tr><td><strong>Atlanan</strong></td><td>{$skipped}</td></tr>
                <tr><td><strong>Hata</strong></td><td>{$errors}</td></tr>
            </table>
        ";
    }
}
