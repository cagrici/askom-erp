<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Notifications\CustomResetPasswordNotification;
use App\Traits\HasModulePermissions;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes, HasModulePermissions;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'avatar',
        'avatar',
        'status',
        'active_entity_id',
        'department_id',
        'manager_id',
        'location_id',
        'position',
        'employee_id',
        'join_date',
        'birth_date',
        'address',
        'phone',
        'emergency_contact_name',
        'emergency_contact_phone',
        'is_admin',
        'last_login_at',
        'dark_mode',
        'compact_mode',
        'language',
        // Driver fields
        'mobile_phone',
        'is_driver',
        'is_active_driver',
        'license_number',
        'license_type',
        'license_expiry_date',
        'driver_notes',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'status' => 'boolean',
        'dark_mode' => 'boolean',
        'compact_mode' => 'boolean',
        'is_admin' => 'boolean',
        'join_date' => 'date',
        'birth_date' => 'date',
        'last_login_at' => 'datetime',
        // Driver casts
        'is_driver' => 'boolean',
        'is_active_driver' => 'boolean',
        'license_expiry_date' => 'date',
    ];

    /**
     * Get the companies associated with the user.
     */
    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'company_user')
            ->withPivot('is_admin')
            ->withTimestamps();
    }

    /**
     * Get the company locations associated with the user.
     */
    public function companyLocations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class, 'user_location')
            ->withPivot('is_primary', 'is_admin')
            ->withTimestamps();
    }

    public function hasPermission($permission)
    {
        return $this->hasRole('admin') || $this->hasPermissionTo($permission);
    }

    /**
     * Get the entities the user is associated with.
     */
    public function entities(): BelongsToMany
    {
        return $this->belongsToMany(Entity::class, 'entity_user')
            ->withPivot('pivot_status', 'pivot_created_by', 'created_at')
            ->withTimestamps();
    }

    /**
     * Get the active entity.
     */
    public function activeEntity(): BelongsTo
    {
        return $this->belongsTo(Entity::class, 'active_entity_id');
    }

    /**
     * Get the department of this user
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the location of this user
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }


    /**
     * Get the documents uploaded by the user
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Get the announcements created by the user
     */
    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    /**
     * Get the work requests created by the user
     */
    public function workRequests(): HasMany
    {
        return $this->hasMany(WorkRequest::class, 'requester_id');
    }

    /**
     * Get the work requests assigned to the user
     */
    public function assignedWorkRequests(): HasMany
    {
        return $this->hasMany(WorkRequest::class, 'assignee_id');
    }

    /**
     * Get the expenses submitted by the user
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    /**
     * Get the message groups the user participates in
     */
    public function messageGroups(): BelongsToMany
    {
        return $this->belongsToMany(MessageGroup::class, 'message_group_participants')
                    ->withPivot('role', 'last_read_at')
                    ->withTimestamps();
    }

    /**
     * Get the expense reports submitted by the user
     */
    public function expenseReports(): HasMany
    {
        return $this->hasMany(ExpenseReport::class);
    }

    /**
     * Get the visitors hosted by the user
     */
    public function visitors(): HasMany
    {
        return $this->hasMany(Visitor::class, 'host_user_id');
    }

    /**
     * Get the packages received by the user
     */
    public function packages(): HasMany
    {
        return $this->hasMany(Package::class, 'recipient_user_id');
    }

    /**
     * Get all calendar events created by this user
     */
    public function calendarEvents(): HasMany
    {
        return $this->hasMany(CalendarEvent::class, 'created_by');
    }

    /**
     * Get all calendar events where user is a participant
     */
    public function participatingEvents(): BelongsToMany
    {
        return $this->belongsToMany(CalendarEvent::class, 'calendar_event_participants')
            ->withPivot('status', 'response_message')
            ->withTimestamps();
    }

    /**
     * Scope a query to only include active users.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    /**
     * Check if user is admin of a specific company.
     */
    public function isCompanyAdmin($companyId): bool
    {
        return $this->companies()
            ->wherePivot('company_id', $companyId)
            ->wherePivot('is_admin', 1)
            ->exists();
    }

    /**
     * Get all the companies that the user administers.
     */
    public function adminCompanies()
    {
        return $this->companies()->wherePivot('is_admin', 1);
    }


    /**
     * Check if user has access to a specific location
     */
    public function hasLocationAccess($locationId): bool
    {
        if ($this->is_admin) {
            return true;
        }

        return $this->companyLocations()->where('location_id', $locationId)->exists();
    }

    /**
     * Check if user is admin of a specific location
     */
    public function isLocationAdmin($locationId): bool
    {
        if ($this->is_admin) {
            return true;
        }

        return $this->companyLocations()
            ->where('location_id', $locationId)
            ->wherePivot('is_admin', 1)
            ->exists();
    }

    /**
     * Get all locations the user has access to
     */
    public function getAccessibleLocations()
    {
        if ($this->is_admin) {
            return Location::all();
        }

        return $this->companyLocations;
    }

    /**
     * Get all locations where user is admin
     */
    public function getAdminLocations()
    {
        if ($this->is_admin) {
            return Location::all();
        }

        return $this->companyLocations()->wherePivot('is_admin', 1)->get();
    }

    /**
     * Get user's primary location
     */
    public function getPrimaryLocation()
    {
        return $this->companyLocations()->wherePivot('is_primary', 1)->first()
            ?? $this->location;
    }

    /**
     * Check if the user is a super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super admin') || $this->hasRole('Super Admin') || $this->hasRole('super-admin') || $this->is_admin;
    }

    /**
     * Ensure name is UTF-8 safe
     */
    public function getNameAttribute($value): string
    {
        return $value ? mb_convert_encoding($value, 'UTF-8', 'UTF-8') : '';
    }

    /**
     * Get the full name of the user
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Record user login
     */
    public function recordLogin(): void
    {
        $this->update([
            'last_login_at' => now(),
        ]);
    }

    /**
     * Check if user has pending notifications
     */
    public function hasPendingNotifications(): bool
    {
        return $this->notifications()->whereNull('read_at')->exists();
    }

    /**
     * Get the current accounts (customers) assigned to this user
     */
    public function assignedAccounts(): BelongsToMany
    {
        return $this->belongsToMany(CurrentAccount::class, 'user_current_accounts', 'user_id', 'current_account_id')
            ->withPivot('is_default')
            ->withTimestamps();
    }

    /**
     * Get the default current account for this user
     */
    public function getDefaultAccountAttribute()
    {
        return $this->assignedAccounts()->wherePivot('is_default', true)->first();
    }

    /**
     * Get the positions assigned to the user
     */
    public function positions(): BelongsToMany
    {
        return $this->belongsToMany(OrganizationPosition::class, 'position_user', 'user_id', 'position_id');
    }

    /**
     * Get the user's primary position
     */
    public function getPrimaryPositionAttribute()
    {
        return $this->positions()->orderBy('level')->first();
    }

    /**
     * Get the user's manager/supervisor
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get users that report to this user (subordinates)
     */
    public function subordinates(): HasMany
    {
        return $this->hasMany(User::class, 'manager_id');
    }

    /**
     * Get all users in the reporting hierarchy under this user
     */
    public function allSubordinates()
    {
        return $this->subordinates()->with('allSubordinates');
    }

    /**
     * Get the employee associated with the user.
     */
    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    /**
     * Get user's contact information for directory
     */
    public function getContactInfoAttribute(): array
    {
        return [
            'name' => $this->getFullNameAttribute(),
            'email' => $this->email,
            'phone' => $this->phone,
            'mobile' => $this->mobile,
            'position' => $this->position,
            'department' => $this->department ? $this->department->name : null,
            'location' => $this->location ? $this->location->name : null,
        ];
    }

    /**
     * Get meetings organized by this user
     */
    public function organizedMeetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'organizer_id');
    }

    /**
     * Get meeting participations for this user
     */
    public function meetingParticipations(): HasMany
    {
        return $this->hasMany(MeetingParticipant::class);
    }

    /**
     * Get meetings where this user is a participant
     */
    public function meetings(): BelongsToMany
    {
        return $this->belongsToMany(Meeting::class, 'meeting_participants')
            ->withPivot('role', 'response_status')
            ->withTimestamps();
    }

    /**
     * Get documents uploaded by this user for meetings
     */
    public function meetingDocuments(): HasMany
    {
        return $this->hasMany(MeetingDocument::class, 'uploaded_by');
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new CustomResetPasswordNotification($token));
    }
}
