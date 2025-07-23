import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { DataAdapter, Card, CardPack, CardTemplate, Skill, SkillTemplate } from '../types';
import { ColyseusAdapter } from '../adapters/ColyseusAdapter';

// This mirrors the AdminRoomState structure for the frontend
interface ServerState {
  cards: Card[];
  cardPacks: CardPack[];
  cardTemplates: CardTemplate[];
  skills: Skill[];
  skillTemplates: SkillTemplate[];
}

interface DataContextType {
  dataAdapter: DataAdapter;
  isConnected: boolean;
  error: string | null;
  serverState: ServerState;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataContextProvider({ children }: ReactNode) {
  const [adapter, setAdapter] = useState<ColyseusAdapter | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverState, setServerState] = useState<ServerState>({
    cards: [],
    cardPacks: [],
    cardTemplates: [],
    skills: [],
    skillTemplates: [],
  });

  useEffect(() => {
    const colyseusAdapter = new ColyseusAdapter();
    
    colyseusAdapter.connect()
      .then(() => {
        setAdapter(colyseusAdapter);
        setIsConnected(true);
        setError(null);
        console.log("Successfully connected to Colyseus server.");

        // Subscribe to state changes
        colyseusAdapter.onStateChange((newState) => {
          setServerState(newState);
        });
      })
      .catch((err) => {
        console.error("Failed to connect to server:", err);
        setError("无法连接到服务器，请检查网络或服务器状态。");
        setIsConnected(false);
      });

    return () => {
      if (colyseusAdapter) {
        colyseusAdapter.disconnect();
        console.log("Disconnected from Colyseus server.");
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">连接失败</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || !adapter) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">正在连接到服务器...</p>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ dataAdapter: adapter, isConnected, error, serverState }}>
      {children}
    </DataContext.Provider>
  );
}

// Custom hook to use the data context, now returns the full context
export function useDataContext(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataContextProvider');
  }
  return context;
}

// Keep the old hook for compatibility where only the adapter is needed
export function useDataAdapter(): DataAdapter {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataAdapter must be used within a DataContextProvider');
  }
  return context.dataAdapter;
} 