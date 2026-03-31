<?php

namespace App\Http\Controllers\FileManager;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\FileFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class FileManagerController extends Controller
{
    /**
     * Display the file manager
     */
    public function index(Request $request)
    {
        // Get all root folders (no parent)
        $folders = FileFolder::where('user_id', Auth::id())
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get()
            ->map(function ($folder) {
                return [
                    'id' => $folder->id,
                    'folderName' => $folder->name,
                    'folderFile' => $folder->files_count,
                    'size' => $folder->formatted_size,
                ];
            });

        // Get recent files
        $files = File::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($file) {
                $iconInfo = $file->icon_class;
                return [
                    'id' => $file->id,
                    'icon' => $iconInfo['icon'],
                    'iconClass' => $iconInfo['class'],
                    'fileName' => $file->name,
                    'fileType' => $file->file_type,
                    'fileItem' => sprintf('%02d', 1), // Legacy format from the frontend
                    'size' => $file->formatted_size,
                    'createDate' => $file->created_at->format('d M, Y'),
                    'is_favorite' => $file->is_favorite,
                ];
            });

        // Get storage usage statistics
        $totalSpace = $this->getTotalStorageSpace();
        $usedSpace = $this->getUsedStorageSpace();
        $storageStats = $this->getStorageStatsByType();

        return Inertia::render('FileManager/index', [
            'initialFolders' => $folders,
            'initialFiles' => $files,
            'storageStats' => [
                'total' => $totalSpace,
                'used' => $usedSpace,
                'percentage' => $totalSpace > 0 ? round(($usedSpace / $totalSpace) * 100, 2) : 0,
                'byType' => $storageStats,
            ],
        ]);
    }

    /**
     * Get all folders
     */
    public function getFolders(Request $request)
    {
        $parentId = $request->input('parent_id');
        
        $query = FileFolder::where('user_id', Auth::id());
        
        if ($parentId) {
            $query->where('parent_id', $parentId);
        } else {
            $query->whereNull('parent_id');
        }
        
        $folders = $query->orderBy('name')
            ->get()
            ->map(function ($folder) {
                return [
                    'id' => $folder->id,
                    'folderName' => $folder->name,
                    'folderFile' => $folder->files_count,
                    'size' => $folder->formatted_size,
                ];
            });
            
        return response()->json(['folders' => $folders]);
    }

    /**
     * Get files based on filter or folder
     */
    public function getFiles(Request $request)
    {
        $folderId = $request->input('folder_id');
        $fileType = $request->input('file_type');
        $filterType = $request->input('filter');
        
        $query = File::where('user_id', Auth::id());
        
        if ($folderId) {
            $query->where('folder_id', $folderId);
        }
        
        if ($fileType) {
            $query->where('file_type', $fileType);
        }
        
        // Apply filters
        if ($filterType) {
            switch ($filterType) {
                case 'Recents':
                    $query->orderBy('last_accessed_at', 'desc');
                    break;
                case 'Important':
                    $query->where('is_favorite', true);
                    break;
                case 'Deleted':
                    $query->onlyTrashed();
                    break;
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }
        
        $files = $query->limit(100)
            ->get()
            ->map(function ($file) {
                $iconInfo = $file->icon_class;
                return [
                    'id' => $file->id,
                    'icon' => $iconInfo['icon'],
                    'iconClass' => $iconInfo['class'],
                    'fileName' => $file->name,
                    'fileType' => $file->file_type,
                    'fileItem' => sprintf('%02d', 1), // Legacy format from the frontend
                    'size' => $file->formatted_size,
                    'createDate' => $file->created_at->format('d M, Y'),
                    'is_favorite' => $file->is_favorite,
                ];
            });
            
        return response()->json(['files' => $files]);
    }

    /**
     * Create a new folder
     */
    public function createFolder(Request $request)
    {
        $request->validate([
            'folderName' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:file_folders,id',
        ]);
        
        $folder = FileFolder::create([
            'name' => $request->folderName,
            'parent_id' => $request->parent_id,
            'user_id' => Auth::id(),
            'path' => $this->generateFolderPath($request->folderName, $request->parent_id),
        ]);
        
        // Update parent folder stats if needed
        if ($folder->parent_id) {
            $folder->parent->updateStats();
        }
        
        return response()->json([
            'success' => true,
            'folder' => [
                'id' => $folder->id,
                'folderName' => $folder->name,
                'folderFile' => $folder->files_count,
                'size' => $folder->formatted_size,
            ],
        ]);
    }

    /**
     * Update folder
     */
    public function updateFolder(Request $request, FileFolder $folder)
    {
        // Authorize the user can update this folder
        if ($folder->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $request->validate([
            'folderName' => 'required|string|max:255',
        ]);
        
        $folder->name = $request->folderName;
        $folder->save();
        
        return response()->json([
            'success' => true,
            'folder' => [
                'id' => $folder->id,
                'folderName' => $folder->name,
                'folderFile' => $folder->files_count,
                'size' => $folder->formatted_size,
            ],
        ]);
    }

    /**
     * Delete folder
     */
    public function deleteFolder(FileFolder $folder)
    {
        // Authorize the user can delete this folder
        if ($folder->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        // Soft delete the folder and all its contents
        $folder->delete();
        
        // Update parent folder stats if needed
        if ($folder->parent_id) {
            $folder->parent->updateStats();
        }
        
        return response()->json(['success' => true]);
    }

    /**
     * Upload a file
     */
    public function uploadFile(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:104857600', // 100MB max
            'folder_id' => 'nullable|exists:file_folders,id',
        ]);
        
        $uploadedFile = $request->file('file');
        $originalName = $uploadedFile->getClientOriginalName();
        $extension = $uploadedFile->getClientOriginalExtension();
        $mimeType = $uploadedFile->getMimeType();
        $size = $uploadedFile->getSize();
        
        // Generate a unique name
        $fileName = pathinfo($originalName, PATHINFO_FILENAME);
        $uniqueName = Str::slug($fileName) . '_' . time() . '.' . $extension;
        
        // Determine file type
        $fileType = File::determineFileType($mimeType, $extension);
        
        // Store the file
        $path = $uploadedFile->storeAs(
            'files/' . Auth::id() . '/' . date('Y/m/d'),
            $uniqueName,
            'public'
        );
        
        // Create the file record
        $file = File::create([
            'name' => $originalName,
            'original_name' => $originalName,
            'file_path' => $path,
            'mime_type' => $mimeType,
            'extension' => $extension,
            'size' => $size,
            'file_type' => $fileType,
            'folder_id' => $request->folder_id,
            'user_id' => Auth::id(),
        ]);
        
        // Update folder stats if needed
        if ($file->folder_id) {
            $file->folder->updateStats();
        }
        
        $iconInfo = $file->icon_class;
        return response()->json([
            'success' => true,
            'file' => [
                'id' => $file->id,
                'icon' => $iconInfo['icon'],
                'iconClass' => $iconInfo['class'],
                'fileName' => $file->name,
                'fileType' => $file->file_type,
                'fileItem' => sprintf('%02d', 1), // Legacy format from the frontend
                'size' => $file->formatted_size,
                'createDate' => $file->created_at->format('d M, Y'),
                'is_favorite' => $file->is_favorite,
            ],
        ]);
    }

    /**
     * Update file (rename)
     */
    public function updateFile(Request $request, File $file)
    {
        // Authorize the user can update this file
        if ($file->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $request->validate([
            'fileName' => 'required|string|max:255',
        ]);
        
        $file->name = $request->fileName;
        $file->save();
        
        $iconInfo = $file->icon_class;
        return response()->json([
            'success' => true,
            'file' => [
                'id' => $file->id,
                'icon' => $iconInfo['icon'],
                'iconClass' => $iconInfo['class'],
                'fileName' => $file->name,
                'fileType' => $file->file_type,
                'fileItem' => sprintf('%02d', 1), // Legacy format from the frontend
                'size' => $file->formatted_size,
                'createDate' => $file->created_at->format('d M, Y'),
                'is_favorite' => $file->is_favorite,
            ],
        ]);
    }

    /**
     * Delete file
     */
    public function deleteFile(File $file)
    {
        // Authorize the user can delete this file
        if ($file->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        // Soft delete the file
        $file->delete();
        
        // Update folder stats if needed
        if ($file->folder_id) {
            $file->folder->updateStats();
        }
        
        return response()->json(['success' => true]);
    }

    /**
     * Toggle file favorite status
     */
    public function toggleFavorite(File $file)
    {
        // Authorize the user
        if ($file->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $isFavorite = $file->toggleFavorite();
        
        return response()->json([
            'success' => true,
            'is_favorite' => $isFavorite,
        ]);
    }

    /**
     * Download a file
     */
    public function downloadFile(File $file)
    {
        // Authorize the user can download this file
        if ($file->user_id !== Auth::id() && !$file->is_public) {
            abort(403);
        }
        
        // Increment download count
        $file->incrementDownloadCount();
        
        // Return the file as a download
        return Storage::download($file->file_path, $file->original_name);
    }

    /**
     * Get file details
     */
    public function getFileDetails(File $file)
    {
        // Authorize the user can view this file
        if ($file->user_id !== Auth::id() && !$file->is_public) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $iconInfo = $file->icon_class;
        return response()->json([
            'success' => true,
            'file' => [
                'id' => $file->id,
                'icon' => $iconInfo['icon'],
                'iconClass' => $iconInfo['class'],
                'fileName' => $file->name,
                'fileType' => $file->file_type,
                'fileItem' => sprintf('%02d', 1), // Legacy format from the frontend
                'size' => $file->formatted_size,
                'rawSize' => $file->size,
                'createDate' => $file->created_at->format('d M, Y'),
                'extension' => $file->extension,
                'mime_type' => $file->mime_type,
                'download_count' => $file->download_count,
                'is_favorite' => $file->is_favorite,
                'path' => $file->folder ? $file->folder->path : '/',
                'share_path' => $file->is_public ? url(Storage::url($file->file_path)) : null,
            ],
        ]);
    }

    /**
     * Move file to another folder
     */
    public function moveFile(Request $request, File $file)
    {
        // Authorize the user can move this file
        if ($file->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $request->validate([
            'folder_id' => 'nullable|exists:file_folders,id',
        ]);
        
        // Store old folder to update stats later
        $oldFolderId = $file->folder_id;
        
        // Update file's folder
        $file->folder_id = $request->folder_id;
        $file->save();
        
        // Update stats for both old and new folders
        if ($oldFolderId) {
            FileFolder::find($oldFolderId)?->updateStats();
        }
        
        if ($file->folder_id) {
            $file->folder->updateStats();
        }
        
        return response()->json(['success' => true]);
    }

    /**
     * Move folder to another parent folder
     */
    public function moveFolder(Request $request, FileFolder $folder)
    {
        // Authorize the user can move this folder
        if ($folder->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $request->validate([
            'parent_id' => 'nullable|exists:file_folders,id',
        ]);
        
        // Check that we're not trying to move a folder inside itself or one of its descendants
        if ($request->parent_id) {
            $parent = FileFolder::find($request->parent_id);
            while ($parent) {
                if ($parent->id == $folder->id) {
                    return response()->json([
                        'success' => false, 
                        'message' => 'Cannot move a folder into itself or its descendants'
                    ], 422);
                }
                $parent = $parent->parent;
            }
        }
        
        // Store old parent to update stats later
        $oldParentId = $folder->parent_id;
        
        // Update folder's parent
        $folder->parent_id = $request->parent_id;
        $folder->path = $this->generateFolderPath($folder->name, $request->parent_id);
        $folder->save();
        
        // Update stats for both old and new parents
        if ($oldParentId) {
            FileFolder::find($oldParentId)?->updateStats();
        }
        
        if ($folder->parent_id) {
            $folder->parent->updateStats();
        }
        
        return response()->json(['success' => true]);
    }

    /**
     * Set file public/private status
     */
    public function togglePublic(File $file)
    {
        // Authorize the user
        if ($file->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $file->is_public = !$file->is_public;
        $file->save();
        
        return response()->json([
            'success' => true,
            'is_public' => $file->is_public,
            'share_url' => $file->is_public ? url(Storage::url($file->file_path)) : null,
        ]);
    }

    /**
     * Search files and folders
     */
    public function search(Request $request)
    {
        $query = $request->input('query');
        
        if (empty($query)) {
            return response()->json([
                'folders' => [],
                'files' => [],
            ]);
        }
        
        // Search folders
        $folders = FileFolder::where('user_id', Auth::id())
            ->where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->limit(10)
            ->get()
            ->map(function ($folder) {
                return [
                    'id' => $folder->id,
                    'folderName' => $folder->name,
                    'folderFile' => $folder->files_count,
                    'size' => $folder->formatted_size,
                ];
            });
            
        // Search files
        $files = File::where('user_id', Auth::id())
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('original_name', 'like', "%{$query}%");
            })
            ->orderBy('name')
            ->limit(20)
            ->get()
            ->map(function ($file) {
                $iconInfo = $file->icon_class;
                return [
                    'id' => $file->id,
                    'icon' => $iconInfo['icon'],
                    'iconClass' => $iconInfo['class'],
                    'fileName' => $file->name,
                    'fileType' => $file->file_type,
                    'fileItem' => sprintf('%02d', 1), // Legacy format from the frontend
                    'size' => $file->formatted_size,
                    'createDate' => $file->created_at->format('d M, Y'),
                    'is_favorite' => $file->is_favorite,
                ];
            });
            
        return response()->json([
            'folders' => $folders,
            'files' => $files,
        ]);
    }

    /**
     * Get total storage allocation for the current user
     */
    private function getTotalStorageSpace()
    {
        // This could be based on user's plan or a constant value
        // For now, return a default value in bytes (119 GB as in the frontend)
        return 119 * 1024 * 1024 * 1024;
    }

    /**
     * Get used storage space for the current user
     */
    private function getUsedStorageSpace()
    {
        return File::where('user_id', Auth::id())->sum('size');
    }

    /**
     * Get storage statistics by file type
     */
    private function getStorageStatsByType()
    {
        $stats = [];
        
        // Documents
        $stats['documents'] = [
            'size' => File::where('user_id', Auth::id())
                ->where('file_type', 'Documents')
                ->sum('size'),
            'count' => File::where('user_id', Auth::id())
                ->where('file_type', 'Documents')
                ->count(),
            'icon' => 'ri-file-text-line',
            'color' => 'secondary',
        ];
        
        // Media
        $stats['media'] = [
            'size' => File::where('user_id', Auth::id())
                ->where('file_type', 'Media')
                ->sum('size'),
            'count' => File::where('user_id', Auth::id())
                ->where('file_type', 'Media')
                ->count(),
            'icon' => 'ri-gallery-line',
            'color' => 'success',
        ];
        
        // Projects - based on folders named "Projects"
        $projectsFolder = FileFolder::where('user_id', Auth::id())
            ->where('name', 'Projects')
            ->first();
            
        if ($projectsFolder) {
            $stats['projects'] = [
                'size' => $projectsFolder->size,
                'count' => $projectsFolder->files_count,
                'icon' => 'ri-folder-2-line',
                'color' => 'warning',
            ];
        } else {
            $stats['projects'] = [
                'size' => 0,
                'count' => 0,
                'icon' => 'ri-folder-2-line',
                'color' => 'warning',
            ];
        }
        
        // Others
        $stats['others'] = [
            'size' => File::where('user_id', Auth::id())
                ->where('file_type', 'Others')
                ->sum('size'),
            'count' => File::where('user_id', Auth::id())
                ->where('file_type', 'Others')
                ->count(),
            'icon' => 'ri-error-warning-line',
            'color' => 'primary',
        ];
        
        // Format sizes
        foreach ($stats as $key => &$stat) {
            $stat['formatted_size'] = $this->formatSize($stat['size']);
        }
        
        return $stats;
    }

    /**
     * Format size in bytes to a human-readable string
     */
    private function formatSize($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Generate folder path string
     */
    private function generateFolderPath($folderName, $parentId = null)
    {
        if (!$parentId) {
            return '/' . $folderName;
        }
        
        $parentFolder = FileFolder::find($parentId);
        if (!$parentFolder) {
            return '/' . $folderName;
        }
        
        return $parentFolder->path . '/' . $folderName;
    }
}
