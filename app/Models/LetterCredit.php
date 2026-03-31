<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LetterCredit extends Model
{
    protected $fillable = ['id', 'letter_credit_no', 'due_date', 'doc_date', 'cur_id', 'entity_id', 'co_id', 'bank_id', 'bank_branch_id', 'credit_acc_id', 'cur_tra_id', 'amt_tra', 'payment_amt_tra', 'amt', 'letter_credit_status', 'note1', 'note2', 'create_date'];
    public $timestamps = false;

    protected $casts = [
        'doc_date' => 'date',
        'create_date' => 'date',
        'due_date' => 'date',
    ];

    const CREATED_AT = 'create_date';
    const UPDATED_AT = 'update_date';



    public function bank()
    {
        return $this->belongsTo(Bank::class);
    }
}
