/**
 * Public Collection Manager Component
 * Wrapper component đơn giản cho public usage (LeftPanel)
 * Không có collaboration features
 */

import BaseCollectionManager from './BaseCollectionManager';

export default function PublicCollectionManager() {
  return (
    <BaseCollectionManager
      enableCollaboration={false}
      showWorkspaceSelector={true}
    />
  );
}
