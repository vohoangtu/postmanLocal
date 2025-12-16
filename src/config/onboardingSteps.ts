/**
 * Onboarding Steps Configuration
 * Định nghĩa cấu hình các bước onboarding
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector cho element cần highlight
  action?: () => void; // Callback khi bước được hoàn thành
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Chào mừng đến với PostmanLocal',
    description: 'PostmanLocal là công cụ mạnh mẽ để test và quản lý API requests. Hãy cùng khám phá các tính năng chính!',
  },
  {
    id: 'create_request',
    title: 'Tạo Request đầu tiên',
    description: 'Bắt đầu bằng cách tạo một API request đơn giản. Click vào nút "New Request" để bắt đầu.',
    target: '[data-onboarding="new-request-button"]',
  },
  {
    id: 'send_request',
    title: 'Gửi Request và xem Response',
    description: 'Nhập URL, chọn method (GET, POST, etc.) và click "Send" để gửi request. Response sẽ hiển thị ở bên phải.',
    target: '[data-onboarding="send-button"]',
  },
  {
    id: 'explore_features',
    title: 'Khám phá các tính năng',
    description: 'Sau khi hoàn thành hướng dẫn, bạn sẽ có thể sử dụng các tính năng nâng cao như Collections, Environments, Sync và nhiều hơn nữa!',
  },
  {
    id: 'complete',
    title: 'Hoàn thành!',
    description: 'Bạn đã hoàn thành hướng dẫn. Bây giờ bạn có thể sử dụng tất cả các tính năng của PostmanLocal!',
  },
];

export const getStepById = (id: string): OnboardingStep | undefined => {
  return ONBOARDING_STEPS.find(step => step.id === id);
};

export const getStepIndex = (id: string): number => {
  return ONBOARDING_STEPS.findIndex(step => step.id === id);
};

export const getNextStep = (currentId: string): OnboardingStep | null => {
  const currentIndex = getStepIndex(currentId);
  if (currentIndex === -1 || currentIndex === ONBOARDING_STEPS.length - 1) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex + 1];
};

export const getPreviousStep = (currentId: string): OnboardingStep | null => {
  const currentIndex = getStepIndex(currentId);
  if (currentIndex <= 0) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex - 1];
};
