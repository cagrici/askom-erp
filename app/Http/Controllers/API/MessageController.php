<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageGroup;
use App\Models\MessageAttachment;
use App\Models\MessageGroupActivity;
use App\Models\WorkCategory;
use App\Models\User;
use App\Notifications\TaskAssigned;
use App\Notifications\TaskStatusChanged;
use App\Notifications\NewTaskCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Notification;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $groups = MessageGroup::with(['latestMessage.user', 'department', 'assignedUser', 'category'])
            ->forUser(auth()->id())
            ->active()
            ->withCount(['messages' => function ($query) {
                $query->where('created_at', '>', function ($subQuery) {
                    $subQuery->select('last_read_at')
                        ->from('message_group_participants')
                        ->whereColumn('message_group_id', 'message_groups.id')
                        ->where('user_id', auth()->id());
                })->where('user_id', '!=', auth()->id());
            }])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'groups' => $groups->map(function ($group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'type' => $group->type,
                    'department' => $group->department,
                    'unread_count' => $group->messages_count,
                    'latest_message' => $group->latestMessage->first(),
                    'status' => $group->status,
                    'priority' => $group->priority,
                    'assigned_to' => $group->assigned_to,
                    'assigned_user' => $group->assignedUser,
                    'due_date' => $group->due_date,
                    'category' => $group->category,
                    'is_overdue' => $group->isOverdue(),
                    'status_color' => $group->status_color,
                    'priority_color' => $group->priority_color,
                ];
            }),
        ]);
    }

    public function getGroupMessages(Request $request, MessageGroup $group)
    {
        // $this->authorize('view', $group); // Geçici olarak kapatıldı

        $query = $group->messages()
            ->withUserAndAttachments()
            ->with('parent.user');

        // Eğer 'after' parametresi varsa, sadece o ID'den sonraki mesajları getir
        if ($request->has('after')) {
            $afterId = $request->get('after');
            $query->where('id', '>', $afterId)
                  ->orderBy('created_at', 'asc'); // Yeni mesajlar için ASC sıralama
            
            $messages = $query->get(); // Pagination yok, sadece yeni mesajları al
        } else {
            // Normal durumda pagination ile eskiden yeniye sıralama (JobGroupChat ile tutarlı)
            $query->orderBy('created_at', 'asc');
            $messages = $query->paginate(50);
        }

        // Add URL to attachments
        $collection = $request->has('after') ? $messages : $messages->getCollection();
        $collection->transform(function ($message) {
            if ($message->attachments) {
                $message->attachments->transform(function ($attachment) {
                    $attachment->url = $attachment->url;
                    return $attachment;
                });
            }
            return $message;
        });

        // Update last read timestamp and mark messages as read (sadece normal isteklerde)
        if (!$request->has('after')) {
            $group->participants()->updateExistingPivot(auth()->id(), [
                'last_read_at' => now(),
            ]);

            // Mark messages as read for current user
            $messageIds = $collection->pluck('id');
            Message::whereIn('id', $messageIds)
                ->where('user_id', '!=', auth()->id())
                ->whereNull('read_at')
                ->update(['read_at' => now(), 'status' => 'read']);
        }

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        try {
            \Log::info('Message store request:', $request->all());
            
            $validated = $request->validate([
                'message_group_id' => 'required|exists:message_groups,id',
                'content' => 'nullable|string',
                'parent_id' => 'nullable|exists:messages,id',
                'attachments' => 'nullable|array',
                'attachments.*' => 'file|max:10240', // 10MB max
                'audio_duration' => 'nullable|integer|min:1|max:300', // 5 dakika max
                'is_audio' => 'nullable|in:true,false,1,0',
            ]);
            
            \Log::info('Validation passed:', $validated);
        } catch (\Exception $e) {
            \Log::error('Validation failed:', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 422);
        }

        $group = MessageGroup::findOrFail($validated['message_group_id']);
        // $this->authorize('participate', $group); // Geçici olarak kapatıldı

        DB::beginTransaction();
        try {
            \Log::info('Creating message for user:', ['user_id' => auth()->id(), 'group_id' => $group->id]);
            
            $messageType = 'text';
            if ($request->hasFile('attachments')) {
                $isAudio = in_array($validated['is_audio'] ?? '', ['true', '1', 1, true], true);
                $messageType = $isAudio ? 'audio' : 'file';
            }

            $message = Message::create([
                'message_group_id' => $group->id,
                'user_id' => auth()->id(),
                'content' => $validated['content'] ?? '',
                'parent_id' => $validated['parent_id'] ?? null,
                'type' => $messageType,
                'status' => 'sent',
                'delivered_at' => now(),
            ]);

            \Log::info('Message created:', ['message_id' => $message->id]);

            if ($request->hasFile('attachments')) {
                \Log::info('Processing attachments:', ['count' => count($request->file('attachments'))]);
                
                foreach ($request->file('attachments') as $file) {
                    try {
                        // Get ALL file info BEFORE moving
                        $originalName = $file->getClientOriginalName();
                        $mimeType = $file->getMimeType();
                        $size = $file->getSize();
                        
                        // Force correct MIME type for audio files
                        if ($messageType === 'audio' || in_array($validated['is_audio'] ?? '', ['true', '1', 1, true], true)) {
                            if (str_contains($originalName, '.webm')) {
                                $mimeType = 'audio/webm';
                            } elseif (str_contains($originalName, '.ogg')) {
                                $mimeType = 'audio/ogg';
                            } elseif (str_contains($originalName, '.mp3')) {
                                $mimeType = 'audio/mpeg';
                            } elseif (str_contains($originalName, '.wav')) {
                                $mimeType = 'audio/wav';
                            } elseif (!str_starts_with($mimeType, 'audio/')) {
                                $mimeType = 'audio/webm'; // Default fallback
                            }
                        }
                        
                        // Save directly to public path for immediate access
                        $fileName = time() . '_' . $originalName;
                        $publicPath = 'uploads/messages/' . $group->id;
                        
                        // Create directory if it doesn't exist
                        $fullPath = public_path($publicPath);
                        if (!file_exists($fullPath)) {
                            mkdir($fullPath, 0755, true);
                        }
                        
                        // Move the file
                        $file->move($fullPath, $fileName);
                        $path = $publicPath . '/' . $fileName;
                        
                        \Log::info('File moved successfully:', ['path' => $path]);
                        
                        MessageAttachment::create([
                            'message_id' => $message->id,
                            'filename' => $fileName,
                            'original_name' => $originalName,
                            'mime_type' => $mimeType,
                            'size' => $size,
                            'path' => $path,
                            'duration' => $messageType === 'audio' ? ($validated['audio_duration'] ?? null) : null,
                        ]);
                        
                        \Log::info('Attachment created successfully');
                        
                    } catch (\Exception $fileError) {
                        \Log::error('File processing error:', ['error' => $fileError->getMessage()]);
                        throw $fileError;
                    }
                }
            }

            DB::commit();

            $message->load(['user', 'attachments', 'parent.user']);
            
            // Add URL to attachments
            $message->attachments->transform(function ($attachment) {
                $attachment->url = $attachment->url;
                return $attachment;
            });

            \Log::info('Message sent successfully:', ['message_id' => $message->id]);
            
            return response()->json($message, 201);
        } catch (\Exception $e) {
            \Log::error('Message creation failed:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            DB::rollBack();
            return response()->json(['error' => 'Failed to send message: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Message $message)
    {
        $this->authorize('update', $message);

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $message->update([
            'content' => $validated['content'],
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        return response()->json($message);
    }

    public function destroy(Message $message)
    {
        $this->authorize('delete', $message);

        $message->delete();

        return response()->json(['message' => 'Message deleted successfully']);
    }

    public function search(Request $request)
    {
        $validated = $request->validate([
            'query' => 'nullable|string|min:1',
            'group_id' => 'nullable|exists:message_groups,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'file_type' => 'nullable|in:image,audio,document,all',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $query = Message::query()
            ->withUserAndAttachments()
            ->with('parent.user');

        // Kullanıcının katıldığı gruplarda arama yap
        $userGroupIds = auth()->user()->messageGroups()->pluck('message_groups.id');
        $query->whereIn('message_group_id', $userGroupIds);

        // Belirli grup filtreleme
        if (!empty($validated['group_id'])) {
            $query->where('message_group_id', $validated['group_id']);
        }

        // Metin arama
        if (!empty($validated['query'])) {
            $query->where('content', 'LIKE', '%' . $validated['query'] . '%');
        }

        // Tarih filtreleme
        if (!empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }
        if (!empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        // Dosya türü filtreleme
        if (!empty($validated['file_type']) && $validated['file_type'] !== 'all') {
            switch ($validated['file_type']) {
                case 'image':
                    $query->where('type', 'file')
                          ->whereHas('attachments', function ($q) {
                              $q->where('mime_type', 'LIKE', 'image/%');
                          });
                    break;
                case 'audio':
                    $query->where('type', 'audio');
                    break;
                case 'document':
                    $query->where('type', 'file')
                          ->whereHas('attachments', function ($q) {
                              $q->where('mime_type', 'NOT LIKE', 'image/%')
                                ->where('mime_type', 'NOT LIKE', 'audio/%');
                          });
                    break;
            }
        }

        $messages = $query->orderBy('created_at', 'desc')
                         ->limit($validated['limit'] ?? 50)
                         ->get();

        // Add URL to attachments
        $messages->transform(function ($message) {
            if ($message->attachments) {
                $message->attachments->transform(function ($attachment) {
                    $attachment->url = $attachment->url;
                    return $attachment;
                });
            }
            return $message;
        });

        return response()->json([
            'messages' => $messages,
            'count' => $messages->count(),
        ]);
    }

    public function deletedMessages(Request $request)
    {
        // Only admins can view deleted messages
        if (!auth()->user()->hasRole('admin')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $deletedMessages = Message::onlyTrashed()
            ->withUserAndAttachments()
            ->with(['group:id,name', 'parent.user'])
            ->orderBy('deleted_at', 'desc')
            ->paginate(50);

        // Add URL to attachments
        $deletedMessages->getCollection()->transform(function ($message) {
            if ($message->attachments) {
                $message->attachments->transform(function ($attachment) {
                    $attachment->url = $attachment->url;
                    return $attachment;
                });
            }
            return $message;
        });

        return response()->json($deletedMessages);
    }

    public function updateGroupStatus(Request $request, MessageGroup $group)
    {
        // $this->authorize('participate', $group); // Geçici olarak kapatıldı

        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,completed,cancelled',
            'completion_note' => 'required_if:status,completed|nullable|string',
        ]);

        $oldStatus = $group->status;

        try {
            $group->status = $validated['status'];
            
            if ($validated['status'] === 'completed') {
                $group->completed_at = now();
                $group->completion_note = $validated['completion_note'] ?? null;
            } elseif ($oldStatus === 'completed' && $validated['status'] !== 'completed') {
                // Reopening
                $group->completed_at = null;
                $group->completion_note = null;
            }
            
            $group->save();

            // Send status change notification
            try {
                $this->sendStatusChangeNotifications($group, auth()->user(), $oldStatus, $validated['status'], $validated['completion_note'] ?? null);
                \Log::info('Status change notification sent successfully', [
                    'group_id' => $group->id,
                    'old_status' => $oldStatus,
                    'new_status' => $validated['status'],
                    'changed_by' => auth()->user()->id
                ]);
            } catch (\Exception $notificationError) {
                \Log::error('Failed to send status change notification: ' . $notificationError->getMessage());
                // Don't fail the entire request if notification fails
            }

            return response()->json([
                'message' => 'Status updated successfully',
                'group' => $group->load(['assignedUser', 'category']),
            ]);
        } catch (\Exception $e) {
            \Log::error('Status update failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update status: ' . $e->getMessage()], 500);
        }
    }

    public function assignGroup(Request $request, MessageGroup $group)
    {
        // $this->authorize('participate', $group); // Geçici olarak kapatıldı

        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $assignedUser = User::find($validated['assigned_to']);
        $oldAssignedTo = $group->assigned_to;

        try {
            $group->assigned_to = $validated['assigned_to'];
            $group->save();

            // Add user to participants if not already
            if (!$group->participants()->where('user_id', $validated['assigned_to'])->exists()) {
                $group->participants()->attach($validated['assigned_to'], ['role' => 'member']);
            }

            // Send assignment notification
            try {
                $assignedUser->notify(new TaskAssigned($group, auth()->user()));
                \Log::info('Assignment notification sent successfully', [
                    'assigned_user_id' => $assignedUser->id,
                    'group_id' => $group->id,
                    'assigned_by' => auth()->user()->id
                ]);
            } catch (\Exception $notificationError) {
                \Log::error('Failed to send assignment notification: ' . $notificationError->getMessage());
                // Don't fail the entire request if notification fails
            }

            return response()->json([
                'message' => 'Assigned successfully',
                'group' => $group->load(['assignedUser']),
            ]);
        } catch (\Exception $e) {
            \Log::error('Assignment failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'error' => 'Failed to assign user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateGroupPriority(Request $request, MessageGroup $group)
    {
        $this->authorize('participate', $group);

        $validated = $request->validate([
            'priority' => 'required|in:low,medium,high,urgent',
        ]);

        $oldPriority = $group->priority;

        DB::beginTransaction();
        try {
            $group->priority = $validated['priority'];
            $group->save();

            // Log activity
            $group->logActivity(
                MessageGroupActivity::ACTION_PRIORITY_CHANGED,
                [
                    'old_priority' => $oldPriority,
                    'new_priority' => $validated['priority'],
                ]
            );

            DB::commit();

            return response()->json([
                'message' => 'Priority updated successfully',
                'group' => $group,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update priority'], 500);
        }
    }

    public function updateGroupDueDate(Request $request, MessageGroup $group)
    {
        $this->authorize('participate', $group);

        $validated = $request->validate([
            'due_date' => 'nullable|date|after:today',
        ]);

        $oldDueDate = $group->due_date;

        DB::beginTransaction();
        try {
            $group->due_date = $validated['due_date'];
            $group->save();

            // Log activity
            $group->logActivity(
                MessageGroupActivity::ACTION_DUE_DATE_CHANGED,
                [
                    'old_due_date' => $oldDueDate,
                    'new_due_date' => $validated['due_date'],
                ]
            );

            DB::commit();

            return response()->json([
                'message' => 'Due date updated successfully',
                'group' => $group,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update due date'], 500);
        }
    }

    public function getWorkStatistics(Request $request)
    {
        $userId = auth()->id();
        
        // My tasks
        $myTasks = MessageGroup::assignedTo($userId)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Tasks I created
        $createdByMe = MessageGroup::where('created_by', $userId)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Overdue tasks
        $overdueTasks = MessageGroup::assignedTo($userId)
            ->overdue()
            ->count();

        // This week's completed tasks
        $weekCompleted = MessageGroup::assignedTo($userId)
            ->completed()
            ->where('completed_at', '>=', now()->startOfWeek())
            ->count();

        // By priority
        $byPriority = MessageGroup::assignedTo($userId)
            ->whereIn('status', ['open', 'in_progress'])
            ->selectRaw('priority, count(*) as count')
            ->groupBy('priority')
            ->pluck('count', 'priority')
            ->toArray();

        // By category
        $byCategory = MessageGroup::assignedTo($userId)
            ->whereIn('status', ['open', 'in_progress'])
            ->join('work_categories', 'message_groups.category_id', '=', 'work_categories.id')
            ->selectRaw('work_categories.name as category, count(*) as count')
            ->groupBy('work_categories.name')
            ->pluck('count', 'category')
            ->toArray();

        return response()->json([
            'my_tasks' => $myTasks,
            'created_by_me' => $createdByMe,
            'overdue_count' => $overdueTasks,
            'week_completed' => $weekCompleted,
            'by_priority' => $byPriority,
            'by_category' => $byCategory,
        ]);
    }

    public function getCategories()
    {
        $categories = WorkCategory::active()->ordered()->get();
        return response()->json($categories);
    }

    public function createGroup(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:department,private,project',
            'description' => 'nullable|string',
            'department_id' => 'required_if:type,department|exists:departments,id',
            'participant_ids' => 'nullable|array',
            'participant_ids.*' => 'exists:users,id',
            'department_ids' => 'nullable|array',
            'department_ids.*' => 'exists:departments,id',
            'category_id' => 'nullable|exists:work_categories,id',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date|after:today',
        ]);

        DB::beginTransaction();
        try {
            $group = MessageGroup::create([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'description' => $validated['description'] ?? null,
                'department_id' => $validated['department_id'] ?? null,
                'created_by' => auth()->id(),
                'category_id' => $validated['category_id'] ?? null,
                'priority' => $validated['priority'] ?? 'medium',
                'assigned_to' => $validated['assigned_to'] ?? null,
                'due_date' => $validated['due_date'] ?? null,
                'status' => 'open',
            ]);

            // Add creator as admin
            $group->participants()->attach(auth()->id(), ['role' => 'admin']);

            $allParticipantIds = [];

            // Add selected users
            if (!empty($validated['participant_ids'])) {
                $allParticipantIds = array_merge($allParticipantIds, $validated['participant_ids']);
            }

            // Add department users
            if (!empty($validated['department_ids'])) {
                $departmentUserIds = \App\Models\User::whereIn('department_id', $validated['department_ids'])
                    ->pluck('id')
                    ->toArray();
                $allParticipantIds = array_merge($allParticipantIds, $departmentUserIds);
            }

            // Handle legacy department selection
            if ($validated['type'] === 'department' && $validated['department_id']) {
                $departmentUserIds = \App\Models\User::where('department_id', $validated['department_id'])
                    ->pluck('id')
                    ->toArray();
                $allParticipantIds = array_merge($allParticipantIds, $departmentUserIds);
            }

            // Remove duplicates and creator
            $allParticipantIds = array_unique($allParticipantIds);
            $allParticipantIds = array_filter($allParticipantIds, function($id) {
                return $id != auth()->id();
            });

            // Add participants
            foreach ($allParticipantIds as $userId) {
                $group->participants()->attach($userId, ['role' => 'member']);
            }

            // Create initial message with description if provided
            if (!empty($validated['description'])) {
                Message::create([
                    'message_group_id' => $group->id,
                    'user_id' => auth()->id(),
                    'content' => $validated['description'],
                    'type' => 'text',
                    'status' => 'sent',
                    'delivered_at' => now(),
                ]);
            }

            DB::commit();

            // Send notifications to all participants about new task
            try {
                $participants = User::whereIn('id', $allParticipantIds)->get();
                Notification::send($participants, new NewTaskCreated($group, auth()->user()));
            } catch (\Exception $notificationError) {
                \Log::error('Failed to send new task notification: ' . $notificationError->getMessage());
                // Don't fail the entire request if notification fails
            }

            return response()->json($group->load('participants'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Group creation failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to create group: ' . $e->getMessage()], 500);
        }
    }

    private function sendStatusChangeNotifications(MessageGroup $group, User $changedBy, string $oldStatus, string $newStatus, ?string $completionNote = null)
    {
        // Get all participants except the one who made the change
        $participants = $group->participants()
            ->where('user_id', '!=', $changedBy->id)
            ->get();

        // Send notification to all participants
        Notification::send($participants, new TaskStatusChanged($group, $changedBy, $oldStatus, $newStatus, $completionNote));

        // If task is assigned and assignee is not in participants, notify assignee separately
        if ($group->assigned_to && !$participants->contains('id', $group->assigned_to)) {
            $assignedUser = User::find($group->assigned_to);
            if ($assignedUser && $assignedUser->id !== $changedBy->id) {
                $assignedUser->notify(new TaskStatusChanged($group, $changedBy, $oldStatus, $newStatus, $completionNote));
            }
        }
    }

    /**
     * Get message group participants/members
     */
    public function getGroupMembers($groupId)
    {
        $group = MessageGroup::findOrFail($groupId);
        
        // Check if user is participant
        if (!$group->participants()->where('user_id', auth()->id())->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $members = $group->participants()
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
}