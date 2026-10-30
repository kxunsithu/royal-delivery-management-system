<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashHandover extends Model
{
    protected $fillable = [
        'staff_id',
        'submitted_by_id',
        'verified_by_id',
        'expected_amount',
        'submitted_amount',
        'verified_amount',
        'discrepancy',
        'status',
        'submission_notes',
        'verification_notes',
        'period_start',
        'period_end',
        'submitted_at',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'expected_amount' => 'decimal:2',
            'submitted_amount' => 'decimal:2',
            'verified_amount' => 'decimal:2',
            'discrepancy' => 'decimal:2',
            'period_start' => 'datetime',
            'period_end' => 'datetime',
            'submitted_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_id');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'handover_id');
    }
}
