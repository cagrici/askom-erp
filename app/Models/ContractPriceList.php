<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractPriceList extends Model
{
    protected $guarded = [];
    public $timestamps = false;

    protected $table = 'contract_price_list';


    public function contract()
    {
        return $this->belongsTo(Contract::class, 'contract_id', 'id');
    }

    public function priceList()
    {
        return $this->belongsTo(PriceList::class);
    }
}
