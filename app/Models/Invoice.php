<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use SoftDeletes;

    protected $fillable = [
        // Logo sync fields - raw Logo data
        'logo_logicalref',
        'logo_ficheno',
        'logo_trcode',
        'logo_nettotal',
        'logo_grosstotal',
        'logo_totvatamnt',
        'logo_distdisc',
        'logo_reportrate',
        'logo_trcurr',
        'logo_date',
        'logo_time',
        'logo_cancelled',
        'logo_clientref',
        'logo_clientcode',
        'logo_definition',
        'logo_taxoffice',
        'logo_taxnr',
        'logo_genexp1',
        'logo_genexp2',
        'logo_genexp3',
        'logo_genexp4',
        'logo_genexp5',
        'logo_genexp6',
        'logo_salesmanref',
        'logo_docode',
        'logo_shipinforef',
        'logo_projectref',
        'logo_paydefref',
        'logo_einvoice',
        'logo_edespatch',
        'logo_einvoiceguid',
        'logo_specode',
        'logo_specode2',
        'logo_specode3',
        'logo_specode4',
        'logo_specode5',
        'logo_printcnt',

        // Processed fields
        'invoice_type',
        'invoice_series',
        'invoice_number',

        // Payment and amounts
        'net_total',
        'discount_total',
        'vat_total',
        'gross_total',
        'currency_code',
        'exchange_rate',
        'paid_amount',
        'remaining_amount',
        'due_date',
        'payment_date',

        // Dates
        'invoice_date',
        'invoice_time',

        // Customer/Current Account Info
        'current_account_id',
        'customer_code',
        'customer_name',
        'tax_office',
        'tax_number',
        'salesperson_id',

        // Address
        'delivery_address_id',
        'billing_address',
        'shipping_address',

        // Related documents
        'waybill_number',
        'sales_order_id',

        // Status and tracking
        'status',
        'notes',
        'cancellation_reason',
        'printed_by',
        'printed_at',
        'print_count',

        // Sync tracking
        'logo_synced_at',
        'synced_by',
        'sync_status',
        'sync_errors',
        'sync_attempt_count',
        'last_sync_attempt_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'invoice_time' => 'datetime',
        'printed_at' => 'datetime',
        'logo_synced_at' => 'datetime',
        'net_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'vat_total' => 'decimal:2',
        'gross_total' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
    ];

    /**
     * Get the current account that owns the invoice.
     */
    public function currentAccount(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class);
    }

    /**
     * Get the sales order related to this invoice.
     */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /**
     * Get the delivery address for the invoice.
     */
    public function deliveryAddress(): BelongsTo
    {
        return $this->belongsTo(CurrentAccountDeliveryAddress::class, 'delivery_address_id');
    }

    /**
     * Get the invoice items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by customer.
     */
    public function scopeByCustomer($query, $customerId)
    {
        return $query->where('current_account_id', $customerId);
    }

    /**
     * Scope for filtering by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('invoice_date', [$startDate, $endDate]);
    }

    /**
     * Get formatted invoice number with series.
     */
    public function getFormattedNumberAttribute(): string
    {
        return $this->invoice_series . '-' . str_pad($this->invoice_number, 8, '0', STR_PAD_LEFT);
    }

    /**
     * Get status badge class.
     */
    public function getStatusBadgeAttribute(): string
    {
        return match($this->status) {
            'synced' => 'info',
            'approved' => 'primary',
            'sent' => 'warning',
            'paid' => 'success',
            'cancelled' => 'danger',
            'pending' => 'secondary',
            default => 'secondary',
        };
    }

    /**
     * Get status label in Turkish.
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'synced' => 'Senkronize',
            'approved' => 'Onaylandı',
            'sent' => 'Gönderildi',
            'paid' => 'Ödendi',
            'cancelled' => 'İptal',
            'pending' => 'Beklemede',
            default => 'Bilinmiyor',
        };
    }
}
