/**
 * Public Test Editor Component
 * Wrapper component đơn giản cho public usage (MainApp)
 * Không có collaboration features
 */

import BaseTestEditor, { TestResult } from './BaseTestEditor';

export interface PublicTestEditorProps {
  response: any;
  onTestResults: (results: TestResult[]) => void;
}

export default function PublicTestEditor({ 
  response, 
  onTestResults 
}: PublicTestEditorProps) {
  return (
    <BaseTestEditor
      response={response}
      onTestResults={onTestResults}
      enableCollaboration={false}
    />
  );
}
