<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $type = $request->input('type');
        
        $query = Tag::query();
        
        if ($type) {
            $query->where('type', $type);
        }
        
        $tags = $query->orderBy('name')->get();
        
        return Inertia::render('Tags/Index', [
            'tags' => $tags,
            'type' => $type,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Tags/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);
        
        // Etiket adı ve tipiyle aynı bir etiket var mı kontrol et
        $existingTag = Tag::where('name', $request->name)
            ->where('type', $request->type)
            ->first();
        
        if ($existingTag) {
            return redirect()->back()->withErrors([
                'name' => 'A tag with this name and type already exists.'
            ]);
        }
        
        $tag = Tag::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'type' => $request->type,
            'description' => $request->description,
            'color' => $request->color,
            'is_active' => $request->is_active ?? true,
        ]);
        
        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'tag' => $tag,
            ]);
        }
        
        return redirect()->route('tags.index', ['type' => $request->type])
            ->with('success', 'Tag created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Tag $tag)
    {
        // Etiket tipine göre ilişkili öğeleri yükle
        if ($tag->type === 'news') {
            $tag->load('newsPosts');
            $relatedItems = $tag->newsPosts;
        } elseif ($tag->type === 'document') {
            $tag->load('documents');
            $relatedItems = $tag->documents;
        } else {
            $relatedItems = [];
        }
        
        return Inertia::render('Tags/Show', [
            'tag' => $tag,
            'relatedItems' => $relatedItems,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Tag $tag)
    {
        return Inertia::render('Tags/Edit', [
            'tag' => $tag,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Tag $tag)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);
        
        // Etiket adı değiştiyse ve aynı tip ve adda başka bir etiket varsa kontrol et
        if ($tag->name !== $request->name) {
            $existingTag = Tag::where('name', $request->name)
                ->where('type', $tag->type)
                ->where('id', '!=', $tag->id)
                ->first();
            
            if ($existingTag) {
                return redirect()->back()->withErrors([
                    'name' => 'A tag with this name and type already exists.'
                ]);
            }
        }
        
        $tag->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'color' => $request->color,
            'is_active' => $request->is_active ?? true,
        ]);
        
        return redirect()->route('tags.index', ['type' => $tag->type])
            ->with('success', 'Tag updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tag $tag)
    {
        // Etikete bağlı öğe sayısını kontrol et
        $itemCount = 0;
        
        if ($tag->type === 'news') {
            $itemCount = $tag->newsPosts()->count();
        } elseif ($tag->type === 'document') {
            $itemCount = $tag->documents()->count();
        }
        
        if ($itemCount > 0) {
            return back()->with('error', 'Tag cannot be deleted because it is used by ' . $itemCount . ' items.');
        }
        
        $tag->delete();
        
        return redirect()->route('tags.index', ['type' => $tag->type])
            ->with('success', 'Tag deleted successfully.');
    }
    
    /**
     * Get tags based on type using AJAX.
     */
    public function getTagsByType(Request $request)
    {
        $type = $request->input('type');
        
        $query = Tag::query()->where('is_active', true);
        
        if ($type) {
            $query->where('type', $type);
        }
        
        $tags = $query->orderBy('name')->get();
        
        return response()->json($tags);
    }
}
