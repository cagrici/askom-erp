<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class InvoiceD extends Model
{

    protected $table = 'invoices_d';
    protected $fillable = ['id', 'invoice_m_id', 'line_no', 'whouse_id', 'sales_person_id', 'amt', 'amt_vat', 'amt_tra', 'cur_rate_tra', 'cur_tra_id', 'qty', 'unit_price', 'unit_price_tra', 'vat_id', 'doc_date', 'due_date', 'branch_id', 'co_id', 'dcard_id', 'item_id', 'note1', 'source_m_id', 'source_d_id', 'unit_id', 'item_name_manual', 'due_day', 'amt_with_disc', 'amt_with_disc_tra', 'expense_id', 'create_date', 'update_date'];
    public $timestamps = false;

    const created_at = 'create_date';
    const updated_at = 'update_date';

    protected $casts = [
        'doc_date' => 'date',
        'due_date' => 'date',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function entity()
    {
        return $this->belongsTo(Entity::class);
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class, 'cur_tra_id');
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_m_id', 'id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'item_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
