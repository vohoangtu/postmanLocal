/**
 * Navigation utility
 * Hỗ trợ navigation trong app (không sử dụng routing system)
 */

import { usePanelStore } from '../stores/panelStore';
import { useTabStore } from '../stores/tabStore';
import { useCollectionStore } from '../stores/collectionStore';

/**
 * Navigate đến entity dựa trên type và id
 * @param entityType - Loại entity (collection, request, workspace, etc.)
 * @param entityId - ID của entity
 */
export function navigateToEntity(entityType: string, entityId: string) {
  const { setLeftPanelView } = usePanelStore.getState();
  const { addTab, setActiveTab } = useTabStore.getState();
  const { collections, setSelectedCollection } = useCollectionStore.getState();

  switch (entityType.toLowerCase()) {
    case 'collection':
      // Mở Collections panel và select collection
      setLeftPanelView('collections');
      const collection = collections.find((c) => c.id === entityId);
      if (collection) {
        setSelectedCollection(collection.id);
      }
      break;

    case 'request':
      // Tìm request trong collections và mở trong tab mới
      for (const collection of collections) {
        const request = collection.requests?.find((r) => r.id === entityId);
        if (request) {
          const tabId = addTab({
            name: request.name || 'Request',
            method: request.method || 'GET',
            url: request.url || '',
            requestData: {
              headers: request.headers || [],
              body: request.body,
              queryParams: request.queryParams || [],
            },
          });
          setActiveTab(tabId);
          setLeftPanelView('collections');
          break;
        }
      }
      break;

    case 'workspace':
      // Mở Workspaces panel
      setLeftPanelView('workspaces');
      // TODO: Select workspace nếu có workspace store
      break;

    default:
      console.warn(`Unknown entity type: ${entityType}`);
      // Mở Collections panel như default
      setLeftPanelView('collections');
  }
}

/**
 * Hook để sử dụng navigation trong components
 */
export function useNavigation() {
  return {
    navigateToEntity,
  };
}
