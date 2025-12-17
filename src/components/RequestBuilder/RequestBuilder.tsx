/**
 * RequestBuilder Component (Backward Compatibility)
 * Re-export PublicRequestBuilder để giữ backward compatibility
 * Sử dụng PublicRequestBuilder cho public usage, WorkspaceRequestBuilder cho workspace context
 */

import PublicRequestBuilder from './PublicRequestBuilder';

interface RequestBuilderProps {
  requestId: string | null;
  onResponse: (response: any) => void;
  tabId?: string;
  onSaveSuccess?: () => void;
}

export default function RequestBuilder({ onResponse, tabId, onSaveSuccess }: RequestBuilderProps) {
  return (
    <PublicRequestBuilder
      requestId={null}
      onResponse={onResponse}
      tabId={tabId}
      onSaveSuccess={onSaveSuccess}
    />
  );
}
