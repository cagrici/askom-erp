<?php

namespace App\Http\Controllers\FileManager;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\FileFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FileManagerTestController extends Controller
{
    /**
     * Test API response
     */
    public function testApi()
    {
        // Get total number of folders and files
        $foldersCount = FileFolder::where('user_id', Auth::id())->count();
        $filesCount = File::where('user_id', Auth::id())->count();
        
        return response()->json([
            'success' => true,
            'message' => 'File Manager API is working properly',
            'stats' => [
                'folders_count' => $foldersCount,
                'files_count' => $filesCount,
                'user_id' => Auth::id(),
            ],
        ]);
    }
}
