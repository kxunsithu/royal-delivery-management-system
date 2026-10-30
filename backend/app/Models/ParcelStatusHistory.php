<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParcelStatusHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'parcel_id',
        'from_status',
        'to_status',
        'changed_by_id',
        'reason',
        'notes',
    ];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_id');
    }
}
