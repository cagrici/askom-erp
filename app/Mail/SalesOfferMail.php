<?php

namespace App\Mail;

use App\Models\SalesOffer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class SalesOfferMail extends Mailable
{
    use Queueable, SerializesModels;

    public SalesOffer $offer;
    public ?string $customMessage;
    public ?string $attachmentContent;
    public string $attachmentType; // 'pdf' or 'excel'
    public ?string $approvalUrl;
    public ?string $trackingPixelUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        SalesOffer $offer,
        ?string $customMessage = null,
        ?string $attachmentContent = null,
        string $attachmentType = 'pdf',
        ?string $approvalUrl = null,
        ?string $trackingPixelUrl = null
    ) {
        $this->offer = $offer;
        $this->customMessage = $customMessage;
        $this->attachmentContent = $attachmentContent;
        $this->attachmentType = $attachmentType;
        $this->approvalUrl = $approvalUrl;
        $this->trackingPixelUrl = $trackingPixelUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Satis Teklifi: {$this->offer->offer_no} - " . config('app.name'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.sales-offer-with-approval',
            with: [
                'offer' => $this->offer,
                'customMessage' => $this->customMessage,
                'approvalUrl' => $this->approvalUrl,
                'trackingPixelUrl' => $this->trackingPixelUrl,
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

        if ($this->attachmentContent) {
            if ($this->attachmentType === 'excel') {
                // Use binary-safe attachment for XLSX
                $attachments[] = Attachment::fromData(
                    fn () => $this->attachmentContent,
                    "teklif-{$this->offer->offer_no}.xlsx"
                )->withMime('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            } else {
                $attachments[] = Attachment::fromData(
                    fn () => $this->attachmentContent,
                    "teklif-{$this->offer->offer_no}.pdf"
                )->withMime('application/pdf');
            }
        }

        return $attachments;
    }
}
