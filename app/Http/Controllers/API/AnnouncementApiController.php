<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Announcement\AnnouncementCollection;
use App\Http\Resources\Announcement\AnnouncementResource;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AnnouncementApiController extends Controller
{
    /**
     * Duyuruları listele (API)
     */
    public function index(Request $request): AnnouncementCollection
    {
        $user = $request->user();

        $query = Announcement::with(['category', 'createdBy'])
            ->published()
            ->forUser($user);

        // Filtreleme
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->boolean('featured')) {
            $query->featured();
        }

        if ($request->boolean('pinned')) {
            $query->pinned();
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // Sıralama
        $sortBy = $request->get('sort_by', 'publish_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        if ($sortBy === 'publish_at') {
            $query->orderBy('is_pinned', 'desc');
        }
        
        $query->orderBy($sortBy, $sortOrder);

        // Sayfalama
        $perPage = $request->get('per_page', 15);
        $announcements = $query->paginate($perPage);

        // Okunma durumlarını ekle
        $announcements->through(function ($announcement) use ($user) {
            $announcement->is_read = $announcement->isReadBy($user);
            return $announcement;
        });

        return new AnnouncementCollection($announcements);
    }

    /**
     * Duyuru detayı (API)
     */
    public function show(Request $request, Announcement $announcement): AnnouncementResource|JsonResponse
    {
        $user = $request->user();

        if (!$announcement->isVisibleFor($user)) {
            return response()->json([
                'message' => 'Bu duyuruyu görüntüleme yetkiniz yok.'
            ], 403);
        }

        $announcement->load(['category', 'createdBy', 'updatedBy', 'department', 'location', 'files']);
        
        // Okundu olarak işaretle
        $announcement->markAsReadBy($user);

        // İstatistikleri ekle
        $announcement->is_read = true;
        $announcement->read_count = $announcement->getReadCount();
        $announcement->audience_count = $announcement->getAudienceCount();
        $announcement->read_percentage = $announcement->audience_count > 0 
            ? round(($announcement->read_count / $announcement->audience_count) * 100, 2) 
            : 0;

        return new AnnouncementResource($announcement);
    }

    /**
     * Duyuruyu okundu olarak işaretle (API)
     */
    public function markAsRead(Request $request, Announcement $announcement): JsonResponse
    {
        $user = $request->user();

        if (!$announcement->isVisibleFor($user)) {
            return response()->json([
                'message' => 'Bu duyuruyu görüntüleme yetkiniz yok.'
            ], 403);
        }

        $announcement->markAsReadBy($user);

        return response()->json([
            'success' => true,
            'message' => 'Duyuru okundu olarak işaretlendi.'
        ]);
    }

    /**
     * Giriş ekranı duyuruları (API)
     */
    public function loginAnnouncements(Request $request): AnnouncementCollection
    {
        $user = $request->user();

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

        return new AnnouncementCollection($announcements);
    }

    /**
     * Okunmamış duyuru sayısı (API)
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        $unreadCount = Announcement::published()
            ->forUser($user)
            ->whereDoesntHave('reads', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->count();

        return response()->json([
            'unread_count' => $unreadCount
        ]);
    }

    /**
     * Kategorileri listele (API)
     */
    public function categories(): JsonResponse
    {
        $categories = \App\Models\Category::where('is_active', true)
            ->where('type', 'announcement')
            ->withCount(['announcements' => function ($query) {
                $query->published();
            }])
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon', 'color']);

        return response()->json([
            'data' => $categories
        ]);
    }
}
