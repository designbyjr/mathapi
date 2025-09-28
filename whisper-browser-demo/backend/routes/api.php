<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ChatResponseController;

Route::post('/chat/respond', ChatResponseController::class)->name('api.chat.respond');
