<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use App\Models\FileFolder;
use App\Models\User;

class SetupFileManager extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'file-manager:setup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set up the file manager module by creating necessary directories and default folders';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Setting up File Manager module...');

        // Make sure necessary tables exist
        $this->info('Running migrations...');
        Artisan::call('migrate');
        $this->info(Artisan::output());

        // Create storage directories
        $this->info('Creating storage directories...');
        Storage::disk('public')->makeDirectory('files', 0755, true);
        
        // Create symbolic link if it doesn't exist
        $this->info('Making sure storage is linked...');
        Artisan::call('storage:link');
        $this->info(Artisan::output());

        // Create default folders for each user
        $this->info('Creating default folders for users...');
        $users = User::all();
        
        $defaultFolders = [
            'Assets' => ['size' => 0, 'files_count' => 0],
            'Marketing' => ['size' => 0, 'files_count' => 0],
            'Personal' => ['size' => 0, 'files_count' => 0],
            'Projects' => ['size' => 4.10 * 1024 * 1024 * 1024, 'files_count' => 349], // From sample data
            'Documents' => ['size' => 27.01 * 1024 * 1024 * 1024, 'files_count' => 2349], // From sample data
            'Media' => ['size' => 20.87 * 1024 * 1024 * 1024, 'files_count' => 12480], // From sample data
        ];
        
        foreach ($users as $user) {
            // Create user directory
            Storage::disk('public')->makeDirectory('files/' . $user->id, 0755, true);
            
            $this->info("Creating default folders for user: {$user->name}");
            
            // Create default folders for the user
            foreach ($defaultFolders as $folderName => $stats) {
                // Check if folder already exists
                $existingFolder = FileFolder::where('user_id', $user->id)
                    ->where('name', $folderName)
                    ->first();
                    
                if (!$existingFolder) {
                    FileFolder::create([
                        'name' => $folderName,
                        'user_id' => $user->id,
                        'path' => '/' . $folderName,
                        'size' => $stats['size'],
                        'files_count' => $stats['files_count'],
                    ]);
                    
                    $this->info("  Created folder: {$folderName}");
                } else {
                    $this->info("  Folder already exists: {$folderName}");
                }
            }
        }
        
        $this->info('File Manager setup completed successfully!');
        
        return Command::SUCCESS;
    }
}
