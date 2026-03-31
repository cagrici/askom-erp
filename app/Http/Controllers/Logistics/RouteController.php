<?php

namespace App\Http\Controllers\Logistics;

use App\Http\Controllers\Controller;
use App\Models\LogisticsRoute;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RouteController extends Controller
{
    /**
     * Display a listing of routes
     */
    public function index(Request $request)
    {
        $query = LogisticsRoute::query();

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('route_number', 'like', "%{$search}%")
                  ->orWhere('route_name', 'like', "%{$search}%")
                  ->orWhere('origin_location', 'like', "%{$search}%")
                  ->orWhere('destination_location', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by route type
        if ($request->filled('route_type')) {
            $query->where('route_type', $request->route_type);
        }

        // Filter by frequency
        if ($request->filled('frequency')) {
            $query->where('frequency', $request->frequency);
        }

        // Filter favorites
        if ($request->filled('favorites') && $request->favorites === 'true') {
            $query->where('is_favorite', true);
        }

        $routes = $query->latest()->paginate(15)->withQueryString();

        // Get statistics
        $stats = $this->getStatistics();

        return Inertia::render('Logistics/Routes/Index', [
            'routes' => $routes,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'route_type' => $request->route_type,
                'frequency' => $request->frequency,
                'favorites' => $request->favorites,
            ]
        ]);
    }

    /**
     * Toggle favorite status
     */
    public function toggleFavorite(LogisticsRoute $route)
    {
        try {
            $route->update(['is_favorite' => !$route->is_favorite]);

            $message = $route->is_favorite ? 'Rota favorilere eklendi.' : 'Rota favorilerden çıkarıldı.';

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', 'İşlem sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Update route status
     */
    public function updateStatus(Request $request, LogisticsRoute $route)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive,under_review',
        ]);

        try {
            $route->update(['status' => $validated['status']]);

            return back()->with('success', 'Rota durumu güncellendi.');
        } catch (\Exception $e) {
            return back()->with('error', 'Durum güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Delete route
     */
    public function destroy(LogisticsRoute $route)
    {
        try {
            $route->delete();

            return redirect()
                ->route('logistics.routes.index')
                ->with('success', 'Rota başarıyla silindi.');
        } catch (\Exception $e) {
            return back()->with('error', 'Rota silinirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Get route statistics
     */
    private function getStatistics(): array
    {
        return [
            'total_routes' => LogisticsRoute::count(),
            'active_routes' => LogisticsRoute::where('status', 'active')->count(),
            'favorite_routes' => LogisticsRoute::where('is_favorite', true)->count(),
            'optimized_routes' => LogisticsRoute::where('is_optimized', true)->count(),
            'delivery_routes' => LogisticsRoute::where('route_type', 'delivery')->count(),
            'multi_stop_routes' => LogisticsRoute::where('route_type', 'multi_stop')->count(),
            'total_distance' => LogisticsRoute::where('status', 'active')->sum('total_distance_km'),
            'avg_distance' => LogisticsRoute::where('status', 'active')->avg('total_distance_km'),
        ];
    }
}
