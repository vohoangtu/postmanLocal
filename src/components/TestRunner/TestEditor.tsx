/**
 * TestEditor Component (Backward Compatibility)
 * Re-export PublicTestEditor để giữ backward compatibility
 * Sử dụng PublicTestEditor cho public usage, WorkspaceTestEditor cho workspace context
 */

import PublicTestEditor, { PublicTestEditorProps } from './PublicTestEditor';

interface TestEditorProps {
  response: any;
  onTestResults: (results: any[]) => void;
}

export default function TestEditor({ response, onTestResults }: TestEditorProps) {
  return (
    <PublicTestEditor
      response={response}
      onTestResults={onTestResults}
    />
  );
}
