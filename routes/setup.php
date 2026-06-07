<?php

use Illuminate\Support\Facades\Route;
use Realm\Http\Controllers\Setup\SetupController;

/*
|--------------------------------------------------------------------------
| Setup Wizard Routes
|--------------------------------------------------------------------------
|
| Endpoint: /setup
|
*/

Route::get('/', [SetupController::class, 'index'])->name('setup.index');
Route::get('/status', [SetupController::class, 'status'])->name('setup.status');

Route::middleware(['throttle:authentication'])->group(function () {
    Route::post('/welcome', [SetupController::class, 'acknowledgeWelcome'])->name('setup.welcome');
    Route::post('/environment', [SetupController::class, 'configureEnvironment'])->name('setup.environment');
    Route::post('/admin', [SetupController::class, 'createAdmin'])->name('setup.admin');
});

Route::middleware(['auth', 'throttle:api.client'])->group(function () {
    Route::post('/settings', [SetupController::class, 'updateSettings'])->name('setup.settings');
    Route::post('/location', [SetupController::class, 'createLocation'])->name('setup.location');
    Route::post('/location/continue', [SetupController::class, 'continueLocation'])->name('setup.location.continue');
    Route::post('/node', [SetupController::class, 'createNode'])->name('setup.node');
    Route::get('/node/{node}/configuration', [SetupController::class, 'nodeConfiguration'])->name('setup.node.configuration');
    Route::post('/node/{node}/verify', [SetupController::class, 'verifyNode'])->name('setup.node.verify');
    Route::post('/node/{node}/allocations', [SetupController::class, 'createAllocations'])->name('setup.allocations');
    Route::post('/skip-server', [SetupController::class, 'skipServer'])->name('setup.skip-server');
    Route::post('/complete', [SetupController::class, 'complete'])->name('setup.complete');
});

Route::fallback([SetupController::class, 'index']);
