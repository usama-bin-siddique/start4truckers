<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OperationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RequestLogController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\Api\Web3FormsController;
use Illuminate\Support\Facades\Route;

// Root redirect
Route::get('/', fn () => redirect()->route('login'));

// Auth routes (guest only)
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');
});

Route::post('/logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

// Authenticated routes
Route::middleware(['auth'])->group(function () {

    // Dashboard — all roles
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Leads — admin + sales + manager
    Route::middleware('role:admin,sales,manager')->group(function () {
        Route::get('/leads',                [LeadController::class, 'index'])->name('leads.index');
        Route::get('/leads/create',         [LeadController::class, 'create'])->name('leads.create');
        Route::post('/leads',               [LeadController::class, 'store'])->name('leads.store');
        Route::get('/leads/{lead}',         [LeadController::class, 'show'])->name('leads.show');
        Route::put('/leads/{lead}',         [LeadController::class, 'update'])->name('leads.update');
        Route::patch('/leads/{lead}/status',[LeadController::class, 'updateStatus'])->name('leads.status');
        Route::post('/leads/{lead}/note',   [LeadController::class, 'addNote'])->name('leads.note');
        Route::post('/leads/{lead}/call',   [LeadController::class, 'logCall'])->name('leads.call');
        Route::post('/leads/{lead}/follow-up', [LeadController::class, 'followUp'])->name('leads.follow-up');
        Route::post('/leads/{lead}/invoices', [LeadController::class, 'storeInvoice'])->name('leads.invoices.store');
        Route::post('/leads/{lead}/assign', [LeadController::class, 'assign'])->name('leads.assign');
        Route::post('/leads/{lead}/convert',[LeadController::class, 'convert'])->name('leads.convert');
        Route::delete('/leads/{lead}',      [LeadController::class, 'destroy'])->name('leads.destroy');
    });

    // Clients — all roles view; create/update enforced by policy
    Route::get('/clients',          [ClientController::class, 'index'])->name('clients.index');
    Route::get('/clients/create',   [ClientController::class, 'create'])->name('clients.create');
    Route::post('/clients',         [ClientController::class, 'store'])->name('clients.store');
    Route::get('/clients/{client}', [ClientController::class, 'show'])->name('clients.show');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');

    // Payments — admin + sales
    Route::middleware('role:admin,sales')->group(function () {
        Route::get('/payments',               [PaymentController::class, 'index'])->name('payments.index');
        Route::post('/payments',              [PaymentController::class, 'store'])->name('payments.store');
        Route::put('/payments/{payment}',     [PaymentController::class, 'update'])->name('payments.update');
        Route::delete('/payments/{payment}',  [PaymentController::class, 'destroy'])->name('payments.destroy');
        Route::post('/payments/{payment}/receipt', [PaymentController::class, 'uploadReceipt'])->name('payments.receipt');
        Route::get('/payments/{payment}/receipt',  [PaymentController::class, 'downloadReceipt'])->name('payments.receipt.download');
    });

    // Operations — admin + processing
    Route::middleware('role:admin,processing')->group(function () {
        Route::get('/operations',              [OperationController::class, 'index'])->name('operations.index');
        Route::post('/operations',             [OperationController::class, 'store'])->name('operations.store');
        Route::put('/operations/{operation}',  [OperationController::class, 'update'])->name('operations.update');
    });

    // Documents — all roles view; upload/delete enforced by policy
    Route::get('/documents',                  [DocumentController::class, 'index'])->name('documents.index');
    Route::post('/documents',                 [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::delete('/documents/{document}',    [DocumentController::class, 'destroy'])->name('documents.destroy');

    // Tasks — all roles
    Route::get('/tasks',                [TaskController::class, 'index'])->name('tasks.index');
    Route::post('/tasks',               [TaskController::class, 'store'])->name('tasks.store');
    Route::put('/tasks/{task}',         [TaskController::class, 'update'])->name('tasks.update');
    Route::patch('/tasks/{task}/complete', [TaskController::class, 'complete'])->name('tasks.complete');
    Route::delete('/tasks/{task}',      [TaskController::class, 'destroy'])->name('tasks.destroy');

    // Reports — admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/request-logs', [RequestLogController::class, 'index'])->name('request-logs.index');
        Route::get('/request-logs/{requestLog}', [RequestLogController::class, 'show'])->name('request-logs.show');
    });

    // Notifications — all roles
    Route::get('/notifications',                     [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read',          [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/mark-all-read',      [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllRead');
    Route::get('/api/notifications/unread-count',    [NotificationController::class, 'getUnreadCount'])->name('notifications.unreadCount');

    // Settings — admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/settings',                          [SettingsController::class, 'index'])->name('settings.index');
        // Users
        Route::post('/settings/users',                  [SettingsController::class, 'storeUser'])->name('settings.users.store');
        Route::put('/settings/users/{user}',            [SettingsController::class, 'updateUser'])->name('settings.users.update');
        Route::delete('/settings/users/{user}',         [SettingsController::class, 'destroyUser'])->name('settings.users.destroy');
        // Services
        Route::post('/settings/services',               [SettingsController::class, 'storeService'])->name('settings.services.store');
        Route::put('/settings/services/{service}',      [SettingsController::class, 'updateService'])->name('settings.services.update');
        Route::delete('/settings/services/{service}',   [SettingsController::class, 'destroyService'])->name('settings.services.destroy');
        // Email templates
        Route::post('/settings/templates',              [SettingsController::class, 'storeTemplate'])->name('settings.templates.store');
        Route::put('/settings/templates/{template}',    [SettingsController::class, 'updateTemplate'])->name('settings.templates.update');
        Route::delete('/settings/templates/{template}', [SettingsController::class, 'destroyTemplate'])->name('settings.templates.destroy');
        // General + API settings
        Route::post('/settings/general',                [SettingsController::class, 'updateSettings'])->name('settings.general.update');
        Route::post('/settings/website-api-key',        [SettingsController::class, 'regenerateWebsiteApiKey'])->name('settings.website-api-key');
    });
});

// Web3Forms webhook — no auth, secret validated inside controller
Route::post('/api/webhook/web3forms', [Web3FormsController::class, 'receive'])
    ->name('webhook.web3forms')
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);
