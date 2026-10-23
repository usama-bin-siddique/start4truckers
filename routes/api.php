<?php

use App\Http\Controllers\Api\PayloadLogController;
use App\Http\Controllers\Api\WebsiteLeadController;
use Illuminate\Support\Facades\Route;

Route::post('/leads/log', [PayloadLogController::class, 'store'])
    ->middleware(['throttle:60,1'])
    ->name('api.leads.log');


Route::post('/leads', [WebsiteLeadController::class, 'store'])
    ->middleware(['website.api', 'throttle:30,1'])
    ->name('api.leads.store');
