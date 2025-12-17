/**
 * Onboarding Flow Component
 * Component chính cho onboarding flow
 */

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ONBOARDING_STEPS, getStepIndex, getNextStep, getPreviousStep } from '../../config/onboardingSteps';
import StepWelcome from './StepWelcome';
import StepCreateRequest from './StepCreateRequest';
import StepSendRequest from './StepSendRequest';
import StepExploreFeatures from './StepExploreFeatures';
import StepComplete from './StepComplete';
import OnboardingOverlay from './OnboardingOverlay';

interface OnboardingFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const STEP_COMPONENTS: Record<string, React.ComponentType> = {
  welcome: StepWelcome,
  create_request: StepCreateRequest,
  send_request: StepSendRequest,
  explore_features: StepExploreFeatures,
  complete: StepComplete,
};

export default function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const { onboarding, loadOnboardingStatus, completeStep, completeOnboarding } = useOnboardingStore();
  const [currentStepId, setCurrentStepId] = useState<string>('welcome');
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  useEffect(() => {
    if (onboarding) {
      if (onboarding.completed) {
        setIsOpen(false);
        onComplete?.();
      } else {
        setIsOpen(true);
        setCurrentStepId(onboarding.current_step || 'welcome');
      }
    }
  }, [onboarding, onComplete]);

  const currentStep = ONBOARDING_STEPS.find(step => step.id === currentStepId);
  const currentIndex = getStepIndex(currentStepId);
  const totalSteps = ONBOARDING_STEPS.length;
  const progress = ((currentIndex + 1) / totalSteps) * 100;

  const handleNext = async () => {
    if (currentStepId === 'complete') {
      // Hoàn thành onboarding
      setIsCompleting(true);
      try {
        await completeOnboarding();
        setIsOpen(false);
        onComplete?.();
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Hiển thị error message cho user
        alert('Không thể hoàn thành onboarding. Vui lòng thử lại.');
      } finally {
        setIsCompleting(false);
      }
    } else {
      // Chuyển sang bước tiếp theo
      const nextStep = getNextStep(currentStepId);
      if (nextStep) {
        setIsCompleting(true);
        try {
          // Complete step hiện tại
          await completeStep(currentStepId);
          // Reload onboarding status để đảm bảo state được cập nhật
          await loadOnboardingStatus();
          // Chuyển sang step tiếp theo
          setCurrentStepId(nextStep.id);
        } catch (error) {
          console.error('Error completing step:', error);
          // Hiển thị error message cho user
          alert('Không thể chuyển sang bước tiếp theo. Vui lòng thử lại.');
        } finally {
          setIsCompleting(false);
        }
      }
    }
  };

  const handlePrevious = () => {
    const prevStep = getPreviousStep(currentStepId);
    if (prevStep) {
      setCurrentStepId(prevStep.id);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    onSkip?.();
  };

  if (!isOpen || !currentStep) {
    return null;
  }

  const StepComponent = STEP_COMPONENTS[currentStepId] || StepWelcome;
  const canGoNext = currentIndex < totalSteps - 1;
  const canGoPrevious = currentIndex > 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleSkip}
        size="lg"
        closeOnOverlayClick={false}
        showCloseButton={true}
      >
        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bước {currentIndex + 1} / {totalSteps}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="min-h-[300px] flex items-center justify-center">
            <StepComponent />
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <div>
              {canGoPrevious && (
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isCompleting}
              >
                Bỏ qua
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                loading={isCompleting}
                className="flex items-center gap-2"
              >
                {currentStepId === 'complete' ? 'Hoàn thành' : 'Tiếp theo'}
                {currentStepId !== 'complete' && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Overlay với spotlight effect */}
      {currentStep.target && (
        <OnboardingOverlay target={currentStep.target} />
      )}
    </>
  );
}
