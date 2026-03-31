<?php

namespace App\Http\Controllers\VannaAI;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class VannaAIController extends Controller
{
    /**
     * Vanna.ai API base URL
     */
    protected $apiBaseUrl = 'https://app.vanna.ai/api';
    
    /**
     * Your Vanna.ai API Key
     */
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.vanna_ai.api_key');
    }

    /**
     * Display the Vanna AI chat interface
     */
    public function index()
    {
        return Inertia::render('VannaAI/Chat');
    }

    /**
     * Send a message to Vanna.ai API
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'conversation_id' => 'nullable|string',
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiBaseUrl . '/v1/chat', [
                'message' => $request->message,
                'conversation_id' => $request->conversation_id ?? null,
            ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            Log::error('Vanna.ai API Error: ' . $response->body());
            return response()->json([
                'error' => 'Vanna.ai API hata döndürdü.',
                'details' => $response->json()
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Vanna.ai API Exception: ' . $e->getMessage());
            return response()->json([
                'error' => 'Vanna.ai API ile iletişim kurulurken bir hata oluştu.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get conversation history from Vanna.ai API
     */
    public function getConversation(Request $request)
    {
        $request->validate([
            'conversation_id' => 'required|string',
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->get($this->apiBaseUrl . '/v1/conversation/' . $request->conversation_id);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            Log::error('Vanna.ai API Error: ' . $response->body());
            return response()->json([
                'error' => 'Vanna.ai API hata döndürdü.',
                'details' => $response->json()
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Vanna.ai API Exception: ' . $e->getMessage());
            return response()->json([
                'error' => 'Vanna.ai API ile iletişim kurulurken bir hata oluştu.',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new conversation in Vanna.ai API
     */
    public function createConversation(Request $request)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiBaseUrl . '/v1/conversation');

            if ($response->successful()) {
                return response()->json($response->json());
            }

            Log::error('Vanna.ai API Error: ' . $response->body());
            return response()->json([
                'error' => 'Vanna.ai API hata döndürdü.',
                'details' => $response->json()
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Vanna.ai API Exception: ' . $e->getMessage());
            return response()->json([
                'error' => 'Vanna.ai API ile iletişim kurulurken bir hata oluştu.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}