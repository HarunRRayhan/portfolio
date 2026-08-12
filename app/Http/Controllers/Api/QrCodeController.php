<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class QrCodeController extends Controller
{
    /**
     * Generate a QR code for arbitrary text/URL content. JSON with a
     * data-uri by default; ?format=png returns raw PNG bytes instead, so
     * the same endpoint can back an <img src> or a direct download.
     */
    public function store(Request $request): JsonResponse|Response
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
        ]);

        $result = (new Builder(writer: new PngWriter))->build(data: $data['content']);

        if ($request->query('format') === 'png') {
            return response($result->getString(), 200, [
                'Content-Type' => 'image/png',
            ]);
        }

        return response()->json([
            'qr_code' => $result->getDataUri(),
        ]);
    }
}
