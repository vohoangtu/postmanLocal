/**
 * Public Collection Documentation Component
 * Wrapper component đơn giản cho public usage
 * Không có collaboration features
 */

import BaseCollectionDocumentation from './BaseCollectionDocumentation';

export interface PublicCollectionDocumentationProps {
  collectionId: string;
}

export default function PublicCollectionDocumentation({ 
  collectionId 
}: PublicCollectionDocumentationProps) {
  return (
    <BaseCollectionDocumentation
      collectionId={collectionId}
      enableCollaboration={false}
      enableEditing={false}
    />
  );
}
