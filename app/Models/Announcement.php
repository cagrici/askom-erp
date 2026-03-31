<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Announcement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'content',
        'category_id',
        'created_by',
        'updated_by',
        'department_id',
        'location_id',
        'publish_at',
        'expire_date',
        'is_featured',
        'is_pinned',
        'status',
        'show_on_login',
        'cover_image_path',
        'recipient_roles',
        'recipient_departments',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_pinned' => 'boolean',
        'show_on_login' => 'boolean',
        'publish_at' => 'datetime',
        'expire_at' => 'datetime',
        'recipient_roles' => 'array',
        'recipient_departments' => 'array',
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';
    const STATUS_PUBLISHED = 'published';
    const STATUS_ARCHIVED = 'archived';

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        // Silindiğinde kapak resmini de sil
        static::deleting(function ($announcement) {
            if ($announcement->cover_image_path) {
                Storage::delete($announcement->cover_image_path);
            }
        });
    }

    /**
     * Kategori ilişkisi
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Oluşturan kullanıcı ilişkisi
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Güncelleyen kullanıcı ilişkisi
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Departman ilişkisi
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Lokasyon ilişkisi
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Dosya ilişkisi
     */
    public function files(): HasMany
    {
        return $this->hasMany(AnnouncementFile::class);
    }

    /**
     * Okunma kayıtları ilişkisi
     */
    public function reads(): HasMany
    {
        return $this->hasMany(AnnouncementRead::class);
    }

    /**
     * Kullanıcının bu duyuruyu okuyup okumadığını kontrol et
     */
    public function isReadBy(User $user): bool
    {
        return $this->reads()->where('user_id', $user->id)->exists();
    }

    /**
     * Duyuruyu kullanıcı tarafından okundu olarak işaretle
     */
    public function markAsReadBy(User $user): void
    {
        if (!$this->isReadBy($user)) {
            $this->reads()->create(['user_id' => $user->id]);
        }
    }

    /**
     * Duyurunun yayınlanmış olup olmadığını kontrol et
     */
    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED
            && $this->publish_at <= now()
            && ($this->expire_at === null || $this->expire_at >= now());
    }

    /**
     * Duyurunun kullanıcı için görünür olup olmadığını kontrol et
     */
    public function isVisibleFor(User $user): bool
    {
        // Yayınlanmamışsa görünmez
        if (!$this->isPublished()) {
            return false;
        }

        // Belirli bir departmana yönelikse
        if ($this->department_id && $this->department_id !== $user->department_id) {
            return false;
        }

        // Belirli bir lokasyona yönelikse
        if ($this->location_id && $this->location_id !== $user->location_id) {
            return false;
        }

        // Belirli rollere yönelikse
        if ($this->recipient_roles && count($this->recipient_roles) > 0) {
            $userRoles = $user->roles->pluck('id')->toArray();
            if (!array_intersect($this->recipient_roles, $userRoles)) {
                return false;
            }
        }

        // Belirli departmanlara yönelikse
        if ($this->recipient_departments && count($this->recipient_departments) > 0) {
            if (!in_array($user->department_id, $this->recipient_departments)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Duyuruyu okuyan kullanıcı sayısı
     */
    public function getReadCount(): int
    {
        return $this->reads()->count();
    }

    /**
     * Potansiyel hedef kitle sayısı
     */
    public function getAudienceCount(): int
    {
        $query = User::query();

        if ($this->department_id) {
            $query->where('department_id', $this->department_id);
        }

        if ($this->location_id) {
            $query->where('location_id', $this->location_id);
        }

        if ($this->recipient_roles && count($this->recipient_roles) > 0) {
            $query->whereHas('roles', function ($q) {
                $q->whereIn('id', $this->recipient_roles);
            });
        }

        if ($this->recipient_departments && count($this->recipient_departments) > 0) {
            $query->whereIn('department_id', $this->recipient_departments);
        }

        return $query->count();
    }

    /**
     * Kapak resmi URL'ini al
     */
    public function getCoverImageUrlAttribute(): ?string
    {
        if (!$this->cover_image_path) {
            return null;
        }

        return Storage::url($this->cover_image_path);
    }

    /**
     * Scopes
     */
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED)
            ->where('publish_at', '<=', now())
            ->where(function ($q) {
                $q->whereNull('expire_at')
                  ->orWhere('expire_at', '>=', now());
            });
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    public function scopeShowOnLogin($query)
    {
        return $query->where('show_on_login', true);
    }

    public function scopeForUser($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            // Genel duyurular
            $q->whereNull('department_id')
              ->whereNull('location_id')
              ->where(function ($q2) {
                  $q2->whereNull('recipient_roles')
                     ->orWhere('recipient_roles', '[]');
              })
              ->where(function ($q2) {
                  $q2->whereNull('recipient_departments')
                     ->orWhere('recipient_departments', '[]');
              });
        })->orWhere(function ($q) use ($user) {
            // Kullanıcının departmanına yönelik
            $q->where('department_id', $user->department_id);
        })->orWhere(function ($q) use ($user) {
            // Kullanıcının lokasyonuna yönelik
            $q->where('location_id', $user->location_id);
        })->orWhere(function ($q) use ($user) {
            // Kullanıcının rolüne yönelik
            $userRoleIds = $user->roles->pluck('id')->toArray();
            if (count($userRoleIds) > 0) {
                $q->whereJsonContains('recipient_roles', $userRoleIds);
            }
        })->orWhere(function ($q) use ($user) {
            // Kullanıcının departmanına yönelik (JSON)
            $q->whereJsonContains('recipient_departments', $user->department_id);
        });
    }
}
