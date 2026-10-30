<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProofOfDelivery extends Model
{
    protected $fillable = [
        'delivery_attempt_id',
        'parcel_id',
        'type',
        'file_path',
        'notes',
    ];

    public function deliveryAttempt(): BelongsTo
    {
        return $this->belongsTo(DeliveryAttempt::class);
    }

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }

    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) {
            return null;
        }
        return \Illuminate\Support\Facades\Storage::disk('public')->url($this->file_path);
    }
}
