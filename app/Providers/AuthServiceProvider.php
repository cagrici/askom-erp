<?php

namespace App\Providers;

use App\Models\Announcement;
use App\Models\Document;
use App\Models\WorkRequest;
use App\Models\MessageGroup;
use App\Models\Message;
use App\Models\JobGroup;
use App\Models\SalesOrder;
use App\Policies\AnnouncementPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\WorkRequestPolicy;
use App\Policies\MessageGroupPolicy;
use App\Policies\MessagePolicy;
use App\Policies\JobGroupPolicy;
use App\Policies\SalesOrderPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Announcement::class => AnnouncementPolicy::class,
        Document::class => DocumentPolicy::class,
        WorkRequest::class => WorkRequestPolicy::class,
        MessageGroup::class => MessageGroupPolicy::class,
        Message::class => MessagePolicy::class,
        JobGroup::class => JobGroupPolicy::class,
        SalesOrder::class => SalesOrderPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Sales Analytics Gates
        Gate::define('view-sales-analytics', function ($user) {
            // For now, allow all authenticated users
            // In production, you would check user roles/permissions
            return $user !== null;
        });

        Gate::define('export-sales-data', function ($user) {
            // For now, allow all authenticated users
            // In production, you would check user roles/permissions
            return $user !== null;
        });
    }
}
