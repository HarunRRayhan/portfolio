<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class NewsletterController extends Controller
{
    public function index(): Response
    {
        $subscribers = Subscriber::query()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(25);

        $subscribers->getCollection()->transform(fn (Subscriber $subscriber) => $this->toPayload($subscriber));

        return Inertia::render('Admin/Newsletter/Index', [
            'subscribers' => $subscribers,
        ]);
    }

    /**
     * Looks the subscriber up manually rather than via implicit route-model
     * binding: binding runs as route middleware, before the role:admin
     * check in this route's own middleware stack, so a non-admin could
     * otherwise tell real subscriber ids from fake ones by whether they get
     * a 404 (binding failed) or a 403 (role check failed). A plain id
     * param defers the lookup into the controller, which only ever runs
     * after every middleware -- including role:admin -- has passed.
     */
    public function reveal(string $subscriberId, Request $request): JsonResponse
    {
        $subscriber = Subscriber::findOrFail($subscriberId);

        Log::info('Admin revealed a subscriber email.', [
            'admin_id' => $request->user()->id,
            'subscriber_id' => $subscriber->id,
        ]);

        return response()->json(['email' => $subscriber->email])
            ->header('Cache-Control', 'no-store, private');
    }

    /**
     * @return array<string, mixed>
     */
    private function toPayload(Subscriber $subscriber): array
    {
        return [
            'id' => $subscriber->id,
            'masked_email' => $subscriber->maskedEmail(),
            'source' => $subscriber->source,
            'status' => $subscriber->status,
            'created_at' => $subscriber->created_at?->toIso8601String(),
        ];
    }
}
