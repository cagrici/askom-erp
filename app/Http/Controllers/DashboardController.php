<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\Announcement;
use App\Models\CalendarEvent;
use App\Models\User;
use App\Models\MessageGroup;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        // Kullanici bilgileri
        $userInfo = [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $user->first_name ?? $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar ?? null,
            'roles' => $user->roles->pluck('name')->toArray(),
        ];

        // Gunun karsilama mesaji
        $hour = Carbon::now()->hour;
        if ($hour < 12) {
            $greeting = 'Gunaydin';
        } elseif ($hour < 18) {
            $greeting = 'Iyi gunler';
        } else {
            $greeting = 'Iyi aksamlar';
        }

        // Duyurular
        $announcements = [];
        if (class_exists(\App\Models\Announcement::class)) {
            try {
                $announcements = Announcement::with('category')
                    ->where(function ($q) {
                        $q->where('is_active', true)->orWhereNull('is_active');
                    })
                    ->orderBy('is_featured', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->take(5)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'title' => $item->title,
                            'content' => $item->content,
                            'category' => $item->category ? [
                                'name' => $item->category->name,
                                'color' => $item->category->color ?? 'primary',
                            ] : null,
                            'is_featured' => $item->is_featured,
                            'created_at' => $item->created_at->format('d.m.Y'),
                        ];
                    })
                    ->toArray();
            } catch (\Exception $e) {
                $announcements = [];
            }
        }

        // Yaklasan etkinlikler
        $upcomingEvents = [];
        if (class_exists(\App\Models\CalendarEvent::class)) {
            try {
                $upcomingEvents = CalendarEvent::where('start_time', '>=', now())
                    ->orderBy('start_time')
                    ->take(5)
                    ->get()
                    ->map(function ($event) {
                        return [
                            'id' => $event->id,
                            'title' => $event->title,
                            'start_time' => Carbon::parse($event->start_time)->format('d.m.Y H:i'),
                            'location' => $event->location ?? null,
                        ];
                    })
                    ->toArray();
            } catch (\Exception $e) {
                $upcomingEvents = [];
            }
        }

        // Bekleyen is talepleri (kullanicinin dahil oldugu)
        $pendingTasks = [];
        if (class_exists(\App\Models\MessageGroup::class)) {
            try {
                $pendingTasks = MessageGroup::with(['creator', 'assignedUser'])
                    ->whereIn('status', ['open', 'in_progress'])
                    ->where(function ($query) use ($user) {
                        $query->where('created_by', $user->id)
                            ->orWhere('assigned_to', $user->id)
                            ->orWhereHas('participants', function ($q) use ($user) {
                                $q->where('user_id', $user->id);
                            });
                    })
                    ->orderBy('priority', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->take(5)
                    ->get()
                    ->map(function ($task) {
                        return [
                            'id' => $task->id,
                            'title' => $task->name,
                            'status' => $task->status,
                            'priority' => $task->priority,
                            'due_date' => $task->due_date ? Carbon::parse($task->due_date)->format('d.m.Y') : null,
                        ];
                    })
                    ->toArray();
            } catch (\Exception $e) {
                $pendingTasks = [];
            }
        }

        // Dogum gunleri (bugun ve sonraki 7 gun)
        $birthdays = [];
        try {
            $birthdays = User::whereNotNull('birth_date')
                ->where('status', 'active')
                ->get()
                ->filter(function ($u) {
                    if (!$u->birth_date) return false;
                    $birthDate = Carbon::parse($u->birth_date);
                    $today = Carbon::today();
                    $nextWeek = Carbon::today()->addDays(7);

                    $thisYearBirthday = $birthDate->copy()->year($today->year);
                    return $thisYearBirthday->between($today, $nextWeek);
                })
                ->take(5)
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name ?? ($u->first_name . ' ' . $u->last_name),
                        'avatar' => $u->avatar ?? null,
                        'date' => Carbon::parse($u->birth_date)->format('d.m'),
                    ];
                })
                ->values()
                ->toArray();
        } catch (\Exception $e) {
            $birthdays = [];
        }

        // Hizli erisim linkleri (role gore)
        $quickLinks = $this->getQuickLinksForUser($user);

        return Inertia::render('Dashboard', [
            'user' => $userInfo,
            'greeting' => $greeting,
            'announcements' => $announcements,
            'upcomingEvents' => $upcomingEvents,
            'pendingTasks' => $pendingTasks,
            'birthdays' => $birthdays,
            'quickLinks' => $quickLinks,
            'currentDate' => Carbon::now()->translatedFormat('d F Y, l'),
        ]);
    }

    /**
     * Kullanici rolune gore hizli erisim linkleri
     */
    private function getQuickLinksForUser($user): array
    {
        $links = [
            // Herkes icin
            ['title' => 'Profilim', 'url' => '/profile', 'icon' => 'ri-user-line', 'color' => 'primary'],
        ];

        // Satis rolleri
        if ($user->hasAnyRole(['sales_manager', 'sales_representative', 'store_cashier', 'admin', 'Super Admin'])) {
            $links[] = ['title' => 'Siparisler', 'url' => '/sales/orders', 'icon' => 'ri-shopping-cart-line', 'color' => 'success'];
            $links[] = ['title' => 'Musteriler', 'url' => '/current-accounts', 'icon' => 'ri-group-line', 'color' => 'info'];
        }

        // Depo rolleri
        if ($user->hasAnyRole(['warehouse_manager', 'warehouse_receiver', 'warehouse_picker', 'warehouse_shipper', 'admin', 'Super Admin'])) {
            $links[] = ['title' => 'Stok', 'url' => '/inventory', 'icon' => 'ri-archive-line', 'color' => 'warning'];
            $links[] = ['title' => 'Depolar', 'url' => '/warehouses', 'icon' => 'ri-building-line', 'color' => 'secondary'];
        }

        // Yonetici rolleri
        if ($user->hasAnyRole(['admin', 'Super Admin', 'company_manager'])) {
            $links[] = ['title' => 'Raporlar', 'url' => '/sales/analytics', 'icon' => 'ri-bar-chart-line', 'color' => 'danger'];
        }

        return $links;
    }
}
