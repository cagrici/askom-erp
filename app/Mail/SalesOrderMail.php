<?php

namespace App\Mail;

use App\Models\SalesOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class SalesOrderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public SalesOrder $salesOrder;
    public ?string $customMessage;
    public ?string $pdfContent;

    /**
     * Create a new message instance.
     */
    public function __construct(SalesOrder $salesOrder, ?string $customMessage = null, ?string $pdfContent = null)
    {
        $this->salesOrder = $salesOrder;
        $this->customMessage = $customMessage;
        $this->pdfContent = $pdfContent ? base64_encode($pdfContent) : null;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Sipariş: {$this->salesOrder->order_number} - " . config('app.name'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.sales-order',
            with: [
                'salesOrder' => $this->salesOrder,
                'customMessage' => $this->customMessage,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];

        if ($this->pdfContent) {
            $attachments[] = Attachment::fromData(
                fn () => base64_decode($this->pdfContent),
                "siparis-{$this->salesOrder->order_number}.pdf"
            )->withMime('application/pdf');
        }

        return $attachments;
    }
}
