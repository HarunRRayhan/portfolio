<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class NewsletterController extends Controller
{
    public function index(): Response
    {
        $subscribers = Subscriber::query()->latest()->paginate(25);

        $subscribers->getCollection()->transform(fn (Subscriber $subscriber) => [
            'id' => $subscriber->id,
            'masked_email' => $subscriber->maskedEmail(),
            'source' => $subscriber->source,
            'status' => $subscriber->status,
            'created_at' => $subscriber->created_at?->toIso8601String(),
        ]);

        return Inertia::render('Admin/Newsletter/Index', [
            'subscribers' => $subscribers,
            'total' => Subscriber::count(),
        ]);
    }

    public function reveal(Subscriber $subscriber): JsonResponse
    {
        return response()->json(['email' => $subscriber->email]);
    }
}
