<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Parcel extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tracking_number',
        'sender_name',
        'sender_phone',
        'recipient_name',
        'recipient_phone',
        'delivery_address',
        'delivery_area_id',
        'description',
        'quantity',
        'weight',
        'notes',
        'delivery_fee',
        'cod_amount',
        'is_cod',
        'status',
        'condition',
        'priority',
        'received_at',
        'received_by_id',
        'damage_description',
    ];

    protected function casts(): array
    {
        return [
            'is_cod' => 'boolean',
            'delivery_fee' => 'decimal:2',
            'cod_amount' => 'decimal:2',
            'weight' => 'decimal:3',
            'received_at' => 'datetime',
            'quantity' => 'integer',
        ];
    }

    // Relationships
    public function deliveryArea(): BelongsTo
    {
        return $this->belongsTo(DeliveryArea::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(ParcelStatusHistory::class)->orderBy('created_at', 'desc');
    }

    public function deliveryAssignments(): HasMany
    {
        return $this->hasMany(DeliveryAssignment::class)->orderBy('assigned_at', 'desc');
    }

    public function activeAssignment()
    {
        return $this->hasOne(DeliveryAssignment::class)->where('status', 'ACTIVE');
    }

    public function deliveryAttempts(): HasMany
    {
        return $this->hasMany(DeliveryAttempt::class)->orderBy('attempted_at', 'desc');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ParcelImage::class)->orderBy('sort_order')->orderBy('created_at');
    }

    // Scopes
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByArea($query, int $areaId)
    {
        return $query->where('delivery_area_id', $areaId);
    }

    // Helpers
    public function isTerminal(): bool
    {
        return in_array($this->status, [
            'DELIVERED',
            'RETURNED_TO_SENDER',
            'DAMAGED',
            'MISSING',
        ]);
    }

    public function canTransitionTo(string $newStatus): bool
    {
        $transitions = [
            'RECEIVED_AT_MYAWADDY' => ['VERIFIED', 'DAMAGED', 'MISSING'],
            'VERIFIED' => ['READY_FOR_DELIVERY', 'DAMAGED', 'MISSING'],
            'READY_FOR_DELIVERY' => ['ASSIGNED'],
            'ASSIGNED' => ['OUT_FOR_DELIVERY', 'READY_FOR_DELIVERY'],
            'OUT_FOR_DELIVERY' => ['DELIVERED', 'DELIVERY_FAILED'],
            'DELIVERY_FAILED' => ['RETURN_TO_OFFICE', 'ASSIGNED', 'RETURNED_TO_SENDER'],
            'RETURN_TO_OFFICE' => ['ASSIGNED', 'RETURNED_TO_SENDER', 'READY_FOR_DELIVERY'],
            'RETURNED_TO_SENDER' => [],
            'DELIVERED' => [],
            'DAMAGED' => [],
            'MISSING' => [],
        ];

        return in_array($newStatus, $transitions[$this->status] ?? []);
    }

    /**
     * Generate a unique tracking number
     */
    public static function generateTrackingNumber(): string
    {
        $date = now()->format('Ymd');
        $prefixCode = \App\Models\BusinessSetting::getValue('tracking_number_prefix', 'RMD');
        $prefix = "{$prefixCode}-{$date}-";

        $lastToday = static::where('tracking_number', 'like', $prefix . '%')
            ->orderBy('tracking_number', 'desc')
            ->value('tracking_number');

        if ($lastToday) {
            $lastSeq = (int) substr($lastToday, strlen($prefix));
            $seq = str_pad($lastSeq + 1, 5, '0', STR_PAD_LEFT);
        } else {
            $seq = '00001';
        }

        return $prefix . $seq;
    }
}
