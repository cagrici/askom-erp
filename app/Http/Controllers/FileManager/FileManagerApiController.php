<?php

namespace App\Http\Controllers\FileManager;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\FileFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileManagerApiController extends Controller
{
    /**
     * Get all folders
     */
    public function getFolders(Request $request)
    {
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
            
        return response()->json($folders);
    }

    /**
     * Get all files
     */
    public function getFiles(Request $request)
    {
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
                    'fileItem' => sprintf('%02d', 1), // Legacy format for the frontend
                    'size' => $file->formatted_size,
                    'createDate' => $file->created_at->format('d M, Y'),
                ];
            });
            
        return response()->json($files);
    }

    /**
     * Create a new folder
     */
    public function addNewFolder(Request $request)
    {
        $request->validate([
            'folderName' => 'required|string|max:255',
            'folderFile' => 'required|string', // This is from the frontend format
            'size' => 'required|string', // This is from the frontend format
        ]);
        
        // Convert frontend size format to bytes (for storage)
        $sizeValue = floatval($request->size);
        $sizeBytes = $sizeValue * 1024 * 1024 * 1024; // Convert from GB to bytes
        
        $folder = FileFolder::create([
            'name' => $request->folderName,
            'user_id' => Auth::id(),
            'files_count' => intval($request->folderFile),
            'size' => $sizeBytes,
            'path' => '/' . $request->folderName,
        ]);
        
        return response()->json([
            'id' => $folder->id,
            'folderName' => $folder->name,
            'folderFile' => $folder->files_count,
            'size' => $request->size, // Keep the frontend format for response
        ]);
    }

    /**
     * Update a folder
     */
    public function updateFolder(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:file_folders,id',
            'folderName' => 'required|string|max:255',
            'folderFile' => 'required|string', // This is from the frontend format
            'size' => 'required|string', // This is from the frontend format
        ]);
        
        $folder = FileFolder::findOrFail($request->id);
        
        // Authorize the user can update this folder
        if ($folder->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Convert frontend size format to bytes (for storage)
        $sizeValue = floatval($request->size);
        $sizeBytes = $sizeValue * 1024 * 1024 * 1024; // Convert from GB to bytes
        
        $folder->update([
            'name' => $request->folderName,
            'files_count' => intval($request->folderFile),
            'size' => $sizeBytes,
            'path' => '/' . $request->folderName,
        ]);
        
        return response()->json([
            'id' => $folder->id,
            'folderName' => $folder->name,
            'folderFile' => $folder->files_count,
            'size' => $request->size, // Keep the frontend format for response
        ]);
    }

    /**
     * Delete a folder
     */
    public function deleteFolder(Request $request, $id)
    {
        $folder = FileFolder::findOrFail($id);
        
        // Authorize the user can delete this folder
        if ($folder->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $folder->delete();
        
        return response()->json(['success' => true]);
    }

    /**
     * Create a new file record (for frontend integration)
     */
    public function addNewFile(Request $request)
    {
        $request->validate([
            'fileName' => 'required|string|max:255',
        ]);
        
        // Create a dummy placeholder file record
        // In a real implementation, this would be replaced with actual file upload handling
        $file = File::create([
            'name' => $request->fileName,
            'original_name' => $request->fileName,
            'file_path' => 'placeholder', // This would be replaced with actual file path
            'mime_type' => 'text/plain',
            'extension' => 'txt',
            'size' => 0,
            'file_type' => 'Documents',
            'user_id' => Auth::id(),
        ]);
        
        return response()->json([
            'id' => $file->id,
            'fileName' => $file->name,
            'fileItem' => '0',
            'icon' => 'ri-file-text-fill',
            'iconClass' => 'secondary',
            'fileType' => 'Documents',
            'size' => '0 KB',
            'createDate' => $file->created_at->format('d M, Y'),
        ]);
    }

    /**
     * Update a file
     */
    public function updateFile(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:files,id',
            'fileName' => 'required|string|max:255',
            'fileItem' => 'required|string',
            'size' => 'required|string',
        ]);
        
        $file = File::findOrFail($request->id);
        
        // Authorize the user can update this file
        if ($file->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $file->update([
            'name' => $request->fileName,
        ]);
        
        $iconInfo = $file->icon_class;
        
        return response()->json([
            'id' => $file->id,
            'fileName' => $file->name,
            'fileItem' => $request->fileItem,
            'icon' => $iconInfo['icon'],
            'iconClass' => $iconInfo['class'],
            'fileType' => $file->file_type,
            'size' => $file->formatted_size,
            'createDate' => $file->created_at->format('d M, Y'),
        ]);
    }

    /**
     * Delete a file
     */
    public function deleteFile(Request $request, $id)
    {
        $file = File::findOrFail($id);
        
        // Authorize the user can delete this file
        if ($file->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Delete the actual file if it exists
        if ($file->file_path !== 'placeholder' && Storage::exists($file->file_path)) {
            Storage::delete($file->file_path);
        }
        
        $file->delete();
        
        // Update parent folder stats if needed
        if ($file->folder_id) {
            $file->folder->updateStats();
        }
        
        return response()->json(['success' => true]);
    }

    /**
     * Get storage statistics for the current user
     */
    public function getStorageStats()
    {
        // Total storage allocation (default to 119 GB as in the frontend)
        $totalSpace = 119 * 1024 * 1024 * 1024; // 119 GB in bytes
        
        // Used space
        $usedSpace = File::where('user_id', Auth::id())->sum('size');
        
        // Space by file type
        $documentSpace = File::where('user_id', Auth::id())
            ->where('file_type', 'Documents')
            ->sum('size');
            
        $mediaSpace = File::where('user_id', Auth::id())
            ->where('file_type', 'Media')
            ->sum('size');
            
        $documentsCount = File::where('user_id', Auth::id())
            ->where('file_type', 'Documents')
            ->count();
            
        $mediaCount = File::where('user_id', Auth::id())
            ->where('file_type', 'Media')
            ->count();
            
        // Project folder space (if it exists)
        $projectsFolder = FileFolder::where('user_id', Auth::id())
            ->where('name', 'Projects')
            ->first();
            
        $projectSpace = $projectsFolder ? $projectsFolder->size : 0;
        $projectsCount = $projectsFolder ? $projectsFolder->files_count : 0;
        
        // Other files space
        $otherSpace = File::where('user_id', Auth::id())
            ->where('file_type', 'Others')
            ->sum('size');
            
        $othersCount = File::where('user_id', Auth::id())
            ->where('file_type', 'Others')
            ->count();
        
        return response()->json([
            'total' => $this->formatBytes($totalSpace),
            'used' => $this->formatBytes($usedSpace),
            'percentage' => $totalSpace > 0 ? round(($usedSpace / $totalSpace) * 100, 2) : 0,
            'types' => [
                'documents' => [
                    'size' => $this->formatBytes($documentSpace),
                    'count' => $documentsCount,
                ],
                'media' => [
                    'size' => $this->formatBytes($mediaSpace),
                    'count' => $mediaCount,
                ],
                'projects' => [
                    'size' => $this->formatBytes($projectSpace),
                    'count' => $projectsCount,
                ],
                'others' => [
                    'size' => $this->formatBytes($otherSpace),
                    'count' => $othersCount,
                ],
            ]
        ]);
    }

    /**
     * Upload a file using AJAX
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
        $fileType = $this->determineFileType($mimeType, $extension);
        
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
        
        // Get icon class based on file type
        $iconInfo = $this->getFileIconClass($extension);
        
        return response()->json([
            'success' => true,
            'file' => [
                'id' => $file->id,
                'fileName' => $file->name,
                'fileItem' => '01',
                'icon' => $iconInfo['icon'],
                'iconClass' => $iconInfo['class'],
                'fileType' => $file->file_type,
                'size' => $this->formatBytes($size),
                'createDate' => $file->created_at->format('d M, Y'),
            ]
        ]);
    }

    /**
     * Format bytes to human-readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    /**
     * Determine file type based on mime type and extension
     */
    private function determineFileType($mimeType, $extension)
    {
        $extension = strtolower($extension);
        
        if (str_starts_with($mimeType, 'image/') || in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'])) {
            return 'Media';
        } elseif (str_starts_with($mimeType, 'video/') || in_array($extension, ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'])) {
            return 'Media';
        } elseif (str_starts_with($mimeType, 'audio/') || in_array($extension, ['mp3', 'wav', 'ogg', 'flac'])) {
            return 'Media';
        } elseif (in_array($extension, ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'md', 'csv'])) {
            return 'Documents';
        } else {
            return 'Others';
        }
    }

    /**
     * Get file icon class based on extension
     */
    private function getFileIconClass($extension)
    {
        $extension = strtolower($extension);
        
        if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'])) {
            return ['icon' => 'ri-gallery-fill', 'class' => 'success'];
        } elseif (in_array($extension, ['pdf'])) {
            return ['icon' => 'ri-file-pdf-fill', 'class' => 'danger'];
        } elseif (in_array($extension, ['doc', 'docx'])) {
            return ['icon' => 'ri-file-word-fill', 'class' => 'info'];
        } elseif (in_array($extension, ['xls', 'xlsx', 'csv'])) {
            return ['icon' => 'ri-file-excel-fill', 'class' => 'success'];
        } elseif (in_array($extension, ['ppt', 'pptx'])) {
            return ['icon' => 'ri-file-ppt-fill', 'class' => 'warning'];
        } elseif (in_array($extension, ['zip', 'rar', '7z', 'tar', 'gz'])) {
            return ['icon' => 'ri-file-zip-fill', 'class' => 'primary'];
        } elseif (in_array($extension, ['mp3', 'wav', 'ogg', 'flac'])) {
            return ['icon' => 'ri-file-music-fill', 'class' => 'info'];
        } elseif (in_array($extension, ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'])) {
            return ['icon' => 'ri-video-fill', 'class' => 'warning'];
        } elseif (in_array($extension, ['txt', 'rtf', 'md'])) {
            return ['icon' => 'ri-file-text-fill', 'class' => 'secondary'];
        } elseif (in_array($extension, ['html', 'htm', 'xml', 'js', 'css', 'php', 'py', 'java'])) {
            return ['icon' => 'ri-code-fill', 'class' => 'primary'];
        } else {
            return ['icon' => 'ri-file-fill', 'class' => 'secondary'];
        }
    }
}
