import { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingStateProviderProps {
  children: ReactNode;
}

export function LoadingStateProvider({ children }: LoadingStateProviderProps) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = (key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  return (
    <LoadingContext.Provider value={{ loadingStates, setLoading, isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoadingState() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingState must be used within a LoadingStateProvider');
  }
  return context;
}