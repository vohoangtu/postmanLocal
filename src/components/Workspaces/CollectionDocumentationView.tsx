/**
 * Collection Documentation View
 * Wrapper cho CollectionDocumentation trong workspace context
 */

import { useParams } from 'react-router-dom';
import WorkspaceCollectionDocumentation from '../Collections/WorkspaceCollectionDocumentation';

export default function CollectionDocumentationView() {
  const { collectionId } = useParams<{ collectionId: string }>();

  if (!collectionId) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Collection ID not found
        </div>
      </div>
    );
  }

  return <WorkspaceCollectionDocumentation collectionId={collectionId} />;
}
