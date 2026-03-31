<?php

namespace App\Http\Controllers\News;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\NewsComment;
use App\Models\NewsPost;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class NewsController extends Controller
{
    /**
     * Display a listing of the posts.
     */
    public function index(Request $request)
    {
        return $this->list($request);
    }

    /**
     * Display posts in grid view.
     */
    public function grid(Request $request)
    {
        $status = $request->input('status', 'published');
        $category = $request->input('category');
        $search = $request->input('search');
        $perPage = $request->input('per_page', 8);

        $query = NewsPost::with(['category', 'author', 'tags'])
            ->when($status === 'published', function ($query) {
                return $query->published();
            })
            ->when($status === 'draft', function ($query) {
                return $query->where('status', 'draft');
            })
            ->when($status === 'archived', function ($query) {
                return $query->where('status', 'archived');
            })
            ->when($category, function ($query, $category) {
                return $query->where('category_id', $category);
            })
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('summary', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%");
                });
            })
            ->orderBy('publish_at', 'desc');

        $posts = $query->paginate($perPage);

        $categories = Category::active()->ofType('news')->get();

        return Inertia::render('Pages/Blogs/GridView/index', [
            'posts' => $posts,
            'categories' => $categories,
            'filters' => [
                'status' => $status,
                'category' => $category,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Display posts in list view.
     */
    public function list(Request $request)
    {
        $status = $request->input('status', 'published');
        $category = $request->input('category');
        $search = $request->input('search');
        $perPage = $request->input('per_page', 6);

        $query = NewsPost::with(['category', 'author', 'tags'])
            ->when($status === 'published', function ($query) {
                return $query->published();
            })
            ->when($status === 'draft', function ($query) {
                return $query->where('status', 'draft');
            })
            ->when($status === 'archived', function ($query) {
                return $query->where('status', 'archived');
            })
            ->when($category, function ($query, $category) {
                return $query->where('category_id', $category);
            })
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('summary', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%");
                });
            })
            ->orderBy('publish_at', 'desc');

        $posts = $query->paginate($perPage);

        $categories = Category::active()->ofType('news')->get();
        $tags = Tag::ofType('news')->get();

        return Inertia::render('Pages/Blogs/ListView/index', [
            'posts' => $posts,
            'categories' => $categories,
            'tags' => $tags,
            'filters' => [
                'status' => $status,
                'category' => $category,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show the form for creating a new post.
     */
    public function create()
    {
        $categories = Category::active()->ofType('news')->get();
        $tags = Tag::ofType('news')->get();

        return Inertia::render('Pages/Blogs/Create/index', [
            'categories' => $categories,
            'tags' => $tags,
        ]);
    }

    /**
     * Store a newly created post in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'content' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
            'featured_image' => 'nullable|image|max:2048',
            'publish_at' => 'nullable|date',
            'status' => 'required|in:draft,published,archived',
            'allow_comments' => 'boolean',
            'is_featured' => 'boolean',
            'department_id' => 'nullable|exists:departments,id',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
        ]);

        $imagePath = null;
        if ($request->hasFile('featured_image')) {
            $imagePath = $request->file('featured_image')->store('news_images', 'public');
        }

        $post = NewsPost::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'summary' => $request->summary,
            'content' => $request->content,
            'category_id' => $request->category_id,
            'author_id' => Auth::id(),
            'featured_image_path' => $imagePath,
            'publish_at' => $request->publish_at ?? now(),
            'status' => $request->status,
            'allow_comments' => $request->allow_comments ?? true,
            'is_featured' => $request->is_featured ?? false,
            'department_id' => $request->department_id,
        ]);

        if ($request->has('tags')) {
            $post->tags()->attach($request->tags);
        }

        return redirect()->route('news.index')
            ->with('success', 'Post created successfully.');
    }

    /**
     * Display the specified post.
     */
    public function show(NewsPost $post)
    {
        $post->load(['category', 'author', 'tags', 'comments' => function ($query) {
            $query->approved()->rootLevel()->with(['user', 'replies.user']);
        }]);

        $similarPosts = NewsPost::published()
            ->where('id', '!=', $post->id)
            ->when($post->category_id, function ($query, $categoryId) {
                return $query->where('category_id', $categoryId);
            })
            ->latest()
            ->take(3)
            ->get();

        return Inertia::render('Pages/Blogs/Overview/index', [
            'post' => $post,
            'similarPosts' => $similarPosts,
        ]);
    }

    /**
     * Show the form for editing the specified post.
     */
    public function edit(NewsPost $post)
    {
        $post->load(['category', 'tags']);
        $categories = Category::active()->ofType('news')->get();
        $tags = Tag::ofType('news')->get();

        return Inertia::render('Pages/Blogs/Edit/index', [
            'post' => $post,
            'categories' => $categories,
            'tags' => $tags,
        ]);
    }

    /**
     * Update the specified post in storage.
     */
    public function update(Request $request, NewsPost $post)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'content' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
            'featured_image' => 'nullable|image|max:2048',
            'publish_at' => 'nullable|date',
            'status' => 'required|in:draft,published,archived',
            'allow_comments' => 'boolean',
            'is_featured' => 'boolean',
            'department_id' => 'nullable|exists:departments,id',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
        ]);

        $imagePath = $post->featured_image_path;
        if ($request->hasFile('featured_image')) {
            // Delete old image if exists
            if ($post->featured_image_path) {
                Storage::disk('public')->delete($post->featured_image_path);
            }

            $imagePath = $request->file('featured_image')->store('news_images', 'public');
        }

        $post->update([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'summary' => $request->summary,
            'content' => $request->content,
            'category_id' => $request->category_id,
            'featured_image_path' => $imagePath,
            'publish_at' => $request->publish_at ?? now(),
            'status' => $request->status,
            'allow_comments' => $request->allow_comments ?? true,
            'is_featured' => $request->is_featured ?? false,
            'department_id' => $request->department_id,
        ]);

        if ($request->has('tags')) {
            $post->tags()->sync($request->tags);
        }

        return redirect()->route('news.index')
            ->with('success', 'Post updated successfully.');
    }

    /**
     * Remove the specified post from storage.
     */
    public function destroy(NewsPost $post)
    {
        // Delete featured image if exists
        if ($post->featured_image_path) {
            Storage::disk('public')->delete($post->featured_image_path);
        }

        $post->delete();

        return redirect()->route('news.index')
            ->with('success', 'Post deleted successfully.');
    }

    /**
     * Add a comment to the post.
     */
    public function addComment(Request $request, NewsPost $post)
    {
        $request->validate([
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:news_comments,id',
        ]);

        if (!$post->allow_comments) {
            return back()->with('error', 'Comments are disabled for this post.');
        }

        $comment = new NewsComment([
            'user_id' => Auth::id(),
            'content' => $request->content,
            'parent_id' => $request->parent_id,
            'is_approved' => true, // Auto-approve for now
        ]);

        $post->comments()->save($comment);

        return back()->with('success', 'Comment added successfully.');
    }
}
