<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\MeetingRoom;
use App\Models\MeetingParticipant;
use App\Models\MeetingDocument;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class MeetingController extends Controller
{
    public function index(Request $request)
    {
        $query = Meeting::with(['organizer', 'room', 'participants.user'])
            ->withCount(['participants', 'documents'])
            ->orderBy('start_time', 'desc');

        // Filtreleme
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('room_id') && $request->room_id) {
            $query->where('room_id', $request->room_id);
        }

        if ($request->has('organizer_id') && $request->organizer_id) {
            $query->where('organizer_id', $request->organizer_id);
        }

        if ($request->has('date') && $request->date) {
            $query->whereDate('start_time', $request->date);
        }

        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%")
                    ->orWhere('agenda', 'like', "%{$searchTerm}%");
            });
        }

        $meetings = $query->paginate(15)->withQueryString();

        return Inertia::render('Meetings/Index', [
            'meetings' => $meetings,
            'rooms' => MeetingRoom::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'organizers' => User::whereHas('organizedMeetings')->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['status', 'room_id', 'organizer_id', 'date', 'search']),
            'statuses' => Meeting::STATUSES,
        ]);
    }

    public function calendar(Request $request)
    {
        return Inertia::render('Meetings/Calendar', [
            'events' => [], // İlk yükleme için boş, AJAX ile doldurulacak
            'rooms' => MeetingRoom::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function calendarEvents(Request $request)
    {
        // FullCalendar'dan gelen tarih parametrelerini güvenli şekilde parse et
        $startParam = $request->get('start');
        $endParam = $request->get('end');

        // Debug için log
        \Log::info('Calendar Events Request', [
            'start_param' => $startParam,
            'end_param' => $endParam
        ]);

        try {
            if ($startParam) {
                // ISO date formatını temizle (sadece tarih kısmını al)
                $startDate = preg_replace('/T.*$/', '', $startParam);
                $start = Carbon::createFromFormat('Y-m-d', $startDate)->startOfDay();
            } else {
                $start = now()->subMonths(3)->startOfMonth();
            }

            if ($endParam) {
                // ISO date formatını temizle (sadece tarih kısmını al)
                $endDate = preg_replace('/T.*$/', '', $endParam);
                $end = Carbon::createFromFormat('Y-m-d', $endDate)->endOfDay();
            } else {
                $end = now()->addMonths(3)->endOfMonth();
            }
        } catch (\Exception $e) {
            // Parsing hatası durumunda varsayılan aralık kullan
            \Log::error('Calendar date parsing error', [
                'error' => $e->getMessage(),
                'start_param' => $startParam,
                'end_param' => $endParam
            ]);

            $start = now()->subMonths(3)->startOfMonth();
            $end = now()->addMonths(3)->endOfMonth();
        }

        $meetings = Meeting::with(['organizer', 'room', 'participants.user'])
            ->whereBetween('start_time', [$start, $end])
            ->where('status', '!=', 'cancelled') // İptal edilenler gösterilmesin
            ->get()
            ->map(function ($meeting) {
                return [
                    'id' => $meeting->id,
                    'title' => $meeting->title,
                    'start' => $meeting->start_time->format('Y-m-d\TH:i:s'),
                    'end' => $meeting->end_time->format('Y-m-d\TH:i:s'),
                    'backgroundColor' => $this->getEventColor($meeting->status),
                    'borderColor' => $this->getEventColor($meeting->status),
                    'extendedProps' => [
                        'meeting' => $meeting,
                        'organizer' => $meeting->organizer->name,
                        'room' => $meeting->room->name ?? 'Online',
                        'participants_count' => $meeting->participants->count(),
                        'status' => $meeting->status,
                        'meeting_type' => $meeting->meeting_type,
                    ]
                ];
            });

        return response()->json($meetings, 200, ['Content-Type' => 'application/json; charset=utf-8'], JSON_UNESCAPED_UNICODE);
    }

    public function create()
    {
        return Inertia::render('Meetings/Create', [
            'rooms' => MeetingRoom::where('is_active', true)->orderBy('name')->get(),
            'users' => User::where('status', true)->orderBy('name')->get(['id', 'name', 'email']),
            'meetingTypes' => Meeting::MEETING_TYPES,
            'recurrencePatterns' => Meeting::RECURRENCE_PATTERNS,
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'room_id' => 'nullable|exists:meeting_rooms,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'meeting_type' => 'required|in:in_person,online,hybrid',
            'online_meeting_link' => 'nullable|url',
            'is_recurring' => 'boolean',
            'recurrence_pattern' => 'nullable|in:daily,weekly,monthly,yearly',
            'recurrence_end_date' => 'nullable|date|after:start_time',
            'agenda' => 'nullable|string',
            'participants' => 'array',
            'participants.*' => 'exists:users,id',
        ]);

        // Toplantı salonunun müsait olup olmadığını kontrol et
        if ($validatedData['room_id']) {
            $room = MeetingRoom::find($validatedData['room_id']);
            $start = Carbon::parse($validatedData['start_time']);
            $end = Carbon::parse($validatedData['end_time']);

            if (!$room->isAvailable($start, $end)) {
                return back()->withErrors(['room_id' => 'Seçilen toplantı salonu bu saatlerde müsait değil.']);
            }
        }

        $validatedData['organizer_id'] = Auth::id();
        $validatedData['status'] = 'scheduled';

        $meeting = Meeting::create($validatedData);

        // Organizatörü katılımcı olarak ekle
        MeetingParticipant::create([
            'meeting_id' => $meeting->id,
            'user_id' => Auth::id(),
            'role' => 'organizer',
            'response_status' => 'accepted',
        ]);

        // Diğer katılımcıları ekle
        if (isset($validatedData['participants'])) {
            foreach ($validatedData['participants'] as $participantId) {
                if ($participantId != Auth::id()) {
                    MeetingParticipant::create([
                        'meeting_id' => $meeting->id,
                        'user_id' => $participantId,
                        'role' => 'attendee',
                        'response_status' => 'pending',
                    ]);
                }
            }
        }

        return redirect()->route('meetings.show', $meeting)
            ->with('success', 'Toplantı başarıyla oluşturuldu.');
    }

    public function show(Meeting $meeting)
    {
        $meeting->load([
            'organizer',
            'room',
            'participants.user',
            'documents.uploader'
        ]);

        return Inertia::render('Meetings/Show', [
            'meeting' => $meeting,
            'canEdit' => $this->canEditMeeting($meeting),
            'userParticipation' => $meeting->participants()
                ->where('user_id', Auth::id())
                ->first(),
        ]);
    }

    public function edit(Meeting $meeting)
    {
        if (!$this->canEditMeeting($meeting)) {
            abort(403, 'Bu toplantıyı düzenleme yetkiniz yok.');
        }

        $meeting->load(['participants']);

        // Mevcut katılımcıları user objelerine dönüştür
        $selectedUsers = $meeting->participants()->with('user')->get()->map(function ($participant) {
            $user = $participant->user;
            if (!$user) {
                return null; // Skip if user doesn't exist
            }
            
            return [
                'id' => $user->id,
                'name' => $user->name ?? '',
                'email' => $user->email ?? '',
                'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'initials' => $this->getUserInitials($user->name ?? 'User'),
            ];
        })->filter(); // Remove null values

        // Ensure proper UTF-8 encoding
        $meetingData = $meeting->toArray();
        array_walk_recursive($meetingData, function (&$value) {
            if (is_string($value)) {
                $value = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
            }
        });

        return Inertia::render('Meetings/Edit', [
            'meeting' => $meetingData,
            'rooms' => MeetingRoom::where('is_active', true)->orderBy('name')->get(),
            'users' => User::where('status', true)->orderBy('name')->get(['id', 'name', 'email']),
            'meetingTypes' => Meeting::MEETING_TYPES,
            'recurrencePatterns' => Meeting::RECURRENCE_PATTERNS,
            'selectedUsers' => $selectedUsers->values(), // Reset array keys
        ]);
    }

    public function update(Request $request, Meeting $meeting)
    {
        if (!$this->canEditMeeting($meeting)) {
            abort(403, 'Bu toplantıyı düzenleme yetkiniz yok.');
        }

        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'room_id' => 'nullable|exists:meeting_rooms,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'meeting_type' => 'required|in:in_person,online,hybrid',
            'online_meeting_link' => 'nullable|url',
            'is_recurring' => 'boolean',
            'recurrence_pattern' => 'nullable|in:daily,weekly,monthly,yearly',
            'recurrence_end_date' => 'nullable|date|after:start_time',
            'agenda' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
            'participants' => 'array',
            'participants.*' => 'exists:users,id',
        ]);

        // Toplantı salonunun müsait olup olmadığını kontrol et (mevcut toplantı hariç)
        if ($validatedData['room_id']) {
            $room = MeetingRoom::find($validatedData['room_id']);
            $start = Carbon::parse($validatedData['start_time']);
            $end = Carbon::parse($validatedData['end_time']);

            // Mevcut toplantı hariç diğer toplantıları kontrol et
            $conflictingMeetings = Meeting::where('room_id', $validatedData['room_id'])
                ->where('id', '!=', $meeting->id)
                ->where('status', '!=', 'cancelled')
                ->where(function ($query) use ($start, $end) {
                    $query->where(function ($q) use ($start, $end) {
                        $q->where('start_time', '<', $end)
                            ->where('end_time', '>', $start);
                    });
                })
                ->exists();

            if ($conflictingMeetings) {
                return back()->withErrors(['room_id' => 'Seçilen toplantı salonu bu saatlerde müsait değil.']);
            }
        }

        $meeting->update($validatedData);

        // Katılımcıları güncelle
        if (isset($validatedData['participants'])) {
            // Organizatör hariç mevcut katılımcıları sil
            $meeting->participants()->where('role', '!=', 'organizer')->delete();

            // Yeni katılımcıları ekle
            foreach ($validatedData['participants'] as $participantId) {
                if ($participantId != $meeting->organizer_id) {
                    MeetingParticipant::firstOrCreate([
                        'meeting_id' => $meeting->id,
                        'user_id' => $participantId,
                    ], [
                        'role' => 'attendee',
                        'response_status' => 'pending',
                    ]);
                }
            }
        }

        return redirect()->route('meetings.show', $meeting)
            ->with('success', 'Toplantı başarıyla güncellendi.');
    }

    public function destroy(Meeting $meeting)
    {
        if (!$this->canEditMeeting($meeting)) {
            abort(403, 'Bu toplantıyı silme yetkiniz yok.');
        }

        $meeting->delete();

        return redirect()->route('meetings.index')
            ->with('success', 'Toplantı başarıyla silindi.');
    }

    public function updateParticipantResponse(Request $request, Meeting $meeting)
    {
        $request->validate([
            'response' => 'required|in:accepted,declined,tentative',
        ]);

        $participant = $meeting->participants()
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $participant->update([
            'response_status' => $request->response
        ]);

        return back()->with('success', 'Katılım durumunuz güncellendi.');
    }

    public function uploadDocument(Request $request, Meeting $meeting)
    {
        $request->validate([
            'document' => 'required|file|max:10240', // 10MB max
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $file = $request->file('document');
        $path = $file->store('meeting-documents/' . $meeting->id, 'public');

        MeetingDocument::create([
            'meeting_id' => $meeting->id,
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $path,
            'file_type' => $file->getClientMimeType(),
            'uploaded_by' => Auth::id(),
        ]);

        return back()->with('success', 'Doküman başarıyla yüklendi.');
    }

    public function downloadDocument(Meeting $meeting, MeetingDocument $document)
    {
        if ($document->meeting_id !== $meeting->id) {
            abort(404);
        }

        if (!Storage::disk('public')->exists($document->file_path)) {
            abort(404, 'Dosya bulunamadı.');
        }

        return Storage::disk('public')->download($document->file_path, $document->title);
    }

    public function deleteDocument(Meeting $meeting, MeetingDocument $document)
    {
        if ($document->meeting_id !== $meeting->id) {
            abort(404);
        }

        if (!$this->canEditMeeting($meeting) && $document->uploaded_by !== Auth::id()) {
            abort(403, 'Bu dokümanı silme yetkiniz yok.');
        }

        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return back()->with('success', 'Doküman başarıyla silindi.');
    }

    private function canEditMeeting(Meeting $meeting): bool
    {
        // Super Admin bypass
        if (Auth::user()->isSuperAdmin()) {
            return true;
        }
        
        return Auth::id() === $meeting->organizer_id || Auth::user()->hasRole('admin');
    }

    public function searchUsers(Request $request)
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([]);
        }
        
        $users = User::where('status', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->orWhere('first_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%");
            })
            ->select('id', 'name', 'email', 'avatar')
            ->limit(20)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name ?? '',
                    'email' => $user->email ?? '',
                    'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                    'initials' => $this->getUserInitials($user->name ?? 'User'),
                ];
            });
        
        return response()->json($users, 200, ['Content-Type' => 'application/json; charset=utf-8'], JSON_UNESCAPED_UNICODE);
    }
    
    private function getUserInitials(string $name): string
    {
        // UTF-8 safe string operations
        $name = trim($name);
        if (empty($name)) {
            return 'U';
        }
        
        $words = explode(' ', $name);
        if (count($words) >= 2) {
            return mb_strtoupper(mb_substr($words[0], 0, 1, 'UTF-8') . mb_substr($words[1], 0, 1, 'UTF-8'), 'UTF-8');
        }
        return mb_strtoupper(mb_substr($name, 0, 2, 'UTF-8'), 'UTF-8');
    }

    private function getEventColor(string $status): string
    {
        return match($status) {
            'scheduled' => '#3788d8',
            'in_progress' => '#28a745',
            'completed' => '#6c757d',
            'cancelled' => '#dc3545',
            default => '#3788d8'
        };
    }
}
