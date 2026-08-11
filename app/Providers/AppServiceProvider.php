<?php

namespace App\Providers;

use App\Models\Client;
use App\Models\ClientService;
use App\Models\Document;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Task;
use App\Policies\ClientPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\LeadPolicy;
use App\Policies\OperationPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\TaskPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Lead::class, LeadPolicy::class);
        Gate::policy(Client::class, ClientPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(ClientService::class, OperationPolicy::class);

        // Admin gate — convenience shortcut
        Gate::define('admin', fn ($user) => $user->role === 'admin');
        Gate::define('sales', fn ($user) => in_array($user->role, ['admin', 'sales']));
        Gate::define('processing', fn ($user) => in_array($user->role, ['admin', 'processing']));
    }
}
