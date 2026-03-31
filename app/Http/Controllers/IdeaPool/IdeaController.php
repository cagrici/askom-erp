<?php

namespace App\Http\Controllers\IdeaPool;

use App\Http\Controllers\Controller;
use App\Models\IdeaPool\Idea;
use App\Models\Category;
use App\Models\IdeaPool\IdeaAttachment;
use App\Models\IdeaPool\IdeaVote;
use App\Models\Department;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class IdeaController extends Controller
{
    /**
     * Display a listing of the ideas.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $ideas = Idea::with(['user:id,name,email,avatar', 'category:id,name,color,icon', 'department:id,name', 'tags:id,name'])
            ->withCount(['votes', 'comments'])
            ->byStatus($request->status)
            ->byCategory($request->category_id)
            ->byDepartment($request->department_id)
            ->byTag($request->tag_id)
            ->search($request->search)
            ->orderBy($request->sort_by ?? 'created_at', $request->sort_direction ?? 'desc')
            ->paginate($request->per_page ?? 10)
            ->withQueryString();

        $categories = Category::where('type', 'idea')->active()->get();
        $departments = Department::all();
        $tags = Tag::where('type', 'idea')->get();

        $filters = [
            'status' => $request->status,
            'category_id' => $request->category_id,
            'department_id' => $request->department_id,
            'tag_id' => $request->tag_id,
            'search' => $request->search,
            'sort_by' => $request->sort_by ?? 'created_at',
            'sort_direction' => $request->sort_direction ?? 'desc',
            'per_page' => $request->per_page ?? 10,
        ];

        return Inertia::render('IdeaPool/Index', [
            'ideas' => $ideas,
            'categories' => $categories,
            'departments' => $departments,
            'tags' => $tags,
            'filters' => $filters,
            'canCreateIdea' => $user->can('create', Idea::class),
        ]);
    }

    /**
     * Show the form for creating a new idea.
     */
    public function create()
    {
        $this->authorize('create', Idea::class);

        $categories = Category::where('type', 'idea')->active()->get();
        $departments = Department::all();
        $tags = Tag::where('type', 'idea')->get();

        return Inertia::render('IdeaPool/Create', [
            'categories' => $categories,
            'departments' => $departments,
            'tags' => $tags,
        ]);
    }

    /**
     * Store a newly created idea in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Idea::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'nullable|exists:idea_categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'is_anonymous' => 'boolean',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240', // Max 10MB per file
        ]);

        $idea = new Idea([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => 'new',
            'user_id' => Auth::id(),
            'category_id' => $validated['category_id'] ?? null,
            'department_id' => $validated['department_id'] ?? null,
            'is_anonymous' => $validated['is_anonymous'] ?? false,
        ]);

        $idea->save();

        // Sync tags
        if (isset($validated['tag_ids'])) {
            $idea->tags()->sync($validated['tag_ids']);
        }

        // Store attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('ideas/' . $idea->id, 'public');

                $attachment = new IdeaAttachment([
                    'idea_id' => $idea->id,
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                    'file_type' => $file->getMimeType(),
                ]);

                $attachment->save();
            }
        }

        return redirect()->route('ideas.show', $idea)
            ->with('success', __('Idea created successfully'));
    }

    /**
     * Display the specified idea.
     */
    public function show(Idea $idea)
    {
        $this->authorize('view', $idea);

        $idea->load([
            'user:id,name,email,avatar',
            'category:id,name,color,icon',
            'department:id,name',
            'tags:id,name',
            'comments' => function ($query) {
                $query->with('user:id,name,email,avatar')
                      ->whereNull('parent_id')
                      ->orderBy('created_at', 'desc');
            },
            'comments.replies' => function ($query) {
                $query->with('user:id,name,email,avatar')
                      ->orderBy('created_at', 'asc');
            },
            'attachments'
        ]);

        // Check if user has voted on this idea
        $userVote = null;
        if (Auth::check()) {
            $userVote = IdeaVote::where('idea_id', $idea->id)
                ->where('user_id', Auth::id())
                ->first();
        }

        $idea->user_vote = $userVote ? $userVote->vote_type : null;

        return Inertia::render('IdeaPool/Show', [
            'idea' => $idea,
            'canEdit' => Auth::user()->can('update', $idea),
            'canDelete' => Auth::user()->can('delete', $idea),
            'canVote' => Auth::user()->can('vote', $idea),
            'canComment' => Auth::user()->can('comment', $idea),
        ]);
    }

    /**
     * Show the form for editing the specified idea.
     */
    public function edit(Idea $idea)
    {
        $this->authorize('update', $idea);

        $idea->load(['tags', 'attachments']);

        $categories = Category::where('type', 'idea')->active()->get();
        $departments = Department::all();
        $tags = Tag::where('type', 'idea')->get();

        return Inertia::render('IdeaPool/Edit', [
            'idea' => $idea,
            'categories' => $categories,
            'departments' => $departments,
            'tags' => $tags,
            'tagIds' => $idea->tags->pluck('id')->toArray(),
        ]);
    }

    /**
     * Update the specified idea in storage.
     */
    public function update(Request $request, Idea $idea)
    {
        $this->authorize('update', $idea);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'nullable|exists:idea_categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'is_anonymous' => 'boolean',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240', // Max 10MB per file
            'deleted_attachments' => 'nullable|array',
            'deleted_attachments.*' => 'exists:idea_attachments,id',
        ]);

        $idea->title = $validated['title'];
        $idea->description = $validated['description'];
        $idea->category_id = $validated['category_id'] ?? null;
        $idea->department_id = $validated['department_id'] ?? null;
        $idea->is_anonymous = $validated['is_anonymous'] ?? false;

        $idea->save();

        // Sync tags
        if (isset($validated['tag_ids'])) {
            $idea->tags()->sync($validated['tag_ids']);
        } else {
            $idea->tags()->detach();
        }

        // Delete attachments
        if (isset($validated['deleted_attachments'])) {
            foreach ($validated['deleted_attachments'] as $attachmentId) {
                $attachment = IdeaAttachment::find($attachmentId);
                if ($attachment && $attachment->idea_id === $idea->id) {
                    Storage::disk('public')->delete($attachment->file_path);
                    $attachment->delete();
                }
            }
        }

        // Store new attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('ideas/' . $idea->id, 'public');

                $attachment = new IdeaAttachment([
                    'idea_id' => $idea->id,
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                    'file_type' => $file->getMimeType(),
                ]);

                $attachment->save();
            }
        }

        return redirect()->route('ideas.show', $idea)
            ->with('success', __('Idea updated successfully'));
    }

    /**
     * Remove the specified idea from storage.
     */
    public function destroy(Idea $idea)
    {
        $this->authorize('delete', $idea);

        // Delete all attachments
        foreach ($idea->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        // Delete the idea (this will cascade delete comments, votes, attachments, and tag relationships)
        $idea->delete();

        return redirect()->route('ideas.index')
            ->with('success', __('Idea deleted successfully'));
    }

    /**
     * Vote on an idea.
     */
    public function vote(Request $request, Idea $idea)
    {
        $this->authorize('vote', $idea);

        $validated = $request->validate([
            'vote_type' => 'required|in:1,-1', // 1: upvote, -1: downvote
        ]);

        $voteType = (int) $validated['vote_type'];

        // Check if user has already voted
        $existingVote = IdeaVote::where('idea_id', $idea->id)
            ->where('user_id', Auth::id())
            ->first();

        if ($existingVote) {
            if ($existingVote->vote_type === $voteType) {
                // If voting the same way, remove the vote (toggle)
                $existingVote->delete();
                $message = __('Vote removed');
            } else {
                // If voting differently, update the vote
                $existingVote->vote_type = $voteType;
                $existingVote->save();
                $message = $voteType === 1 ? __('Upvoted successfully') : __('Downvoted successfully');
            }
        } else {
            // Create a new vote
            $vote = new IdeaVote([
                'idea_id' => $idea->id,
                'user_id' => Auth::id(),
                'vote_type' => $voteType,
            ]);

            $vote->save();
            $message = $voteType === 1 ? __('Upvoted successfully') : __('Downvoted successfully');
        }

        return back()->with('success', $message);
    }

    /**
     * Update the status of an idea.
     */
    public function updateStatus(Request $request, Idea $idea)
    {
        $this->authorize('updateStatus', $idea);

        $validated = $request->validate([
            'status' => 'required|in:new,under_review,approved,implemented,declined',
            'impact' => 'nullable|in:low,medium,high',
            'effort' => 'nullable|in:low,medium,high',
        ]);

        $idea->status = $validated['status'];

        if (isset($validated['impact'])) {
            $idea->impact = $validated['impact'];
        }

        if (isset($validated['effort'])) {
            $idea->effort = $validated['effort'];
        }

        $idea->save();

        return back()->with('success', __('Idea status updated successfully'));
    }

    /**
     * Download an attachment.
     */
    public function downloadAttachment(IdeaAttachment $attachment)
    {
        $idea = $attachment->idea;
        $this->authorize('view', $idea);

        return Storage::disk('public')->download(
            $attachment->file_path,
            $attachment->file_name
        );
    }
}
