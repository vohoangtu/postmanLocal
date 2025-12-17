/**
 * ResponseViewer Component (Backward Compatibility)
 * Re-export PublicResponseViewer để giữ backward compatibility
 * Sử dụng PublicResponseViewer cho public usage, WorkspaceResponseViewer cho workspace context
 */

import PublicResponseViewer from './PublicResponseViewer';

interface ResponseViewerProps {
  response: any;
  responseTime?: number;
}

export default function ResponseViewer({ response, responseTime }: ResponseViewerProps) {
  return (
    <PublicResponseViewer
      response={response}
      responseTime={responseTime}
    />
  );
}
