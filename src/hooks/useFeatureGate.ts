/**
 * useFeatureGate Hook
 * Hook để kiểm tra quyền truy cập tính năng
 */

import { useOnboardingStore } from '../stores/onboardingStore';

// Định nghĩa các tính năng và yêu cầu của chúng
const FEATURE_REQUIREMENTS: Record<string, { requiresOnboarding: boolean }> = {
  // Tính năng cơ bản - luôn available
  create_basic_request: { requiresOnboarding: false },
  send_request: { requiresOnboarding: false },
  view_history: { requiresOnboarding: false },
  
  // Tính năng nâng cao - cần hoàn thành onboarding
  collections: { requiresOnboarding: true },
  environments: { requiresOnboarding: true },
  sync: { requiresOnboarding: true },
  templates: { requiresOnboarding: true },
  graphql: { requiresOnboarding: true },
  websocket: { requiresOnboarding: true },
  request_chaining: { requiresOnboarding: true },
  test_scripts: { requiresOnboarding: true },
  mock_server: { requiresOnboarding: true },
};

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Hook để kiểm tra quyền truy cập tính năng
 */
export function useFeatureGate(feature: string): FeatureGateResult {
  const hasCompletedOnboarding = useOnboardingStore(state => state.hasCompletedOnboarding());
  
  const requirement = FEATURE_REQUIREMENTS[feature];
  
  // Nếu tính năng không có trong danh sách, cho phép (backward compatibility)
  if (!requirement) {
    return { allowed: true };
  }
  
  // Nếu tính năng không yêu cầu onboarding, cho phép
  if (!requirement.requiresOnboarding) {
    return { allowed: true };
  }
  
  // Nếu yêu cầu onboarding và đã hoàn thành, cho phép
  if (requirement.requiresOnboarding && hasCompletedOnboarding) {
    return { allowed: true };
  }
  
  // Nếu yêu cầu onboarding nhưng chưa hoàn thành, chặn
  return {
    allowed: false,
    reason: 'Bạn cần hoàn thành hướng dẫn để sử dụng tính năng này.',
  };
}

/**
 * Kiểm tra tính năng có được phép không (không dùng hook)
 */
export function checkFeatureAccess(feature: string, hasCompletedOnboarding: boolean): FeatureGateResult {
  const requirement = FEATURE_REQUIREMENTS[feature];
  
  if (!requirement) {
    return { allowed: true };
  }
  
  if (!requirement.requiresOnboarding) {
    return { allowed: true };
  }
  
  if (requirement.requiresOnboarding && hasCompletedOnboarding) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: 'Bạn cần hoàn thành hướng dẫn để sử dụng tính năng này.',
  };
}
