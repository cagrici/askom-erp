<?php

namespace App\Http\Resources\Announcement;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnnouncementResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'icon' => $this->category->icon,
                    'color' => $this->category->color,
                ];
            }),
            'created_by' => $this->whenLoaded('createdBy', function () {
                return [
                    'id' => $this->createdBy->id,
                    'name' => $this->createdBy->name,
                    'avatar' => $this->createdBy->avatar,
                ];
            }),
            'updated_by' => $this->whenLoaded('updatedBy', function () {
                return [
                    'id' => $this->updatedBy->id,
                    'name' => $this->updatedBy->name,
                ];
            }),
            'department' => $this->whenLoaded('department', function () {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                ];
            }),
            'location' => $this->whenLoaded('location', function () {
                return [
                    'id' => $this->location->id,
                    'name' => $this->location->name,
                ];
            }),
            'recipient_roles' => $this->recipient_roles,
            'recipient_departments' => $this->recipient_departments,
            'is_featured' => $this->is_featured,
            'is_pinned' => $this->is_pinned,
            'show_on_login' => $this->show_on_login,
            'status' => $this->status,
            'publish_at' => $this->publish_at?->toISOString(),
            'expire_at' => $this->expire_at?->toISOString(),
            'cover_image_url' => $this->cover_image_url,
            'files' => $this->whenLoaded('files', function () {
                return $this->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'name' => $file->file_name,
                        'size' => $file->file_size,
                        'type' => $file->file_type,
                        'download_url' => route('announcements.download-file', $file),
                    ];
                });
            }),
            'is_read' => $this->when(isset($this->is_read), $this->is_read),
            'read_count' => $this->when(isset($this->read_count), $this->read_count),
            'audience_count' => $this->when(isset($this->audience_count), $this->audience_count),
            'read_percentage' => $this->when(isset($this->read_percentage), $this->read_percentage),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
