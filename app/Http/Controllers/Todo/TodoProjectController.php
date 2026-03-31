<?php

namespace App\Http\Controllers\Todo;

use App\Http\Controllers\Controller;
use App\Models\TodoProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class TodoProjectController extends Controller
{
    /**
     * Get all projects for the authenticated user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getProjects()
    {
        $projects = TodoProject::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Format the response to match frontend expectations
        $formattedProjects = $projects->map(function($project) {
            return [
                'id' => $project->id,
                'title' => $project->title,
                'subItem' => json_decode($project->versions) ?? []
            ];
        });
        
        return response()->json($formattedProjects);
    }
    
    /**
     * Create a new project
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'subItem' => 'required'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }
        
        $project = new TodoProject();
        $project->user_id = Auth::id();
        $project->title = $request->title;
        $project->versions = json_encode($request->subItem);
        $project->save();
        
        return response()->json([
            'id' => $project->id,
            'title' => $project->title,
            'subItem' => json_decode($project->versions)
        ]);
    }
    
    /**
     * Update an existing project
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $project = TodoProject::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'subItem' => 'required'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }
        
        $project->title = $request->title;
        $project->versions = json_encode($request->subItem);
        $project->save();
        
        return response()->json([
            'id' => $project->id,
            'title' => $project->title,
            'subItem' => json_decode($project->versions)
        ]);
    }
    
    /**
     * Delete a project
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $project = TodoProject::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        
        $project->delete();
        
        return response()->json(['success' => true]);
    }
    
    /**
     * Get a specific project
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $project = TodoProject::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        
        return response()->json([
            'id' => $project->id,
            'title' => $project->title,
            'subItem' => json_decode($project->versions)
        ]);
    }
    
    /**
     * Add a version to a project
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function addVersion(Request $request, $id)
    {
        $project = TodoProject::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();
            
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'version' => 'required|string|max:255',
            'iconClass' => 'required|string|max:255'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }
        
        $versions = json_decode($project->versions, true) ?? [];
        
        // Generate a new ID for the version
        $newId = count($versions) > 0 ? max(array_column($versions, 'id')) + 1 : 1;
        
        $newVersion = [
            'id' => $newId,
            'version' => $request->version,
            'iconClass' => $request->iconClass
        ];
        
        $versions[] = $newVersion;
        $project->versions = json_encode($versions);
        $project->save();
        
        return response()->json([
            'id' => $project->id,
            'title' => $project->title,
            'subItem' => json_decode($project->versions)
        ]);
    }
}
