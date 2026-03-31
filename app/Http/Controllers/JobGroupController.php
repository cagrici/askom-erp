<?php

namespace App\Http\Controllers;

use App\Models\MessageGroup as JobGroup;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class JobGroupController extends Controller
{
    /**
     * Check if current user is super admin
     */
    private function isSuperAdmin(): bool
    {
        $user = auth()->user();
        if (!$user) return false;

        // Multiple ways to check super admin status
        $roles = $user->roles->pluck('name')->toArray();
        return in_array('super admin', $roles) ||
               in_array('Super Admin', $roles) ||
               $user->hasRole('Super Admin') ||
               $user->id == 1; // Fallback: User ID 1 is always super admin
    }

    /**
     * Authorize with super admin bypass
     */
    private function authorizeWithBypass(string $permission): void
    {
        // If user is super admin, skip all authorization
        if ($this->isSuperAdmin()) {
            return;
        }

        // For non-super admin users, check the permission
        $this->authorize($permission);
    }
    public function index(Request $request)
    {
        $user = Auth::user();

        $groups = JobGroup::query()
            ->where('is_active', true)
            ->whereHas('participants', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['creator', 'participants' => function ($query) {
                $query->limit(5)->withPivot('role');
            }])
            ->withCount('participants')
            ->latest()
            ->get()
            ->map(function ($group) {
                // Convert role to is_admin for backward compatibility
                if ($group->participants) {
                    $group->participants->map(function ($participant) {
                        $participant->pivot->is_admin = $participant->pivot->role === 'admin';
                        return $participant;
                    });
                }
                // Add members alias for frontend compatibility
                $group->members = $group->participants;
                $group->members_count = $group->participants_count;
                return $group;
            });

        if ($request->wantsJson()) {
            return response()->json([
                'groups' => $groups
            ]);
        }

        return redirect()->route('job-requests.index');
    }

    public function store(Request $request)
    {
        $this->authorizeWithBypass('create job groups');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'exists:users,id',
            'department_id' => 'nullable|exists:departments,id'
        ]);

        DB::transaction(function () use ($validated) {
            $group = JobGroup::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'created_by' => Auth::id(),
                'department_id' => $validated['department_id'] ?? Auth::user()->department_id ?? null,
                'is_active' => true,
                'type' => 'project'
            ]);

            // Add creator as admin
            $group->participants()->attach(Auth::id(), [
                'role' => 'admin',
                'last_read_at' => now()
            ]);

            // Add other participants
            foreach ($validated['participant_ids'] as $userId) {
                if ($userId != Auth::id()) {
                    $group->participants()->attach($userId, [
                        'role' => 'member',
                        'last_read_at' => now()
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'İş grubu başarıyla oluşturuldu.');
    }

    public function show($jobGroupId)
    {
        \Log::info('JobGroup Show Called', [
            'job_group_id' => $jobGroupId,
            'request_url' => request()->fullUrl(),
            'user_id' => auth()->id()
        ]);

        $jobGroup = JobGroup::findOrFail($jobGroupId);
        $this->authorizeWithBypass('view job groups');

        $jobGroup->load(['creator', 'department', 'participants' => function($query) {
            $query->select('users.id', 'users.name', 'users.last_name', 'users.email')
                  ->withPivot('role');
        }]);

        // Convert role to is_admin for backward compatibility
        if ($jobGroup->participants) {
            $jobGroup->participants->map(function ($participant) {
                $participant->pivot->is_admin = $participant->pivot->role === 'admin';
                return $participant;
            });
        }

        // Add members alias for frontend compatibility
        $jobGroup->members = $jobGroup->participants;
        $jobGroup->members_count = $jobGroup->participants->count();

        // Debug logging
        \Log::info('JobGroup Show Response', [
            'group_id' => $jobGroup->id,
            'participants_count' => $jobGroup->participants->count(),
            'members_count' => $jobGroup->members_count,
            'has_members' => !empty($jobGroup->members),
            'members_sample' => $jobGroup->members->take(3)->toArray()
        ]);

        return response()->json([
            'group' => $jobGroup
        ]);
    }

    public function update(Request $request, $jobGroupId)
    {
        $jobGroup = JobGroup::findOrFail($jobGroupId);
        $this->authorizeWithBypass('update job groups');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        $jobGroup->update($validated);

        // Return JSON response for AJAX requests
        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'İş grubu güncellendi.',
                'group' => $jobGroup->fresh()
            ]);
        }

        return redirect()->back()->with('success', 'İş grubu güncellendi.');
    }

    public function destroy($jobGroupId)
    {
        $jobGroup = JobGroup::findOrFail($jobGroupId);
        $this->authorizeWithBypass('delete job groups');

        // Soft delete the group
        $jobGroup->delete();

        return response()->json([
            'message' => 'İş grubu başarıyla silindi.'
        ]);
    }

    public function addMember(Request $request, $jobGroupId)
    {
        $jobGroup = JobGroup::findOrFail($jobGroupId);

        // Debug logging
        $user = auth()->user();
        \Log::info('AddMember Debug', [
            'user_id' => $user?->id,
            'user_roles' => $user?->roles->pluck('name')->toArray(),
            'is_super_admin' => $this->isSuperAdmin(),
            'job_group_id' => $jobGroupId,
            'request_user_id' => $request->get('user_id')
        ]);

        $this->authorizeWithBypass('manage job group members');

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::find($validated['user_id']);

        if ($jobGroup->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Kullanıcı zaten grupta.'], 400);
        }

        $jobGroup->participants()->attach($user->id, [
            'role' => 'member',
            'last_read_at' => now()
        ]);

        return response()->json(['message' => 'Kullanıcı gruba eklendi.']);
    }

    public function removeMember(Request $request, $jobGroupId)
    {
        $jobGroup = JobGroup::findOrFail($jobGroupId);
        $this->authorizeWithBypass('manage job group members');

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::find($validated['user_id']);

        if (!$jobGroup->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Kullanıcı grupta değil.'], 400);
        }

        // Prevent removing the last admin
        $userParticipant = $jobGroup->participants()->where('user_id', $user->id)->first();
        if ($userParticipant && $userParticipant->pivot->role === 'admin') {
            $adminCount = $jobGroup->participants()->wherePivot('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Son yönetici gruptan çıkarılamaz.'], 400);
            }
        }

        $jobGroup->participants()->detach($user->id);

        return response()->json(['message' => 'Kullanıcı gruptan çıkarıldı.']);
    }

    public function makeAdmin(Request $request, $jobGroupId)
    {
        $jobGroup = JobGroup::findOrFail($jobGroupId);
        $this->authorizeWithBypass('manage job group members');

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::find($validated['user_id']);

        if (!$jobGroup->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Kullanıcı grupta değil.'], 400);
        }

        // Check current admin status
        $userParticipant = $jobGroup->participants()->where('user_id', $user->id)->first();
        $currentIsAdmin = $userParticipant && $userParticipant->pivot->role === 'admin';

        if ($currentIsAdmin) {
            // Remove admin status
            $jobGroup->participants()->updateExistingPivot($user->id, ['role' => 'member']);
            $message = 'Kullanıcının yönetici yetkisi kaldırıldı.';
        } else {
            // Make admin
            $jobGroup->participants()->updateExistingPivot($user->id, ['role' => 'admin']);
            $message = 'Kullanıcı yönetici yapıldı.';
        }

        return response()->json(['message' => $message]);
    }

    public function getMessages(Request $request, $jobGroupId)
    {
        $jobGroup = JobGroup::findOrFail($jobGroupId);
        $this->authorizeWithBypass('view job group messages');

        $query = $jobGroup->messages()
            ->with(['user', 'attachments', 'parent.user'])
            ->select('messages.*'); // Ensure we get all columns including mentions

        // Yeni mesajları almak için after_id parametresi
        if ($request->has('after_id')) {
            $query->where('messages.id', '>', $request->get('after_id'));
        }

        $messages = $query->oldest() // Eski mesajlardan yeniye doğru sıralama
            ->paginate(50);

        return response()->json($messages);
    }

    public function sendMessage(Request $request, $jobGroupId)
    {
        $jobGroup = JobGroup::findOrFail($jobGroupId);
        $this->authorizeWithBypass('send job group messages');

        $validated = $request->validate([
            'content' => 'required_without:attachments|string',
            'type' => 'required|in:text,file,audio',
            'parent_id' => 'nullable|exists:messages,id',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240' // 10MB max
        ]);

        DB::transaction(function () use ($validated, $jobGroup, $request) {
            // Parse mentions from content if column exists
            $messageData = [
                'user_id' => Auth::id(),
                'content' => $validated['content'] ?? '',
                'type' => $validated['type'],
                'parent_id' => $validated['parent_id'] ?? null
            ];

            // Only add mentions if the column exists
            if (\Schema::hasColumn('messages', 'mentions')) {
                $mentions = $this->parseMentions($validated['content'] ?? '', $jobGroup);
                $messageData['mentions'] = $mentions;
            }

            $message = $jobGroup->messages()->create($messageData);

            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('job-groups/' . $jobGroup->id, 'public');

                    $message->attachments()->create([
                        'filename' => basename($path),
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                        'path' => 'storage/' . $path
                    ]);
                }
            }
        });

        return response()->json(['message' => 'Mesaj gönderildi.']);
    }

    public function getAvailableUsers(Request $request)
    {
        $user = Auth::user();
        $locationId = $request->get('location_id');
        $search = $request->get('search');

        $query = User::query()
            ->where('status', 1)
            ->where('id', '!=', $user->id);

        // Eğer location_id parametresi gönderildiyse ona göre filtrele
        if ($locationId) {
            $query->where('location_id', $locationId);
        } elseif ($user->location_id) {
            // Parametrede yoksa kullanıcının lokasyonuna göre filtrele
            $query->where('location_id', $user->location_id);
        }

        // Search functionality
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', '%' . $search . '%')
                  ->orWhere('last_name', 'LIKE', '%' . $search . '%')
                  ->orWhere('email', 'LIKE', '%' . $search . '%');
            });
        }

        $users = $query->select('id', 'name', 'last_name', 'email')
            ->orderBy('name')
            ->limit(20) // Limit results for autocomplete
            ->get();

        return response()->json($users);
    }

    public function getMembers($jobGroupId)
    {
        $jobGroup = JobGroup::findOrFail($jobGroupId);
        $this->authorizeWithBypass('view job groups');

        $members = $jobGroup->participants()
            ->select('users.id', 'users.name', 'users.last_name', 'users.email', 'users.avatar')
            ->withPivot('role', 'created_at', 'last_read_at')
            ->orderBy('message_group_participants.role', 'desc')
            ->orderBy('users.name')
            ->get()
            ->map(function ($member) {
                // Convert role to is_admin for backward compatibility
                $member->pivot->is_admin = $member->pivot->role === 'admin';
                return $member;
            });

        return response()->json([
            'members' => $members
        ]);
    }

    /**
     * Parse mentions from message content
     */
    private function parseMentions(string $content, JobGroup $jobGroup): array
    {
        $mentions = [];

        // Find all @mentions in the content
        preg_match_all('/@([a-zA-Z0-9._-]+)/', $content, $matches);

        if (!empty($matches[1])) {
            $mentionNames = $matches[1];

            // Get all group members
            $groupMembers = $jobGroup->participants()
                ->select('users.id', 'users.name', 'users.last_name', 'users.email')
                ->get();

            foreach ($mentionNames as $mentionName) {
                // Find matching user in group members
                $mentionedUser = $groupMembers->first(function ($user) use ($mentionName) {
                    $fullName = $user->name ?: trim($user->first_name . ' ' . $user->last_name);
                    return strtolower($fullName) === strtolower($mentionName) ||
                           strtolower($user->email) === strtolower($mentionName);
                });

                if ($mentionedUser) {
                    $mentions[] = [
                        'user_id' => $mentionedUser->id,
                        'username' => $mentionName,
                        'display_name' => $mentionedUser->name ?: trim($mentionedUser->first_name . ' ' . $mentionedUser->last_name)
                    ];
                }
            }
        }

        return array_unique($mentions, SORT_REGULAR);
    }

    /**
     * Search across all user's groups to find a message
     */
    public function globalSearch(Request $request)
    {
        $this->authorizeWithBypass('search job group messages');

        $validated = $request->validate([
            'query' => 'required|string|max:255'
        ]);

        $user = Auth::user();
        $searchTerm = $validated['query'];

        // Get all groups user is member of
        $userGroups = JobGroup::query()
            ->where('is_active', true)
            ->whereHas('participants', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->pluck('id');

        // Search messages across all user's groups
        $messages = Message::query()
            ->whereIn('message_group_id', $userGroups)
            ->where('content', 'LIKE', '%' . $searchTerm . '%')
            ->with(['user:id,name,last_name,email,avatar', 'group:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        \Log::info('=== GLOBAL SEARCH DEBUG ===', [
            'search_query' => $searchTerm,
            'user_groups' => $userGroups->toArray(),
            'results_count' => $messages->count(),
            'results_by_group' => $messages->groupBy('job_group_id')->map(function($groupMessages) {
                return [
                    'group_name' => $groupMessages->first()->jobGroup->name,
                    'count' => $groupMessages->count(),
                    'messages' => $groupMessages->pluck('content')->toArray()
                ];
            })
        ]);

        return response()->json([
            'messages' => $messages,
            'total' => $messages->count(),
            'groups_searched' => $userGroups->count()
        ]);
    }

    /**
     * Search messages in a job group
     */
    public function search(Request $request, $jobGroupId)
    {
        $jobGroup = JobGroup::findOrFail($jobGroupId);
        $this->authorizeWithBypass('search job group messages');

        $validated = $request->validate([
            'query' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'user_id' => 'nullable|exists:users,id',
            'file_type' => 'nullable|in:all,image,audio,document,video',
            'has_mentions' => 'nullable|boolean',
            'has_attachments' => 'nullable|boolean'
        ]);

        // Debug logging
        \Log::info('=== JOB GROUP SEARCH DEBUG ===', [
            'job_group_id' => $jobGroup->id,
            'job_group_name' => $jobGroup->name,
            'search_query' => $validated['query'] ?? 'none',
            'user_id' => Auth::id(),
            'validated_data' => $validated,
            'request_url' => $request->fullUrl()
        ]);

        $query = $jobGroup->messages()
            ->with(['user:id,name,last_name,email,avatar', 'attachments'])
            ->select('messages.*');

        // Text search in content
        if (!empty($validated['query'])) {
            $searchTerm = $validated['query'];
            $query->where('messages.content', 'LIKE', '%' . $searchTerm . '%');
        }

        // Date range filter
        if (!empty($validated['date_from'])) {
            $query->whereDate('messages.created_at', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('messages.created_at', '<=', $validated['date_to']);
        }

        // User filter
        if (!empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        // File type filter
        if (!empty($validated['file_type']) && $validated['file_type'] !== 'all') {
            $query->whereHas('attachments', function ($attachmentQuery) use ($validated) {
                switch ($validated['file_type']) {
                    case 'image':
                        $attachmentQuery->where('mime_type', 'LIKE', 'image/%');
                        break;
                    case 'audio':
                        $attachmentQuery->where('mime_type', 'LIKE', 'audio/%');
                        break;
                    case 'video':
                        $attachmentQuery->where('mime_type', 'LIKE', 'video/%');
                        break;
                    case 'document':
                        $attachmentQuery->where(function ($docQuery) {
                            $docQuery->where('mime_type', 'LIKE', 'application/pdf')
                                    ->orWhere('mime_type', 'LIKE', 'application/msword')
                                    ->orWhere('mime_type', 'LIKE', 'application/vnd.openxmlformats%')
                                    ->orWhere('mime_type', 'LIKE', 'text/%');
                        });
                        break;
                }
            });
        }

        // Mentions filter
        if (!empty($validated['has_mentions'])) {
            // Check if mentions column exists in the table
            if (\Schema::hasColumn('messages', 'mentions')) {
                $query->whereNotNull('mentions')
                      ->where('mentions', '!=', '[]')
                      ->where('mentions', '!=', 'null');
            }
        }

        // Attachments filter
        if (!empty($validated['has_attachments'])) {
            $query->whereHas('attachments');
        }

        // Get results ordered by newest first
        $messages = $query->orderBy('messages.created_at', 'desc')
                         ->limit(50)
                         ->get();

        // Debug logging
        \Log::info('=== SEARCH RESULTS DEBUG ===', [
            'job_group_id' => $jobGroup->id,
            'job_group_name' => $jobGroup->name,
            'results_count' => $messages->count(),
            'first_result_content' => $messages->first()?->content,
            'first_result_group_id' => $messages->first()?->job_group_id,
            'all_results_content' => $messages->pluck('content')->toArray()
        ]);

        return response()->json([
            'messages' => $messages,
            'total' => $messages->count()
        ]);
    }
}
