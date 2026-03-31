<?php

namespace App\Models\Traits;

use Spatie\MediaLibrary\MediaCollections\Models\Media;

trait HasHashedMediaTrait
{
    /**
     * Get the URL for the default media item.
     */
    public function getMediaUrl($collection = 'default', $conversion = ''): ?string
    {
        $media = $this->getFirstMedia($collection);

        if (!$media) {
            return null;
        }

        return $conversion ? $media->getUrl($conversion) : $media->getUrl();
    }

    /**
     * Get all media URLs for a collection.
     */
    public function getMediaUrls($collection = 'default', $conversion = ''): array
    {
        return $this->getMedia($collection)->map(function (Media $media) use ($conversion) {
            return $conversion ? $media->getUrl($conversion) : $media->getUrl();
        })->toArray();
    }

    /**
     * Check if the model has media in a collection.
     */
    public function hasMediaInCollection($collection = 'default'): bool
    {
        return $this->getMedia($collection)->isNotEmpty();
    }

    /**
     * Get media count for a collection.
     */
    public function getMediaCount($collection = 'default'): int
    {
        return $this->getMedia($collection)->count();
    }

    /**
     * Get formatted file size for media.
     */
    public function getFormattedMediaSize($collection = 'default'): ?string
    {
        $media = $this->getFirstMedia($collection);

        if (!$media) {
            return null;
        }

        return $this->formatBytes($media->size);
    }

    /**
     * Format bytes to human readable format.
     */
    private function formatBytes($bytes, $precision = 2): string
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');

        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Get media with additional metadata.
     */
    public function getMediaWithMetadata($collection = 'default'): array
    {
        return $this->getMedia($collection)->map(function (Media $media) {
            return [
                'id' => $media->id,
                'name' => $media->name,
                'file_name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'formatted_size' => $this->formatBytes($media->size),
                'url' => $media->getUrl(),
                'thumb_url' => $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : null,
                'created_at' => $media->created_at,
                'updated_at' => $media->updated_at,
            ];
        })->toArray();
    }

    /**
     * Add media from URL with custom collection.
     */
    public function addMediaFromUrlToCollection($url, $collection = 'default'): ?Media
    {
        try {
            return $this->addMediaFromUrl($url)
                ->toMediaCollection($collection);
        } catch (\Exception $e) {
            \Log::error('Failed to add media from URL: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Add media from base64 string.
     */
    public function addMediaFromBase64String($base64String, $fileName, $collection = 'default'): ?Media
    {
        try {
            // Decode base64 string
            $data = base64_decode($base64String);
            
            // Create temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'media_');
            file_put_contents($tempFile, $data);

            // Add media
            $media = $this->addMedia($tempFile)
                ->usingName($fileName)
                ->usingFileName($fileName)
                ->toMediaCollection($collection);

            // Clean up temporary file
            unlink($tempFile);

            return $media;
        } catch (\Exception $e) {
            \Log::error('Failed to add media from base64: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete all media in a collection.
     */
    public function deleteAllMediaInCollection($collection = 'default'): void
    {
        $this->getMedia($collection)->each(function (Media $media) {
            $media->delete();
        });
    }
}