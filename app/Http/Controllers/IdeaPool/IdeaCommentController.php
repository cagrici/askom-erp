<?php

namespace App\Http\Controllers\IdeaPool;

use App\Http\Controllers\Controller;
use App\Models\IdeaPool\Idea;
use App\Models\IdeaPool\IdeaComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IdeaCommentController extends Controller
{
    /**
     * Store a newly created comment in storage.
     */
    public function store(Request $request, Idea $idea)
    {
        $this->authorize('comment', $idea);
        
        $validated = $request->validate([
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:idea_comments,id',
            'is_anonymous' => 'boolean',
        ]);
        
        $comment = new IdeaComment([
            'idea_id' => $idea->id,
            'user_id' => Auth::id(),
            'content' => $validated['content'],
            'parent_id' => $validated['parent_id'] ?? null,
            'is_anonymous' => $validated['is_anonymous'] ?? false,
        ]);
        
        $comment->save();
        
        return back()->with('success', __('Comment added successfully'));
    }

    /**
     * Update the specified comment in storage.
     */
    public function update(Request $request, IdeaComment $comment)
    {
        $this->authorize('update', $comment);
        
        $validated = $request->validate([
            'content' => 'required|string',
            'is_anonymous' => 'boolean',
        ]);
        
        $comment->content = $validated['content'];
        $comment->is_anonymous = $validated['is_anonymous'] ?? $comment->is_anonymous;
        $comment->save();
        
        return back()->with('success', __('Comment updated successfully'));
    }

    /**
     * Remove the specified comment from storage.
     */
    public function destroy(IdeaComment $comment)
    {
        $this->authorize('delete', $comment);
        
        $comment->delete();
        
        return back()->with('success', __('Comment deleted successfully'));
    }
}
