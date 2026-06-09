<?php

use Illuminate\Support\Facades\Route;
use Realm\Http\Controllers\Base;
use Realm\Http\Middleware\AdminAuthenticate;
use Realm\Http\Middleware\RequireTwoFactorAuthentication;

Route::get('/', [Base\IndexController::class, 'index'])->name('index')->fallback();
Route::get('/account', [Base\IndexController::class, 'index'])
    ->withoutMiddleware(RequireTwoFactorAuthentication::class)
    ->name('account');

Route::get('/locales/locale.json', Base\LocaleController::class)
    ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class])
    ->where('namespace', '.*');

Route::get('/admin/{react?}', [Base\IndexController::class, 'index'])
    ->where('react', '.*')
    ->middleware(AdminAuthenticate::class)
    ->name('admin.index');

Route::get('/{react}', [Base\IndexController::class, 'index'])
    ->where('react', '^(?!(\/)?(api|auth|admin|daemon|setup)).+');
