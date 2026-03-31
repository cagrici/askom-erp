<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'invoice_id',

        // Logo fields
        'logo_logicalref',
        'logo_invoiceref',
        'logo_stockref',
        'logo_itemcode',
        'logo_itemname',
        'logo_linetype',
        'logo_lineno',
        'logo_trcode',
        'logo_amount',
        'logo_unitconvfact',
        'logo_unitcode',
        'logo_price',
        'logo_total',
        'logo_distdisc',
        'logo_distdiscrate',
        'logo_discper',
        'logo_disc2per',
        'logo_disc3per',
        'logo_disc4per',
        'logo_disc5per',
        'logo_vatinc',
        'logo_vatrate',
        'logo_vatamnt',
        'logo_linenet',
        'logo_priceincludestax',
        'logo_prcurrency',
        'logo_prrate',
        'logo_reportrate',
        'logo_sourceindex',
        'logo_sourcecostgrp',
        'logo_lineexp',
        'logo_lineexp2',
        'logo_specode',
        'logo_dref',
        'logo_projectref',
        'logo_paydefref',
        'logo_campaignref',
        'logo_variantref',
        'logo_variantcode',
        'logo_cancelled',

        // Normalized fields
        'product_id',
        'product_code',
        'product_name',
        'description',
        'line_type',
        'line_number',
        'quantity',
        'unit',
        'unit_conversion_factor',
        'unit_price',
        'unit_price_with_vat',
        'price_includes_vat',
        'discount_rate_1',
        'discount_rate_2',
        'discount_rate_3',
        'discount_rate_4',
        'discount_rate_5',
        'total_discount_rate',
        'discount_amount',
        'vat_rate',
        'vat_amount',
        'line_subtotal',
        'line_total',
        'line_total_with_vat',
        'currency_code',
        'exchange_rate',
        'warehouse_id',
        'warehouse_code',
        'delivery_date',
        'sales_order_item_id',
        'waybill_number',
        'cost_price',
        'profit_amount',
        'profit_rate',
        'logo_synced_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_conversion_factor' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'unit_price_with_vat' => 'decimal:4',
        'price_includes_vat' => 'boolean',
        'discount_rate_1' => 'decimal:2',
        'discount_rate_2' => 'decimal:2',
        'discount_rate_3' => 'decimal:2',
        'discount_rate_4' => 'decimal:2',
        'discount_rate_5' => 'decimal:2',
        'total_discount_rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'line_subtotal' => 'decimal:2',
        'line_total' => 'decimal:2',
        'line_total_with_vat' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
        'cost_price' => 'decimal:4',
        'profit_amount' => 'decimal:2',
        'profit_rate' => 'decimal:2',
        'delivery_date' => 'date',
        'logo_synced_at' => 'datetime',
        'logo_cancelled' => 'boolean',
    ];

    /**
     * Get the invoice that owns the item.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Get the product associated with the item.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the warehouse for the item.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the sales order item.
     */
    public function salesOrderItem(): BelongsTo
    {
        return $this->belongsTo(SalesOrderItem::class);
    }
}
