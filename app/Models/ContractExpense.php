<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractExpense extends Model
{
    protected $guarded = [];
    public $timestamps = false;


    public function contract()
    {
        return $this->belongsTo(Contract::class, 'form_contract_m_id');
    }
}
