<?php

use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\OtpController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\TwoFactorController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);

    Route::get('register', [RegisterController::class, 'create'])->name('register');
    Route::post('register', [RegisterController::class, 'store'])->middleware('throttle:10,60');

    Route::get('forgot-password', [ForgotPasswordController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [ForgotPasswordController::class, 'store'])->name('password.email')->middleware('throttle:5,60');

    Route::get('reset-password/{token}', [ResetPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [ResetPasswordController::class, 'store'])->name('password.update');

    Route::get('auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
    Route::get('auth/google/callback', [GoogleController::class, 'callback']);

    Route::get('two-factor', [TwoFactorController::class, 'create'])->name('two-factor');
    Route::post('two-factor', [TwoFactorController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::get('email/verify', [OtpController::class, 'create'])->name('verification.notice');
    Route::post('email/verify', [OtpController::class, 'store'])->name('verification.verify');
    Route::post('email/verification-notification', [OtpController::class, 'resend'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');
});
