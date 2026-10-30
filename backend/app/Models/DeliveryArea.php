<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryArea extends Model
{
    protected $fillable = ['name', 'name_mm', 'description', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function parcels(): HasMany
    {
        return $this->hasMany(Parcel::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
