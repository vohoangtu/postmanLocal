<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * Onboarding Controller
 * Quản lý onboarding flow cho user
 */
class OnboardingController extends Controller
{
    /**
     * Lấy trạng thái onboarding
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $onboarding = $user->onboarding ?? [
            'completed' => false,
            'current_step' => 'welcome',
            'completed_steps' => [],
            'started_at' => null,
            'completed_at' => null,
        ];

        return response()->json([
            'onboarding' => $onboarding,
        ]);
    }

    /**
     * Hoàn thành một bước onboarding
     */
    public function completeStep(Request $request)
    {
        $request->validate([
            'step' => 'required|string|in:welcome,create_request,send_request,explore_features,complete',
        ]);

        $user = $request->user();
        $user->completeOnboardingStep($request->step);

        return response()->json([
            'message' => 'Bước đã được hoàn thành',
            'onboarding' => $user->fresh()->onboarding,
        ]);
    }

    /**
     * Hoàn thành toàn bộ onboarding
     */
    public function complete(Request $request)
    {
        $user = $request->user();
        $user->completeOnboarding();

        return response()->json([
            'message' => 'Onboarding đã hoàn thành',
            'onboarding' => $user->fresh()->onboarding,
        ]);
    }

    /**
     * Reset onboarding (cho testing)
     */
    public function reset(Request $request)
    {
        // Chỉ cho phép trong môi trường development
        if (config('app.env') === 'production') {
            return response()->json([
                'message' => 'Không thể reset onboarding trong môi trường production',
            ], 403);
        }

        $user = $request->user();
        $user->resetOnboarding();

        return response()->json([
            'message' => 'Onboarding đã được reset',
            'onboarding' => $user->fresh()->onboarding,
        ]);
    }
}
