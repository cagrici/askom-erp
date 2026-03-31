<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginRedirect extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'user_id',
        'role_id',
        'redirect_to',
        'name',
        'description',
        'priority',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    /**
     * Get the user for this redirect.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the role for this redirect.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Scope for active redirects.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for user type redirects.
     */
    public function scopeUserType($query)
    {
        return $query->where('type', 'user');
    }

    /**
     * Scope for role type redirects.
     */
    public function scopeRoleType($query)
    {
        return $query->where('type', 'role');
    }

    /**
     * Get redirect for a specific user.
     */
    public static function getRedirectForUser(User $user): ?string
    {
        // Debug: User 2 için özel log
        if ($user->id == 2) {
            $allUserRedirects = self::where('user_id', $user->id)->get();
            $allActiveUserRedirects = self::active()->userType()->where('user_id', $user->id)->get();
            
            \Log::info('DEBUG: User 2 Redirect Query', [
                'user_id' => $user->id,
                'all_user_redirects_count' => $allUserRedirects->count(),
                'all_user_redirects' => $allUserRedirects->toArray(),
                'active_user_redirects_count' => $allActiveUserRedirects->count(),
                'active_user_redirects' => $allActiveUserRedirects->toArray(),
            ]);
        }
        
        // First check user-specific redirects
        $userRedirect = self::active()
            ->userType()
            ->where('user_id', $user->id)
            ->orderBy('priority', 'desc')
            ->first();

        if ($userRedirect) {
            if ($user->id == 2) {
                \Log::info('DEBUG: User 2 Found User Redirect', [
                    'redirect_to' => $userRedirect->redirect_to,
                    'is_active' => $userRedirect->is_active,
                    'priority' => $userRedirect->priority,
                ]);
            }
            return $userRedirect->redirect_to;
        }

        // Then check role-based redirects
        $roleIds = $user->roles()->pluck('id')->toArray();
        
        if ($user->id == 2) {
            \Log::info('DEBUG: User 2 Role Check', [
                'role_ids' => $roleIds,
            ]);
        }
        
        $roleRedirect = self::active()
            ->roleType()
            ->whereIn('role_id', $roleIds)
            ->orderBy('priority', 'desc')
            ->first();

        if ($roleRedirect) {
            if ($user->id == 2) {
                \Log::info('DEBUG: User 2 Found Role Redirect', [
                    'redirect_to' => $roleRedirect->redirect_to,
                    'role_id' => $roleRedirect->role_id,
                ]);
            }
            return $roleRedirect->redirect_to;
        }

        if ($user->id == 2) {
            \Log::info('DEBUG: User 2 No Redirect Found');
        }

        return null;
    }

    /**
     * Get display name for the redirect target.
     */
    public function getTargetNameAttribute(): string
    {
        if ($this->type === 'user' && $this->user) {
            return $this->user->name;
        }

        if ($this->type === 'role' && $this->role) {
            return $this->role->name;
        }

        return 'Unknown';
    }
}