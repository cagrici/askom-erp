<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use App\Models\Traits\HasHashedMediaTrait;
use Spatie\MediaLibrary\HasMedia;

class Page extends Model implements HasMedia
{
    use HasHashedMediaTrait;
    protected $guarded = ['id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }



}
