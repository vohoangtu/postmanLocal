/**
 * Feature Locked Message Component
 * Component hiển thị message khi tính năng bị khóa
 */

import { Lock, BookOpen } from 'lucide-react';
import Button from '../UI/Button';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useState } from 'react';
import OnboardingFlow from '../Onboarding/OnboardingFlow';

interface FeatureLockedMessageProps {
  reason?: string;
  feature?: string;
  onStartOnboarding?: () => void;
}

export default function FeatureLockedMessage({
  reason,
  feature,
  onStartOnboarding,
}: FeatureLockedMessageProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
    onStartOnboarding?.();
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
          <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Tính năng này đã bị khóa
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {reason || 'Bạn cần hoàn thành hướng dẫn để sử dụng tính năng này.'}
        </p>
        <Button
          variant="primary"
          onClick={handleStartOnboarding}
          className="flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Hoàn thành hướng dẫn
        </Button>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Hướng dẫn sẽ chỉ mất vài phút và giúp bạn hiểu rõ hơn về các tính năng.
        </p>
      </div>

      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
}
