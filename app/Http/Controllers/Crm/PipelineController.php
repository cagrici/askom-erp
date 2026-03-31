<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\SalesOffer;
use App\Models\PipelineStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PipelineController extends Controller
{
    /**
     * Display pipeline Kanban view
     */
    public function index(Request $request)
    {
        $stages = PipelineStage::active()->ordered()->get();

        $offersByStage = [];
        foreach ($stages as $stage) {
            $query = SalesOffer::with(['entity', 'creator', 'currency'])
                ->where('pipeline_stage_id', $stage->id)
                ->whereNotIn('status', ['converted_to_order', 'expired']);

            if ($request->filled('sales_person_id')) {
                $query->where('sales_person_id', $request->sales_person_id);
            }

            if ($request->filled('date_from')) {
                $query->whereDate('offer_date', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('offer_date', '<=', $request->date_to);
            }

            $offersByStage[$stage->id] = $query->orderBy('updated_at', 'desc')->get();
        }

        // Calculate summary
        $summary = [
            'total_count' => SalesOffer::whereNotNull('pipeline_stage_id')
                ->whereNotIn('status', ['converted_to_order', 'expired'])
                ->count(),
            'total_value' => SalesOffer::whereNotNull('pipeline_stage_id')
                ->whereNotIn('status', ['converted_to_order', 'expired'])
                ->sum('total_amount'),
            'weighted_value' => SalesOffer::whereNotNull('pipeline_stage_id')
                ->whereNotIn('status', ['converted_to_order', 'expired'])
                ->sum('weighted_value'),
        ];

        return Inertia::render('Crm/Pipeline/Index', [
            'stages' => $stages,
            'offersByStage' => $offersByStage,
            'summary' => $summary,
            'filters' => $request->only(['sales_person_id', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Get pipeline summary
     */
    public function summary()
    {
        $stages = PipelineStage::active()->ordered()->get();

        $summary = [];
        foreach ($stages as $stage) {
            $offers = SalesOffer::where('pipeline_stage_id', $stage->id)
                ->whereNotIn('status', ['converted_to_order', 'expired']);

            $summary[] = [
                'stage' => $stage,
                'count' => $offers->count(),
                'total_value' => $offers->sum('total_amount'),
                'weighted_value' => $offers->sum('weighted_value'),
            ];
        }

        $totals = [
            'count' => collect($summary)->sum('count'),
            'total_value' => collect($summary)->sum('total_value'),
            'weighted_value' => collect($summary)->sum('weighted_value'),
        ];

        return response()->json([
            'stages' => $summary,
            'totals' => $totals,
        ]);
    }

    /**
     * Update offer pipeline stage
     */
    public function updateStage(Request $request, SalesOffer $salesOffer)
    {
        $validated = $request->validate([
            'stage_id' => 'required|exists:pipeline_stages,id',
            'notes' => 'nullable|string',
        ]);

        $newStage = PipelineStage::find($validated['stage_id']);
        $salesOffer->updatePipelineStage($newStage, $validated['notes'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Pipeline aşaması güncellendi.',
            'offer' => $salesOffer->fresh(['pipelineStage', 'entity']),
        ]);
    }
}
