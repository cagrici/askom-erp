<?php

namespace App\Http\Controllers;

use App\Models\MeetingRoom;
use App\Models\Meeting;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class MeetingRoomController extends Controller
{
    public function index(Request $request)
    {
        $query = MeetingRoom::with(['location'])
            ->withCount(['events']);

        if ($request->has('location_id') && $request->location_id) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->has('capacity') && $request->capacity) {
            $query->where('capacity', '>=', $request->capacity);
        }

        if ($request->has('facilities') && $request->facilities) {
            $facilities = $request->facilities;
            if (in_array('video_conference', $facilities)) {
                $query->where('has_video_conference', true);
            }
            if (in_array('projector', $facilities)) {
                $query->where('has_projector', true);
            }
            if (in_array('whiteboard', $facilities)) {
                $query->where('has_whiteboard', true);
            }
        }

        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%")
                    ->orWhere('floor', 'like', "%{$searchTerm}%");
            });
        }

        $rooms = $query->orderBy('name')->paginate(12)->withQueryString();

        return Inertia::render('MeetingRooms/Index', [
            'rooms' => $rooms,
            'locations' => Location::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['location_id', 'capacity', 'facilities', 'search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('MeetingRooms/Create', [
            'locations' => Location::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'location_id' => 'required|exists:locations,id',
            'floor' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:1',
            'has_video_conference' => 'boolean',
            'has_projector' => 'boolean',
            'has_whiteboard' => 'boolean',
            'description' => 'nullable|string',
            'image_path' => 'nullable|string',
            'is_active' => 'boolean',
            'approval_required' => 'boolean',
        ]);

        MeetingRoom::create($validatedData);

        return redirect()->route('meeting-rooms.index')
            ->with('success', 'Toplantı salonu başarıyla oluşturuldu.');
    }

    public function show(MeetingRoom $meetingRoom)
    {
        $meetingRoom->load(['location']);
        
        // Bu hafta ve gelecek hafta için rezervasyonları getir
        $startDate = now()->startOfWeek();
        $endDate = now()->addWeek()->endOfWeek();
        
        $reservations = Meeting::where('room_id', $meetingRoom->id)
            ->where('status', '!=', 'cancelled')
            ->whereBetween('start_time', [$startDate, $endDate])
            ->with(['organizer', 'participants.user'])
            ->orderBy('start_time')
            ->get();

        return Inertia::render('MeetingRooms/Show', [
            'room' => $meetingRoom,
            'reservations' => $reservations,
            'facilities' => $meetingRoom->getFacilities(),
        ]);
    }

    public function edit(MeetingRoom $meetingRoom)
    {
        return Inertia::render('MeetingRooms/Edit', [
            'room' => $meetingRoom,
            'locations' => Location::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, MeetingRoom $meetingRoom)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'location_id' => 'required|exists:locations,id',
            'floor' => 'nullable|string|max:50',
            'capacity' => 'required|integer|min:1',
            'has_video_conference' => 'boolean',
            'has_projector' => 'boolean',
            'has_whiteboard' => 'boolean',
            'description' => 'nullable|string',
            'image_path' => 'nullable|string',
            'is_active' => 'boolean',
            'approval_required' => 'boolean',
        ]);

        $meetingRoom->update($validatedData);

        return redirect()->route('meeting-rooms.show', $meetingRoom)
            ->with('success', 'Toplantı salonu başarıyla güncellendi.');
    }

    public function destroy(MeetingRoom $meetingRoom)
    {
        // Gelecek rezervasyonları kontrol et
        $futureReservations = Meeting::where('room_id', $meetingRoom->id)
            ->where('start_time', '>', now())
            ->where('status', '!=', 'cancelled')
            ->count();

        if ($futureReservations > 0) {
            return back()->withErrors(['error' => 'Bu salonda gelecek rezervasyonlar bulunmaktadır. Önce rezervasyonları iptal edin.']);
        }

        $meetingRoom->delete();

        return redirect()->route('meeting-rooms.index')
            ->with('success', 'Toplantı salonu başarıyla silindi.');
    }

    public function availability(Request $request, MeetingRoom $meetingRoom)
    {
        $request->validate([
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'exclude_meeting_id' => 'nullable|exists:meetings,id',
        ]);

        $date = Carbon::parse($request->date);
        $startTime = $date->copy()->setTimeFromTimeString($request->start_time);
        $endTime = $date->copy()->setTimeFromTimeString($request->end_time);

        $query = Meeting::where('room_id', $meetingRoom->id)
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($query) use ($startTime, $endTime) {
                    $query->where('start_time', '<', $endTime)
                        ->where('end_time', '>', $startTime);
                });
            });

        if ($request->exclude_meeting_id) {
            $query->where('id', '!=', $request->exclude_meeting_id);
        }

        $conflictingMeetings = $query->with(['organizer'])->get();

        return response()->json([
            'available' => $conflictingMeetings->isEmpty(),
            'conflicts' => $conflictingMeetings->map(function ($meeting) {
                return [
                    'id' => $meeting->id,
                    'title' => $meeting->title,
                    'organizer' => $meeting->organizer->name,
                    'start_time' => $meeting->start_time->format('H:i'),
                    'end_time' => $meeting->end_time->format('H:i'),
                ];
            }),
        ]);
    }

    public function schedule(Request $request, MeetingRoom $meetingRoom)
    {
        $date = $request->get('date', today());
        $startDate = Carbon::parse($date)->startOfWeek();
        $endDate = Carbon::parse($date)->endOfWeek();

        $meetings = Meeting::where('room_id', $meetingRoom->id)
            ->where('status', '!=', 'cancelled')
            ->whereBetween('start_time', [$startDate, $endDate])
            ->with(['organizer'])
            ->orderBy('start_time')
            ->get()
            ->groupBy(function ($meeting) {
                return $meeting->start_time->format('Y-m-d');
            });

        return Inertia::render('MeetingRooms/Schedule', [
            'room' => $meetingRoom,
            'meetings' => $meetings,
            'currentDate' => $date,
            'weekDays' => $this->getWeekDays($startDate),
        ]);
    }

    private function getWeekDays(Carbon $startDate): array
    {
        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $startDate->copy()->addDays($i);
            $days[] = [
                'date' => $date->format('Y-m-d'),
                'formatted' => $date->format('d.m.Y'),
                'day_name' => $date->locale('tr')->dayName,
                'is_today' => $date->isToday(),
            ];
        }
        return $days;
    }
}