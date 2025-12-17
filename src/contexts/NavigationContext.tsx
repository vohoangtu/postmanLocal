/**
 * Navigation Context
 * Context để share navigation state giữa GlobalNavBar và MainApp
 */

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type NavigationView = 
  | "collections" 
  | "history" 
  | "templates" 
  | "environments" 
  | "schema" 
  | "mock" 
  | "docs" 
  | "workspaces" 
  | "chains" 
  | null;

interface NavigationContextType {
  activeView: NavigationView;
  setActiveView: (view: NavigationView) => void;
  handleViewChange: (view: NavigationView) => void;
  handleNewRequest: () => void;
  registerCallbacks: (callbacks: { onNewRequest?: () => void; onViewChange?: (view: NavigationView) => void }) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  onNewRequest?: () => void;
  onViewChange?: (view: NavigationView) => void;
}

export function NavigationProvider({ 
  children, 
  onNewRequest: defaultOnNewRequest,
  onViewChange: defaultOnViewChange 
}: NavigationProviderProps) {
  const [activeView, setActiveView] = useState<NavigationView>(null);
  const [callbacks, setCallbacks] = useState<{ onNewRequest?: () => void; onViewChange?: (view: NavigationView) => void }>({});

  const registerCallbacks = useCallback((newCallbacks: { onNewRequest?: () => void; onViewChange?: (view: NavigationView) => void }) => {
    setCallbacks(newCallbacks);
  }, []);

  const handleViewChange = useCallback((view: NavigationView) => {
    setActiveView(view);
    // Ưu tiên callbacks đã register, sau đó mới đến default
    if (callbacks.onViewChange) {
      callbacks.onViewChange(view);
    } else if (defaultOnViewChange) {
      defaultOnViewChange(view);
    }
  }, [callbacks, defaultOnViewChange]);

  const handleNewRequest = useCallback(() => {
    // Ưu tiên callbacks đã register, sau đó mới đến default
    if (callbacks.onNewRequest) {
      callbacks.onNewRequest();
    } else if (defaultOnNewRequest) {
      defaultOnNewRequest();
    }
  }, [callbacks, defaultOnNewRequest]);

  return (
    <NavigationContext.Provider
      value={{
        activeView,
        setActiveView,
        handleViewChange,
        handleNewRequest,
        registerCallbacks,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
