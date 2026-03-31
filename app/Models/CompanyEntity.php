<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyEntity extends Model
{
    protected $table = 'company_entity';
    
    protected $guarded = [];

    public function salesPerson()
    {
        return $this->belongsTo(SalesPerson::class, 'sales_person_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'co_id');
    }

    public function entity()
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'entity_id', 'entity_id')
                    ->where('co_id', $this->co_id);
    }

    public function offers()
    {
        return $this->hasMany(Offer::class, 'entity_id', 'entity_id')
                    ->where('co_id', $this->co_id);
    }
}