<?php

namespace App\Http\Controllers\Document;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Document;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentController extends Controller
{
    /**
     * Display a listing of documents.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Document::with(['user', 'department', 'location'])
            ->where(function ($query) use ($user) {
                // Documents user has access to
                $query->where('user_id', $user->id)
                    ->orWhere('access_level', 'public')
                    ->orWhere(function ($q) use ($user) {
                        $q->where('department_id', $user->department_id)
                            ->where('access_level', 'department');
                    })
                    ->orWhere(function ($q) use ($user) {
                        $q->where('location_id', $user->location_id)
                            ->where('access_level', 'location');
                    });
            });

        // Apply filters
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        $allowedSortFields = ['title', 'category', 'created_at', 'download_count'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $documents = $query->paginate(15)
            ->withQueryString();

        // Get categories for filter dropdown (unique values from documents)
        $categories = Document::select('category_id')
            ->distinct()
            ->whereNotNull('category_id')
            ->pluck('category_id')
            ->sort()
            ->values();

        // Get departments for filter dropdown
        $departments = Department::where('status', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'categories' => $categories,
            'departments' => $departments,
            'filters' => $request->only(['category_id', 'department_id', 'search']),
            'sort' => [
                'field' => $sortField,
                'direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Show the form for creating a new document.
     */
    public function create()
    {
        // Check permission
        $this->authorize('create', Document::class);

        $departments = Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get existing categories for dropdown suggestions
        $categories = Document::select('category_id')
            ->distinct()
            ->whereNotNull('category_id')
            ->pluck('category_id')
            ->sort()
            ->values();

        return Inertia::render('Documents/Create', [
            'departments' => $departments,
            'locations' => $locations,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created document in storage.
     */
    public function store(Request $request)
    {
        // Check permission
        $this->authorize('create', Document::class);

        // Validate request
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|string|max:100',
            'tags' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'location_id' => 'nullable|exists:locations,id',
            'access_level' => 'required|in:private,department,location,public',
            'is_featured' => 'boolean',
            'expiry_date' => 'nullable|date|after:today',
            'file' => 'required|file|max:20480',  // 20MB max file size
        ]);

        // Process tags
        $tags = [];
        if (!empty($validated['tags'])) {
            $tags = explode(',', $validated['tags']);
            $tags = array_map('trim', $tags);
            $tags = array_filter($tags);
        }

        // Get uploaded file details
        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $fileType = $file->getMimeType();
        $fileSize = $file->getSize();

        // Store the file
        $path = $file->store('document_files');

        // Create the document
        $document = Document::create([
            'title' => $validated['title'],
            'file_path' => $path,
            'file_name' => $fileName,
            'file_type' => $fileType,
            'file_size' => $fileSize,
            'description' => $validated['description'],
            'category_id' => $validated['category_id'],
            'tags' => $tags,
            'created_by' => $request->user()->id,  // Changed from user_id to created_by
            'updated_by' => $request->user()->id,  // Add this line
            'department_id' => $validated['department_id'],
            'location_id' => $validated['location_id'],
            'access_level' => $validated['access_level'],
            'is_featured' => $validated['is_featured'] ?? false,
            'expiry_date' => $validated['expiry_date'],
            'user_id' => $request->user()->id,
            'status' => 'active',
            'version' => '1.0',
            'download_count' => 0,
            'is_public' => $validated['access_level'] === 'public',
            'published_at' => now(),
        ]);

        return redirect()->route('documents.index')
            ->with('success', 'Doküman başarıyla yüklendi.');
    }

    /**
     * Display the specified document.
     */
    public function show(Document $document)
    {
        // Check if user can access this document
        $user = request()->user();

        if (!$document->isAccessibleBy($user)) {
            abort(403, 'Bu dokümanı görüntüleme yetkiniz yok.');
        }

        // Load relationships
        $document->load(['user', 'department', 'location']);

        return Inertia::render('Documents/Show', [
            'document' => $document,
        ]);
    }

    /**
     * Show the form for editing the specified document.
     */
    public function edit(Document $document)
    {
        // Check permission
        $this->authorize('update', $document);

        $departments = Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get existing categories for dropdown suggestions
        $categories = Document::select('category_id')
            ->distinct()
            ->whereNotNull('category_id')
            ->pluck('category_id')
            ->sort()
            ->values();

        // Format tags as comma-separated string for the form
        $document->tags_string = is_array($document->tags) ? implode(', ', $document->tags) : '';

        return Inertia::render('Documents/Edit', [
            'document' => $document,
            'departments' => $departments,
            'locations' => $locations,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified document in storage.
     */
    public function update(Request $request, Document $document)
    {
        // Check permission
        $this->authorize('update', $document);

        // Validate request
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|string|max:100',
            'tags' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'location_id' => 'nullable|exists:locations,id',
            'access_level' => 'required|in:private,department,location,public',
            'is_featured' => 'boolean',
            'expiry_date' => 'nullable|date|after:today',
            'file' => 'nullable|file|max:20480',  // 20MB max file size
            'status' => 'nullable|in:active,archived',
        ]);

        // Process tags
        $tags = [];
        if (!empty($validated['tags'])) {
            $tags = explode(',', $validated['tags']);
            $tags = array_map('trim', $tags);
            $tags = array_filter($tags);
        }

        // Prepare update data
        $updateData = [
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category_id' => $validated['category_id'],
            'tags' => $tags,
            'department_id' => $validated['department_id'],
            'location_id' => $validated['location_id'],
            'access_level' => $validated['access_level'],
            'is_featured' => $validated['is_featured'] ?? false,
            'expiry_date' => $validated['expiry_date'],
        ];

        // Update status if provided
        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }

        // Handle file update if provided
        if ($request->hasFile('file')) {
            // Delete the old file
            Storage::delete($document->file_path);

            // Store the new file
            $path = $request->file('file')->store('document_files');
            $updateData['file_path'] = $path;

            // Increment version
            $updateData['version'] = $document->version + 0.1;
        }

        // Update the document
        $document->update($updateData);

        return redirect()->route('documents.show', $document)
            ->with('success', 'Doküman başarıyla güncellendi.');
    }

    /**
     * Remove the specified document from storage.
     */
    public function destroy(Document $document)
    {
        // Check permission
        $this->authorize('delete', $document);

        // Delete the file
        Storage::delete($document->file_path);

        // Delete the document (soft delete)
        $document->delete();

        return redirect()->route('documents.index')
            ->with('success', 'Doküman başarıyla silindi.');
    }

    /**
     * Download the document file and increment counter.
     */
    public function download(Document $document)
    {
        // Check if user can access this document
        $user = request()->user();

        if (!$document->isAccessibleBy($user)) {
            abort(403, 'Bu dokümanı indirme yetkiniz yok.');
        }

        // Increment download count
        $document->incrementDownloadCount();

        // Get file name from path
        $fileName = pathinfo($document->file_path, PATHINFO_BASENAME);

        // Return the file download
        return Storage::download($document->file_path, $document->title . '.' . pathinfo($fileName, PATHINFO_EXTENSION));
    }
}
