<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryAttempt extends Model
{
    protected $fillable = [
        'assignment_id',
        'parcel_id',
        'staff_id',
        'attempted_at',
        'result',
        'failure_reason',
        'recipient_name',
        'recipient_confirmation',
        'delivery_fee_collected',
        'cod_collected',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'attempted_at' => 'datetime',
            'delivery_fee_collected' => 'decimal:2',
            'cod_collected' => 'decimal:2',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(DeliveryAssignment::class);
    }

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function proofOfDeliveries(): HasMany
    {
        return $this->hasMany(ProofOfDelivery::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
