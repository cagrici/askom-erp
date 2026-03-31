<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Models\CalendarEventType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class CalendarController extends Controller
{
    public function index()
    {
        return Inertia::render('Calendar/Takvim');
    }

    public function getEvents()
    {
        $events = CalendarEvent::with(['eventType', 'creator', 'location'])
            ->where('status', 'active')
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'start' => $event->start_time->toISOString(),
                    'end' => $event->end_time ? $event->end_time->toISOString() : null,
                    'allDay' => $event->all_day,
                    'className' => $event->eventType->color ?? 'bg-primary-subtle',
                    'location' => $event->custom_location ?? $event->location->name ?? '',
                    'description' => $event->description ?? '',
                    'extendedProps' => [
                        'department' => $event->department->name ?? '',
                        'created_by' => $event->creator->name ?? '',
                    ]
                ];
            });

        return response()->json($events);
    }

    public function getCategories()
    {
        // Get event types as categories
        $categories = CalendarEventType::where('is_active', true)
            ->get()
            ->map(function ($eventType) {
                return [
                    'id' => $eventType->id,
                    'title' => $eventType->name,
                    'type' => $this->getBootstrapColorFromClass($eventType->color),
                ];
            });

        // Add default categories if none exist
        if ($categories->isEmpty()) {
            $defaultCategories = [
                ['id' => 1, 'title' => 'Toplantı', 'type' => 'primary'],
                ['id' => 2, 'title' => 'Etkinlik', 'type' => 'success'],
                ['id' => 3, 'title' => 'Hatırlatma', 'type' => 'warning'],
                ['id' => 4, 'title' => 'Kişisel', 'type' => 'info'],
                ['id' => 5, 'title' => 'Acil', 'type' => 'danger'],
            ];
            return response()->json($defaultCategories);
        }

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start' => 'required|date',
            'end' => 'nullable|date|after:start',
            'location' => 'nullable|string|max:255',
            'category' => 'required|string',
            'allDay' => 'boolean',
        ]);

        // Find or create event type
        $eventType = CalendarEventType::firstOrCreate(
            ['name' => 'Genel'],
            ['color' => $validated['category'], 'is_active' => true]
        );

        $event = CalendarEvent::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'start_time' => $validated['start'],
            'end_time' => $validated['end'],
            'all_day' => $validated['allDay'] ?? false,
            'custom_location' => $validated['location'],
            'event_type_id' => $eventType->id,
            'created_by' => Auth::id(),
            'status' => 'active',
            'is_public' => true,
        ]);

        return response()->json([
            'success' => true,
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'start' => $event->start_time->toISOString(),
                'end' => $event->end_time ? $event->end_time->toISOString() : null,
                'allDay' => $event->all_day,
                'className' => $validated['category'],
                'location' => $event->custom_location ?? '',
                'description' => $event->description ?? '',
            ]
        ]);
    }

    public function update(Request $request, CalendarEvent $event)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start' => 'required|date',
            'end' => 'nullable|date|after:start',
            'location' => 'nullable|string|max:255',
            'category' => 'required|string',
            'allDay' => 'boolean',
        ]);

        $event->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'start_time' => $validated['start'],
            'end_time' => $validated['end'],
            'all_day' => $validated['allDay'] ?? false,
            'custom_location' => $validated['location'],
        ]);

        return response()->json([
            'success' => true,
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'start' => $event->start_time->toISOString(),
                'end' => $event->end_time ? $event->end_time->toISOString() : null,
                'allDay' => $event->all_day,
                'className' => $validated['category'],
                'location' => $event->custom_location ?? '',
                'description' => $event->description ?? '',
            ]
        ]);
    }

    public function destroy(CalendarEvent $event)
    {
        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Etkinlik silindi.'
        ]);
    }

    private function getBootstrapColorFromClass($colorClass)
    {
        // Convert color class to bootstrap color type
        $colorMap = [
            'bg-primary-subtle' => 'primary',
            'bg-success-subtle' => 'success',
            'bg-danger-subtle' => 'danger',
            'bg-warning-subtle' => 'warning',
            'bg-info-subtle' => 'info',
            'bg-dark-subtle' => 'dark',
        ];

        return $colorMap[$colorClass] ?? 'primary';
    }
}