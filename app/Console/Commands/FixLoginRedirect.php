<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\LoginRedirect;
use App\Models\User;

class FixLoginRedirect extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:login-redirect {user_id} {redirect_to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix login redirect for a specific user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user_id');
        $redirectTo = $this->argument('redirect_to');

        // Check if user exists
        $user = User::find($userId);
        if (!$user) {
            $this->error("User with ID {$userId} not found.");
            return 1;
        }

        // Create or update the login redirect
        $redirect = LoginRedirect::updateOrCreate(
            [
                'type' => 'user',
                'user_id' => $userId,
            ],
            [
                'redirect_to' => $redirectTo,
                'name' => "Custom Redirect for {$user->name}",
                'description' => "Login redirect for user {$user->name} (ID: {$userId})",
                'priority' => 100,
                'is_active' => true,
            ]
        );

        $this->info("Login redirect created/updated successfully!");
        $this->info("User: {$user->name} (ID: {$userId})");
        $this->info("Redirect to: {$redirectTo}");
        $this->info("Status: " . ($redirect->is_active ? 'Active' : 'Inactive'));
        
        // Test the redirect
        $testRedirect = LoginRedirect::getRedirectForUser($user);
        $this->info("Test result: User should redirect to: " . ($testRedirect ?? 'Default route'));

        return 0;
    }
}