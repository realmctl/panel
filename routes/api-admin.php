<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Admin\SettingsController;

Route::get('/settings', [SettingsController::class, 'index']);
Route::patch('/settings/general', [SettingsController::class, 'updateGeneral']);
