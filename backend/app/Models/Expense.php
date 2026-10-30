<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    protected $fillable = [
        'recorded_by_id',
        'category',
        'description',
        'amount',
        'expense_date',
        'receipt_path',
        'is_voided',
        'void_reason',
        'voided_by_id',
        'voided_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
            'is_voided' => 'boolean',
            'voided_at' => 'datetime',
        ];
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_id');
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_voided', false);
    }
}
