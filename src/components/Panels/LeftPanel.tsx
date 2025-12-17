/**
 * LeftPanel Component (Backward Compatibility)
 * Re-export PublicLeftPanel để giữ backward compatibility
 * Sử dụng PublicLeftPanel cho public usage, WorkspaceLeftPanel cho workspace context
 */

import PublicLeftPanel from './PublicLeftPanel';

interface LeftPanelProps {
  view: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | "workspaces" | "chains" | null;
  isOpen: boolean;
  onClose: () => void;
  onNewRequest: () => void;
}

export default function LeftPanel({ view, isOpen, onClose, onNewRequest }: LeftPanelProps) {
  return (
    <PublicLeftPanel
      view={view}
      isOpen={isOpen}
      onClose={onClose}
      onNewRequest={onNewRequest}
    />
  );
}
