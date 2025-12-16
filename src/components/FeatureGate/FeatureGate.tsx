/**
 * Feature Gate Component
 * Component wrapper để chặn tính năng
 */

import { ReactNode } from 'react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import FeatureLockedMessage from './FeatureLockedMessage';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export default function FeatureGate({
  feature,
  children,
  fallback,
  showMessage = true,
}: FeatureGateProps) {
  const { allowed, reason } = useFeatureGate(feature);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showMessage) {
    return <FeatureLockedMessage reason={reason} feature={feature} />;
  }

  return null;
}
