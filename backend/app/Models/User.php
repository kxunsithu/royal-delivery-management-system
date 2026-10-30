<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'employee_id',
        'profile_image',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    // Relationships
    public function receivedParcels(): HasMany
    {
        return $this->hasMany(Parcel::class, 'received_by_id');
    }

    public function deliveryAssignments(): HasMany
    {
        return $this->hasMany(DeliveryAssignment::class, 'staff_id');
    }

    public function assignedByAssignments(): HasMany
    {
        return $this->hasMany(DeliveryAssignment::class, 'assigned_by_id');
    }

    public function deliveryAttempts(): HasMany
    {
        return $this->hasMany(DeliveryAttempt::class, 'staff_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'collected_by_id');
    }

    public function cashHandovers(): HasMany
    {
        return $this->hasMany(CashHandover::class, 'staff_id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    // Accessors
    public function getProfileImageUrlAttribute(): ?string
    {
        if (!$this->profile_image) {
            return null;
        }
        return \Illuminate\Support\Facades\Storage::disk('public')->url($this->profile_image);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDeliveryStaff($query)
    {
        return $query->whereHas('roles', fn($q) => $q->where('name', 'delivery_staff'));
    }

    // Helpers
    public function getRoleNameAttribute(): string
    {
        return $this->roles->first()?->name ?? 'unknown';
    }

    public function getRoleDisplayNameAttribute(): string
    {
        return $this->roles->first()?->display_name ?? 'Unknown';
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isManager(): bool
    {
        return $this->hasRole('manager');
    }

    public function isAccountant(): bool
    {
        return $this->hasRole('accountant');
    }

    public function isDeliveryStaff(): bool
    {
        return $this->hasRole('delivery_staff');
    }
}
