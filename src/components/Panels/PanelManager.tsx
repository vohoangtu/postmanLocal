/**
 * PanelManager - Quản lý tất cả panels trong ứng dụng
 * Cung cấp panel registry, z-index management, và close all functionality
 */

import { useEffect } from 'react';
import { usePanelStore } from '../../stores/panelStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface PanelManagerProps {
  children: React.ReactNode;
}

/**
 * PanelManager component
 * Quản lý panel stacking order, z-index, và close all panels
 */
export default function PanelManager({ children }: PanelManagerProps) {
  const { closeAllPanels, isCommandPaletteOpen, isLeftPanelOpen } = usePanelStore();

  // Keyboard shortcut: Escape để đóng tất cả panels
  useKeyboardShortcuts([
    {
      key: 'Escape',
      handler: () => {
        // Chỉ đóng tất cả nếu không có panel nào đang mở hoặc chỉ có một panel
        if (isCommandPaletteOpen || isLeftPanelOpen) {
          closeAllPanels();
        }
      },
      description: 'Close all panels',
    },
  ]);

  // Quản lý body scroll khi có panel mở
  useEffect(() => {
    if (isLeftPanelOpen || isCommandPaletteOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLeftPanelOpen, isCommandPaletteOpen]);

  return <>{children}</>;
}
