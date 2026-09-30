<?php

namespace App\Support;

class ApiCapabilities
{
    public const SCOPES = [
        'short-links:create' => 'Create links',
        'qr-codes:create' => 'Generate QR codes',
        'short-links:read' => 'Read links and statistics',
        'short-links:manage' => 'Deactivate and delete links',
    ];

    public const PRESETS = [
        'links' => ['label' => 'Create links', 'abilities' => ['short-links:create']],
        'qr' => ['label' => 'Generate QR codes', 'abilities' => ['qr-codes:create']],
        'publisher' => ['label' => 'Create links and QR codes', 'abilities' => ['short-links:create', 'qr-codes:create']],
        'reader' => ['label' => 'Read links and statistics', 'abilities' => ['short-links:read']],
        'manager' => ['label' => 'Manage links', 'abilities' => ['short-links:read', 'short-links:manage']],
    ];
}
