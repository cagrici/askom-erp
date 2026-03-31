<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\OfferEmailLog;

class EmailTrackingController extends Controller
{
    /**
     * Serve a 1x1 transparent GIF and record the email open
     */
    public function pixel(string $hash)
    {
        $log = OfferEmailLog::where('tracking_hash', $hash)->first();

        if ($log) {
            $log->recordOpen();
        }

        // 1x1 transparent GIF
        $pixel = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

        return response($pixel, 200, [
            'Content-Type' => 'image/gif',
            'Content-Length' => strlen($pixel),
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }
}
