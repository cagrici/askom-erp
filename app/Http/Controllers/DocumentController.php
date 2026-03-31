<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\Tag;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    /**
     * Display a listing of the documents.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $documents = Document::with(['category', 'tags'])->get();
        
        return view('documents.index', compact('documents'));
    }

    /**
     * Show the form for creating a new document.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $categories = DocumentCategory::all();
        $tags = Tag::all();
        
        return view('documents.create', compact('categories', 'tags'));
    }

    /**
     * Store a newly created document in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'document_category_id' => 'required|exists:document_categories,id',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
            'file' => 'nullable|file|max:10240', // Optional file upload (10MB max)
        ]);
        
        $document = new Document();
        $document->title = $validated['title'];
        $document->content = $validated['content'];
        $document->document_category_id = $validated['document_category_id'];
        
        // Handle file upload if present
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('documents', $fileName, 'public');
            $document->file_path = $filePath;
        }
        
        $document->save();
        
        // Attach tags if any
        if (isset($validated['tags'])) {
            $document->tags()->attach($validated['tags']);
        }
        
        return redirect()->route('documents.index')
            ->with('success', 'Document created successfully.');
    }

    /**
     * Display the specified document.
     *
     * @param  \App\Models\Document  $document
     * @return \Illuminate\Http\Response
     */
    public function show(Document $document)
    {
        $document->load(['category', 'tags']);
        
        return view('documents.show', compact('document'));
    }

    /**
     * Show the form for editing the specified document.
     *
     * @param  \App\Models\Document  $document
     * @return \Illuminate\Http\Response
     */
    public function edit(Document $document)
    {
        $categories = DocumentCategory::all();
        $tags = Tag::all();
        $document->load('tags');
        
        return view('documents.edit', compact('document', 'categories', 'tags'));
    }

    /**
     * Update the specified document in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Document  $document
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Document $document)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'document_category_id' => 'required|exists:document_categories,id',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
            'file' => 'nullable|file|max:10240', // Optional file upload (10MB max)
        ]);
        
        $document->title = $validated['title'];
        $document->content = $validated['content'];
        $document->document_category_id = $validated['document_category_id'];
        
        // Handle file upload if present
        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($document->file_path) {
                \Storage::disk('public')->delete($document->file_path);
            }
            
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('documents', $fileName, 'public');
            $document->file_path = $filePath;
        }
        
        $document->save();
        
        // Sync tags
        if (isset($validated['tags'])) {
            $document->tags()->sync($validated['tags']);
        } else {
            $document->tags()->detach();
        }
        
        return redirect()->route('documents.index')
            ->with('success', 'Document updated successfully.');
    }

    /**
     * Remove the specified document from storage.
     *
     * @param  \App\Models\Document  $document
     * @return \Illuminate\Http\Response
     */
    public function destroy(Document $document)
    {
        // Delete file if exists
        if ($document->file_path) {
            \Storage::disk('public')->delete($document->file_path);
        }
        
        // Delete the document (tags relationship will be handled by the database)
        $document->delete();
        
        return redirect()->route('documents.index')
            ->with('success', 'Document deleted successfully.');
    }
}
