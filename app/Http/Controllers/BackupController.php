<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use ZipArchive;

class BackupController extends Controller
{
    /**
     * Display backup management page
     */
    public function index()
    {
        $backups = $this->getBackupList();
        $stats = $this->getBackupStats();

        return Inertia::render('Settings/Backup', [
            'backups' => $backups,
            'stats' => $stats,
        ]);
    }

    /**
     * Create a new backup
     */
    public function create(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:database,files,full',
        ]);

        try {
            $filename = $this->generateBackupFilename($validated['type']);
            $backupPath = storage_path('app/backups');

            // Create backups directory if it doesn't exist
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0755, true);
            }

            switch ($validated['type']) {
                case 'database':
                    $this->createDatabaseBackup($filename);
                    break;
                case 'files':
                    $this->createFilesBackup($filename);
                    break;
                case 'full':
                    $this->createFullBackup($filename);
                    break;
            }

            return back()->with('success', 'Yedekleme başarıyla oluşturuldu.');
        } catch (\Exception $e) {
            return back()->with('error', 'Yedekleme oluşturulurken hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Download a backup file
     */
    public function download(Request $request)
    {
        $filename = $request->input('filename');
        $path = storage_path('app/backups/' . $filename);

        if (!file_exists($path)) {
            return back()->with('error', 'Yedek dosyası bulunamadı.');
        }

        return response()->download($path);
    }

    /**
     * Delete a backup file
     */
    public function delete(Request $request)
    {
        $filename = $request->input('filename');
        $path = storage_path('app/backups/' . $filename);

        if (file_exists($path)) {
            unlink($path);
            return back()->with('success', 'Yedek dosyası silindi.');
        }

        return back()->with('error', 'Yedek dosyası bulunamadı.');
    }

    /**
     * Get list of backups
     */
    private function getBackupList(): array
    {
        $backupPath = storage_path('app/backups');

        if (!file_exists($backupPath)) {
            return [];
        }

        $files = glob($backupPath . '/*.{sql,zip}', GLOB_BRACE);
        $backups = [];

        foreach ($files as $file) {
            $backups[] = [
                'filename' => basename($file),
                'size' => filesize($file),
                'size_formatted' => $this->formatBytes(filesize($file)),
                'created_at' => date('Y-m-d H:i:s', filemtime($file)),
                'type' => $this->getBackupType(basename($file)),
            ];
        }

        // Sort by date descending
        usort($backups, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return $backups;
    }

    /**
     * Get backup statistics
     */
    private function getBackupStats(): array
    {
        $backupPath = storage_path('app/backups');

        if (!file_exists($backupPath)) {
            return [
                'total_backups' => 0,
                'total_size' => 0,
                'total_size_formatted' => '0 B',
                'last_backup' => null,
                'database_size' => $this->getDatabaseSize(),
            ];
        }

        $files = glob($backupPath . '/*.{sql,zip}', GLOB_BRACE);
        $totalSize = 0;
        $lastBackup = null;

        foreach ($files as $file) {
            $totalSize += filesize($file);
            $fileTime = filemtime($file);
            if (!$lastBackup || $fileTime > strtotime($lastBackup)) {
                $lastBackup = date('Y-m-d H:i:s', $fileTime);
            }
        }

        return [
            'total_backups' => count($files),
            'total_size' => $totalSize,
            'total_size_formatted' => $this->formatBytes($totalSize),
            'last_backup' => $lastBackup,
            'database_size' => $this->getDatabaseSize(),
        ];
    }

    /**
     * Create database backup
     */
    private function createDatabaseBackup(string $filename): void
    {
        $host = config('database.connections.mysql.host');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $backupFile = storage_path('app/backups/' . $filename);

        // MySQL dump command
        $command = sprintf(
            'mysqldump -h%s -u%s -p%s %s > %s 2>&1',
            escapeshellarg($host),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($backupFile)
        );

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            throw new \Exception('Veritabanı yedeği oluşturulamadı.');
        }
    }

    /**
     * Create files backup
     */
    private function createFilesBackup(string $filename): void
    {
        $zip = new ZipArchive();
        $zipPath = storage_path('app/backups/' . $filename);

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \Exception('ZIP dosyası oluşturulamadı.');
        }

        // Add important directories
        $directories = [
            storage_path('app/public'),
            public_path('uploads'),
        ];

        foreach ($directories as $directory) {
            if (file_exists($directory)) {
                $this->addDirectoryToZip($zip, $directory, basename($directory));
            }
        }

        $zip->close();
    }

    /**
     * Create full backup (database + files)
     */
    private function createFullBackup(string $filename): void
    {
        $zip = new ZipArchive();
        $zipPath = storage_path('app/backups/' . $filename);

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \Exception('ZIP dosyası oluşturulamadı.');
        }

        // Create database backup first
        $dbFilename = 'database_' . date('Y-m-d_His') . '.sql';
        $this->createDatabaseBackup($dbFilename);
        $zip->addFile(storage_path('app/backups/' . $dbFilename), 'database/' . $dbFilename);

        // Add files
        $directories = [
            storage_path('app/public'),
            public_path('uploads'),
        ];

        foreach ($directories as $directory) {
            if (file_exists($directory)) {
                $this->addDirectoryToZip($zip, $directory, 'files/' . basename($directory));
            }
        }

        $zip->close();

        // Remove temporary database file
        @unlink(storage_path('app/backups/' . $dbFilename));
    }

    /**
     * Add directory to ZIP recursively
     */
    private function addDirectoryToZip(ZipArchive $zip, string $directory, string $localPath): void
    {
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $file) {
            if (!$file->isDir()) {
                $filePath = $file->getRealPath();
                $relativePath = $localPath . '/' . substr($filePath, strlen($directory) + 1);
                $zip->addFile($filePath, $relativePath);
            }
        }
    }

    /**
     * Generate backup filename
     */
    private function generateBackupFilename(string $type): string
    {
        $date = date('Y-m-d_His');
        $extension = ($type === 'database') ? 'sql' : 'zip';
        return "backup_{$type}_{$date}.{$extension}";
    }

    /**
     * Get backup type from filename
     */
    private function getBackupType(string $filename): string
    {
        if (strpos($filename, 'database') !== false) {
            return 'database';
        } elseif (strpos($filename, 'files') !== false) {
            return 'files';
        } elseif (strpos($filename, 'full') !== false) {
            return 'full';
        }
        return 'unknown';
    }

    /**
     * Format bytes to human readable size
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Get database size
     */
    private function getDatabaseSize(): string
    {
        try {
            $database = config('database.connections.mysql.database');
            $result = DB::select("
                SELECT
                    SUM(data_length + index_length) as size
                FROM information_schema.TABLES
                WHERE table_schema = ?
            ", [$database]);

            $bytes = $result[0]->size ?? 0;
            return $this->formatBytes($bytes);
        } catch (\Exception $e) {
            return 'N/A';
        }
    }
}
