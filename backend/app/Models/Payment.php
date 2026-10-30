<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'parcel_id',
        'delivery_attempt_id',
        'collected_by_id',
        'handover_id',
        'payment_type',
        'amount',
        'collected_at',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'collected_at' => 'datetime',
        ];
    }

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }

    public function deliveryAttempt(): BelongsTo
    {
        return $this->belongsTo(DeliveryAttempt::class);
    }

    public function collectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collected_by_id');
    }

    public function handover(): BelongsTo
    {
        return $this->belongsTo(CashHandover::class, 'handover_id');
    }

    public function scopeDeliveryFees($query)
    {
        return $query->where('payment_type', 'DELIVERY_FEE');
    }

    public function scopeCod($query)
    {
        return $query->where('payment_type', 'COD');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'COLLECTED');
    }
}
