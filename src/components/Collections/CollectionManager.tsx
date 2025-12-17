/**
 * CollectionManager Component (Backward Compatibility)
 * Re-export PublicCollectionManager để giữ backward compatibility
 * Sử dụng PublicCollectionManager cho public usage, WorkspaceCollectionManager cho workspace context
 */

import PublicCollectionManager from './PublicCollectionManager';

export default function CollectionManager() {
  return <PublicCollectionManager />;
}
