/**
 * Public Request Builder Component
 * Wrapper component đơn giản cho public usage (MainApp)
 * Không có collaboration features
 */

import BaseRequestBuilder, { BaseRequestBuilderProps } from './BaseRequestBuilder';

export interface PublicRequestBuilderProps {
  requestId: string | null;
  onResponse: (response: any) => void;
  tabId?: string;
  onSaveSuccess?: () => void;
}

export default function PublicRequestBuilder({ 
  onResponse, 
  tabId, 
  onSaveSuccess 
}: PublicRequestBuilderProps) {
  return (
    <BaseRequestBuilder
      requestId={null}
      onResponse={onResponse}
      tabId={tabId}
      onSaveSuccess={onSaveSuccess}
      enableCollaboration={false}
    />
  );
}
