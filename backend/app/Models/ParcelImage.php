<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ParcelImage extends Model
{
    protected $fillable = [
        'parcel_id',
        'path',
        'original_name',
        'size',
        'mime_type',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'size'       => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }

    /**
     * Get the publicly accessible URL for this image.
     */
    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }

    /**
     * Delete the actual file from storage when the model is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (ParcelImage $image) {
            Storage::disk('public')->delete($image->path);
        });
    }
}
