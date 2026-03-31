<?php

namespace App\Http\Controllers\Announcement;

use App\Http\Controllers\Controller;
use App\Http\Requests\Announcement\StoreAnnouncementRequest;
use App\Http\Requests\Announcement\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Models\Category;
use App\Models\AnnouncementFile;
use App\Models\AnnouncementRead;
use App\Models\Department;
use App\Models\Location;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    /**
     * Duyuruları listele
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Announcement::with(['category', 'createdBy', 'department', 'location'])
            ->published()
            ->forUser($user);

        // Kategori filtresi
        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }

        // Öne çıkan filtresi
        if ($request->boolean('featured')) {
            $query->featured();
        }

        // Arama
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // Sıralama
        $query->orderBy('is_pinned', 'desc')
              ->orderBy('publish_at', 'desc');

        $announcements = $query->paginate(10)->withQueryString();

        // Her duyuru için okunma durumunu ekle
        $announcements->through(function ($announcement) use ($user) {
            $announcement->is_read = $announcement->isReadBy($user);
            return $announcement;
        });

        // Kategorileri getir
        $categories = Category::where('is_active', true)
            ->where('type', 'announcement')
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        return Inertia::render('Announcements/Index', [
            'announcements' => $announcements,
            'categories' => $categories,
            'filters' => $request->only(['category', 'featured', 'search']),
        ]);
    }

    /**
     * Yeni duyuru oluştur formu
     */
    public function create()
    {
        // Yetki kontrolü
        // $this->authorize('create', Announcement::class);

        $categories = Category::where('is_active', true)
            ->where('type', 'announcement')
            ->orderBy('name')
            ->get(['id', 'name']);

        $departments = Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $roles = Role::orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Announcements/Create', [
            'categories' => $categories,
            'departments' => $departments,
            'locations' => $locations,
            'roles' => $roles,
        ]);
    }

    /**
     * Yeni duyuru kaydet
     */
    public function store(StoreAnnouncementRequest $request)
    {
        // Yetki kontrolü
        // $this->authorize('create', Announcement::class);

        $validated = $request->validated();

        // Eski validation kodunu kaldır
        /*
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'location_id' => 'nullable|exists:locations,id',
            'recipient_roles' => 'nullable|array',
            'recipient_roles.*' => 'exists:roles,id',
            'recipient_departments' => 'nullable|array',
            'recipient_departments.*' => 'exists:departments,id',
            'is_featured' => 'boolean',
            'is_pinned' => 'boolean',
            'show_on_login' => 'boolean',
            'status' => 'required|in:draft,published',
            'publish_at' => 'nullable|date',
            'expiry_at' => 'nullable|date|after_or_equal:publish_at',
            'cover_image' => 'nullable|image|max:2048', // 2MB max
            'files' => 'nullable|array',
            'files.*' => 'file|max:10240', // 10MB max
        ]);
        */

        // Kapak resmi yükleme
        if ($request->hasFile('cover_image')) {
            $validated['cover_image_path'] = $request->file('cover_image')->store('announcement_covers', 'public');
        }

        // Duyuru oluştur
        $announcement = Announcement::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category_id' => $validated['category_id'],
            'created_by' => Auth::id(),
            'department_id' => $validated['department_id'],
            'location_id' => $validated['location_id'],
            'recipient_roles' => $validated['recipient_roles'] ?? [],
            'recipient_departments' => $validated['recipient_departments'] ?? [],
            'is_featured' => $validated['is_featured'] ?? false,
            'is_pinned' => $validated['is_pinned'] ?? false,
            'show_on_login' => $validated['show_on_login'] ?? false,
            'status' => $validated['status'],
            'publish_at' => $validated['publish_at'] ?? now(),
            'expire_at' => $validated['expire_at'],
            'cover_image_path' => $validated['cover_image_path'] ?? null,
        ]);

        // Dosya yükleme
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('announcement_files');

                AnnouncementFile::create([
                    'announcement_id' => $announcement->id,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'file_type' => $file->getMimeType(),
                ]);
            }
        }

        return redirect()->route('announcements.index')
            ->with('success', 'Duyuru başarıyla oluşturuldu.');
    }

    /**
     * Duyuru detayını göster
     */
    public function show(Announcement $announcement)
    {
        $user = request()->user();

        // Kullanıcı bu duyuruyu görebilir mi?
        if (!$announcement->isVisibleFor($user)) {
            abort(403, 'Bu duyuruyu görüntüleme yetkiniz yok.');
        }

        // İlişkileri yükle
        $announcement->load(['category', 'createdBy', 'updatedBy', 'department', 'location', 'files']);

        // Okundu olarak işaretle
        $announcement->markAsReadBy($user);

        // Okunma istatistikleri
        $readCount = $announcement->getReadCount();
        $audienceCount = $announcement->getAudienceCount();

        return Inertia::render('Announcements/Show', [
            'announcement' => $announcement,
            'isRead' => true, // Az önce okundu olarak işaretledik
            'readCount' => $readCount,
            'audienceCount' => $audienceCount,
            'readPercentage' => $audienceCount > 0 ? round(($readCount / $audienceCount) * 100, 2) : 0,
        ]);
    }

    /**
     * Duyuru düzenleme formu
     */
    public function edit(Announcement $announcement)
    {
        // Yetki kontrolü
        // $this->authorize('update', $announcement);

        $announcement->load('files');

        $categories = Category::where('is_active', true)
            ->where('type', 'announcement')
            ->orderBy('name')
            ->get(['id', 'name']);

        $departments = Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $roles = Role::orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Announcements/Edit', [
            'announcement' => $announcement,
            'categories' => $categories,
            'departments' => $departments,
            'locations' => $locations,
            'roles' => $roles,
        ]);
    }

    /**
     * Duyuru güncelle
     */
    public function update(UpdateAnnouncementRequest $request, Announcement $announcement)
    {
        // Yetki kontrolü
        // $this->authorize('update', $announcement);

        $validated = $request->validated();

        // Eski validation kodunu kaldır
        /*
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'location_id' => 'nullable|exists:locations,id',
            'recipient_roles' => 'nullable|array',
            'recipient_roles.*' => 'exists:roles,id',
            'recipient_departments' => 'nullable|array',
            'recipient_departments.*' => 'exists:departments,id',
            'is_featured' => 'boolean',
            'is_pinned' => 'boolean',
            'show_on_login' => 'boolean',
            'status' => 'required|in:draft,published,archived',
            'publish_at' => 'nullable|date',
            'expiry_at' => 'nullable|date|after_or_equal:publish_at',
            'cover_image' => 'nullable|image|max:2048',
            'remove_cover_image' => 'boolean',
            'files' => 'nullable|array',
            'files.*' => 'file|max:10240',
            'removed_files' => 'nullable|array',
            'removed_files.*' => 'integer|exists:announcement_files,id',
        ]);
        */

        // Kapak resmi işlemleri
        if ($request->boolean('remove_cover_image') && $announcement->cover_image_path) {
            Storage::delete($announcement->cover_image_path);
            $validated['cover_image_path'] = null;
        } elseif ($request->hasFile('cover_image')) {
            // Eski resmi sil
            if ($announcement->cover_image_path) {
                Storage::delete($announcement->cover_image_path);
            }
            $validated['cover_image_path'] = $request->file('cover_image')->store('announcement_covers', 'public');
        }

        // Duyuru güncelle
        $announcement->update([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category_id' => $validated['category_id'],
            'updated_by' => Auth::id(),
            'department_id' => $validated['department_id'],
            'location_id' => $validated['location_id'],
            'recipient_roles' => $validated['recipient_roles'] ?? [],
            'recipient_departments' => $validated['recipient_departments'] ?? [],
            'is_featured' => $validated['is_featured'] ?? false,
            'is_pinned' => $validated['is_pinned'] ?? false,
            'show_on_login' => $validated['show_on_login'] ?? false,
            'status' => $validated['status'],
            'publish_at' => $validated['publish_at'] ?? now(),
            'expire_at' => $validated['expire_at'],
            'cover_image_path' => $validated['cover_image_path'] ?? $announcement->cover_image_path,
        ]);

        // Yeni dosya yükleme
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('announcement_files');

                AnnouncementFile::create([
                    'announcement_id' => $announcement->id,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'file_type' => $file->getMimeType(),
                ]);
            }
        }

        // Dosya silme
        if ($request->filled('removed_files')) {
            $filesToDelete = AnnouncementFile::where('announcement_id', $announcement->id)
                ->whereIn('id', $request->removed_files)
                ->get();

            foreach ($filesToDelete as $file) {
                Storage::delete($file->file_path);
                $file->delete();
            }
        }

        return redirect()->route('announcements.show', $announcement)
            ->with('success', 'Duyuru başarıyla güncellendi.');
    }

    /**
     * Duyuru sil
     */
    public function destroy(Announcement $announcement)
    {
        // Yetki kontrolü
        // $this->authorize('delete', $announcement);

        // Dosyaları sil
        foreach ($announcement->files as $file) {
            Storage::delete($file->file_path);
        }

        // Kapak resmini sil (model boot metodunda otomatik silinecek)
        $announcement->delete();

        return redirect()->route('announcements.index')
            ->with('success', 'Duyuru başarıyla silindi.');
    }

    /**
     * Duyuruyu okundu olarak işaretle
     */
    public function markAsRead(Announcement $announcement)
    {
        $user = request()->user();

        if (!$announcement->isVisibleFor($user)) {
            abort(403, 'Bu duyuruyu görüntüleme yetkiniz yok.');
        }

        $announcement->markAsReadBy($user);

        return response()->json(['success' => true]);
    }

    /**
     * Dosya indir
     */
    public function downloadFile(AnnouncementFile $file)
    {
        $announcement = $file->announcement;
        $user = request()->user();

        if (!$announcement->isVisibleFor($user)) {
            abort(403, 'Bu dosyayı indirme yetkiniz yok.');
        }

        return Storage::download($file->file_path, $file->file_name);
    }

    /**
     * Giriş ekranı duyuruları
     */
    public function loginAnnouncements()
    {
        $user = request()->user();

        $announcements = Announcement::with(['category', 'createdBy'])
            ->published()
            ->showOnLogin()
            ->forUser($user)
            ->orderBy('is_pinned', 'desc')
            ->orderBy('publish_at', 'desc')
            ->limit(5)
            ->get();

        // Okunma durumlarını ekle
        $announcements->each(function ($announcement) use ($user) {
            $announcement->is_read = $announcement->isReadBy($user);
        });

        return response()->json($announcements);
    }

    /**
     * İstatistikler (Admin için)
     */
    public function statistics()
    {
        // $this->authorize('viewStatistics', Announcement::class);

        $totalAnnouncements = Announcement::count();
        $publishedAnnouncements = Announcement::published()->count();
        $draftAnnouncements = Announcement::where('status', 'draft')->count();
        $archivedAnnouncements = Announcement::where('status', 'archived')->count();

        // Son 7 günün okunma istatistikleri
        $readStats = AnnouncementRead::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // En çok okunan duyurular
        $mostReadAnnouncements = Announcement::withCount('reads')
            ->published()
            ->orderBy('reads_count', 'desc')
            ->limit(10)
            ->get(['id', 'title', 'publish_at']);

        return Inertia::render('Announcements/Statistics', [
            'stats' => [
                'total' => $totalAnnouncements,
                'published' => $publishedAnnouncements,
                'draft' => $draftAnnouncements,
                'archived' => $archivedAnnouncements,
            ],
            'readStats' => $readStats,
            'mostReadAnnouncements' => $mostReadAnnouncements,
        ]);
    }
}
