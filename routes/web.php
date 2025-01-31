<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ContactController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Homepage');
})->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/about', function () {
    return Inertia::render('About');
})->name('about');

Route::get('/services', function () {
    return Inertia::render('Services');
})->name('services');

Route::get('/services/cloud-architecture', function () {
    return Inertia::render('Services/CloudArchitecture');
})->name('services.cloud-architecture');

Route::get('/services/devops', function () {
    return Inertia::render('Services/DevOps');
})->name('services.devops');

Route::get('/services/infrastructure-as-code', function () {
    return Inertia::render('Services/InfrastructureAsCode');
})->name('services.infrastructure-as-code');

Route::get('/services/serverless-infrastructure', function () {
    return Inertia::render('Services/ServerlessInfrastructure');
})->name('services.serverless-infrastructure');

Route::get('/services/automated-deployment', function () {
    return Inertia::render('Services/AutomatedDeployment');
})->name('services.automated-deployment');

Route::get('/services/security-consulting', function () {
    return Inertia::render('Services/SecurityConsulting');
})->name('services.security-consulting');

Route::get('/services/performance-optimization', function () {
    return Inertia::render('Services/PerformanceOptimization');
})->name('services.performance-optimization');

Route::get('/services/infrastructure-migration', function () {
    return Inertia::render('Services/InfrastructureMigration');
})->name('services.infrastructure-migration');

Route::get('/services/mlops', function () {
    return Inertia::render('Services/MLOps');
})->name('services.mlops');

Route::get('/services/database-migration', function () {
    return Inertia::render('Services/DatabaseMigration');
})->name('services.database-migration');

Route::get('/services/monitoring-observability', function () {
    return Inertia::render('Services/MonitoringObservability');
})->name('services.monitoring-observability');

Route::get('/services/database-optimization', function () {
    return Inertia::render('Services/DatabaseOptimization');
})->name('services.database-optimization');

Route::get('/book', function () {
    return Inertia::render('Book');
})->name('book');

Route::get('/contact', function () {
    return Inertia::render('Contact');
})->name('contact');

Route::post('/contact', [ContactController::class, 'submit'])->name('contact.submit');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
