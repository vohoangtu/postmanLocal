/**
 * Public Response Viewer Component
 * Wrapper component đơn giản cho public usage (MainApp)
 * Không có collaboration features
 */

import BaseResponseViewer from './BaseResponseViewer';

export interface PublicResponseViewerProps {
  response: any;
  responseTime?: number;
}

export default function PublicResponseViewer({ 
  response, 
  responseTime 
}: PublicResponseViewerProps) {
  return (
    <BaseResponseViewer
      response={response}
      responseTime={responseTime}
      enableCollaboration={false}
    />
  );
}
