<?php

namespace App\Http\Controllers\Todo;

use App\Http\Controllers\Controller;
use App\Models\TodoItem;
use App\Models\TodoProject;
use App\Models\TodoAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class TodoController extends Controller
{
    /**
     * Display the todo list page
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        return Inertia::render('ToDo/index');
    }
    
    /**
     * Get all todo items for the authenticated user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTodos()
    {
        $todos = TodoItem::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Format the response to match frontend expectations
        $formattedTodos = $todos->map(function($todo) {
            return [
                'id' => $todo->id,
                'task' => $todo->task,
                'description' => $todo->description,
                'dueDate' => $todo->due_date,
                'status' => $todo->status,
                'priority' => $todo->priority,
                'subItem' => json_decode($todo->assigned_to) ?? []
            ];
        });
        
        return response()->json($formattedTodos);
    }
    
    /**
     * Create a new todo item
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'task' => 'required|string|max:255',
            'description' => 'nullable|string',
            'dueDate' => 'required|string',
            'status' => 'required|string|in:New,Pending,Inprogress,Completed',
            'priority' => 'required|string|in:High,Medium,Low',
            'subItem' => 'required'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }
        
        $todo = new TodoItem();
        $todo->user_id = Auth::id();
        $todo->task = $request->task;
        $todo->description = $request->description;
        $todo->due_date = $request->dueDate;
        $todo->status = $request->status;
        $todo->priority = $request->priority;
        $todo->assigned_to = json_encode($request->subItem);
        $todo->save();
        
        return response()->json([
            'id' => $todo->id,
            'task' => $todo->task,
            'description' => $todo->description,
            'dueDate' => $todo->due_date,
            'status' => $todo->status,
            'priority' => $todo->priority,
            'subItem' => json_decode($todo->assigned_to)
        ]);
    }
    
    /**
     * Update an existing todo item
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $todo = TodoItem::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$todo) {
            return response()->json(['success' => false, 'message' => 'Todo not found'], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'task' => 'required|string|max:255',
            'description' => 'nullable|string',
            'dueDate' => 'required|string',
            'status' => 'required|string|in:New,Pending,Inprogress,Completed',
            'priority' => 'required|string|in:High,Medium,Low',
            'subItem' => 'required'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }
        
        $todo->task = $request->task;
        $todo->description = $request->description;
        $todo->due_date = $request->dueDate;
        $todo->status = $request->status;
        $todo->priority = $request->priority;
        $todo->assigned_to = json_encode($request->subItem);
        $todo->save();
        
        return response()->json([
            'id' => $todo->id,
            'task' => $todo->task,
            'description' => $todo->description,
            'dueDate' => $todo->due_date,
            'status' => $todo->status,
            'priority' => $todo->priority,
            'subItem' => json_decode($todo->assigned_to)
        ]);
    }
    
    /**
     * Delete a todo item
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $todo = TodoItem::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$todo) {
            return response()->json(['success' => false, 'message' => 'Todo not found'], 404);
        }
        
        // Delete any attachments associated with this todo
        foreach ($todo->attachments as $attachment) {
            Storage::disk('public')->delete('todo-attachments/' . $attachment->filename);
            $attachment->delete();
        }
        
        $todo->delete();
        
        return response()->json(['success' => true]);
    }
    
    /**
     * Get details of a specific todo item
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $todo = TodoItem::with('attachments')
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$todo) {
            return response()->json(['success' => false, 'message' => 'Todo not found'], 404);
        }
        
        $formattedAttachments = $todo->attachments->map(function($attachment) {
            return [
                'id' => $attachment->id,
                'filename' => $attachment->filename,
                'file_size' => $attachment->file_size,
                'file_type' => $attachment->file_type,
                'created_at' => $attachment->created_at
            ];
        });
        
        return response()->json([
            'id' => $todo->id,
            'task' => $todo->task,
            'description' => $todo->description,
            'dueDate' => $todo->due_date,
            'status' => $todo->status,
            'priority' => $todo->priority,
            'subItem' => json_decode($todo->assigned_to),
            'attachments' => $formattedAttachments
        ]);
    }
    
    /**
     * Upload an attachment to a todo item
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadAttachment(Request $request, $id)
    {
        $todo = TodoItem::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$todo) {
            return response()->json(['success' => false, 'message' => 'Todo not found'], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // Max 10MB
        ]);
        
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }
        
        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $fileType = $file->getMimeType();
        
        // Generate a unique filename
        $filename = time() . '_' . uniqid() . '_' . $originalName;
        
        // Store the file
        $path = $file->storeAs('todo-attachments', $filename, 'public');
        
        // Create the attachment record
        $attachment = new TodoAttachment();
        $attachment->todo_item_id = $todo->id;
        $attachment->filename = $filename;
        $attachment->original_filename = $originalName;
        $attachment->file_path = $path;
        $attachment->file_size = $fileSize;
        $attachment->file_type = $fileType;
        $attachment->save();
        
        return response()->json([
            'success' => true,
            'attachment' => [
                'id' => $attachment->id,
                'filename' => $originalName,
                'file_size' => $fileSize,
                'file_type' => $fileType
            ]
        ]);
    }
    
    /**
     * Download an attachment
     *
     * @param  int  $id
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function downloadAttachment($id)
    {
        $attachment = TodoAttachment::findOrFail($id);
        
        // Check if the attachment belongs to a todo owned by the current user
        $todo = TodoItem::where('id', $attachment->todo_item_id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$todo) {
            abort(403, 'Unauthorized access');
        }
        
        $path = storage_path('app/public/' . $attachment->file_path);
        
        if (!file_exists($path)) {
            abort(404, 'File not found');
        }
        
        return response()->download($path, $attachment->original_filename);
    }
    
    /**
     * Delete an attachment
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteAttachment($id)
    {
        $attachment = TodoAttachment::findOrFail($id);
        
        // Check if the attachment belongs to a todo owned by the current user
        $todo = TodoItem::where('id', $attachment->todo_item_id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$todo) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access'], 403);
        }
        
        // Delete the physical file
        Storage::disk('public')->delete($attachment->file_path);
        
        // Delete the attachment record
        $attachment->delete();
        
        return response()->json(['success' => true]);
    }
}
