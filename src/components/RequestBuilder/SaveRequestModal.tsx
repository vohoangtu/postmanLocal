import { useState, useEffect } from 'react';
import { useCollectionStore } from '../../stores/collectionStore';
import Button from '../UI/Button';
import { X } from 'lucide-react';

interface SaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collectionId: string, folderId: string | null, name: string) => void;
  defaultName?: string;
}

export default function SaveRequestModal({
  isOpen,
  onClose,
  onSave,
  defaultName = '',
}: SaveRequestModalProps) {
  const { collections, defaultCollectionId } = useCollectionStore();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [requestName, setRequestName] = useState(defaultName);
  const [errors, setErrors] = useState<{ collection?: string; name?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setRequestName(defaultName);
      // Auto-select default collection nếu có
      if (defaultCollectionId) {
        setSelectedCollectionId(defaultCollectionId);
      } else {
        setSelectedCollectionId('');
      }
      setSelectedFolderId(null);
      setErrors({});
    }
  }, [isOpen, defaultName, defaultCollectionId]);

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  const handleSave = () => {
    const newErrors: { collection?: string; name?: string } = {};

    if (!selectedCollectionId) {
      newErrors.collection = 'Vui lòng chọn collection';
    }

    if (!requestName.trim()) {
      newErrors.name = 'Vui lòng nhập tên request';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(selectedCollectionId, selectedFolderId, requestName.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Lưu Request
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tên Request <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={requestName}
              onChange={(e) => {
                setRequestName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="Nhập tên request"
              className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.name
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Collection <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCollectionId}
              onChange={(e) => {
                setSelectedCollectionId(e.target.value);
                setSelectedFolderId(null);
                if (errors.collection) setErrors({ ...errors, collection: undefined });
              }}
              className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.collection
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">-- Chọn Collection --</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}{collection.is_default ? ' (Default)' : ''}
                </option>
              ))}
            </select>
            {errors.collection && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.collection}
              </p>
            )}
            {collections.length === 0 && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Chưa có collection nào. Vui lòng tạo collection trước.
              </p>
            )}
          </div>

          {selectedCollection && selectedCollection.requests.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folder (tùy chọn)
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">-- Không có folder --</option>
                {/* Load unique folderIds từ requests trong collection */}
                {Array.from(
                  new Set(
                    selectedCollection.requests
                      .map((r) => r.folderId)
                      .filter((id): id is string => !!id)
                  )
                ).map((folderId) => (
                  <option key={folderId} value={folderId}>
                    Folder {folderId}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Lưu ý: Folders sẽ được load từ collection data khi có folder management system
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={collections.length === 0 || !selectedCollectionId}
          >
            Lưu
          </Button>
        </div>
      </div>
    </div>
  );
}

