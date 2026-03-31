<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemUnit extends Model
{
    protected $guarded = [];
    public $timestamps = false;

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function unit()
    {
        return $this->hasOne(Unit::class, 'id','unit_id');
    }

    public function unit2()
    {
        return $this->hasOne(Unit::class,'id','unit2_id');
    }
}
