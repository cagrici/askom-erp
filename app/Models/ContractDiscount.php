<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ContractDiscount extends Model
{
    protected $fillable = ['id', 'form_contract_m_id', 'item_id', 'disc1_id', 'disc2_id', 'disc3_id', 'dcard_id'];


    public function contract()
    {
        return $this->belongsTo(Contract::class, 'form_contract_m_id', 'id');
    }

    public function product()
    {
        return $this->belongsTo(Ad::class, 'item_id', 'id');
    }

    public function discount1()
    {
        return $this->belongsTo(Discount::class, 'disc1_id', 'id');
    }

}
