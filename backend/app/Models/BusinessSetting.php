<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessSetting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'description', 'updated_by_id'];

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_id');
    }

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) {
            return $default;
        }

        return match ($setting->type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $setting->value,
            'json' => json_decode($setting->value, true),
            default => $setting->value,
        };
    }

    public static function setValue(string $key, mixed $value, ?int $userId = null): self
    {
        $setting = static::where('key', $key)->firstOrFail();

        $setting->update([
            'value' => is_array($value) ? json_encode($value) : (string) $value,
            'updated_by_id' => $userId ?? auth()->id(),
        ]);

        return $setting;
    }
}
