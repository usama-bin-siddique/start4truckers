<?php

use App\Http\Controllers\Api\WebsiteLeadController;
use Illuminate\Support\Facades\Route;

Route::post('/leads', [WebsiteLeadController::class, 'store'])
    ->middleware(['website.api', 'throttle:30,1'])
    ->name('api.leads.store');
