import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameplayType } from '../types';
import { useUser } from './UserContext';

interface GameplayContextType {
  currentGameplayType: GameplayType | null;
  switchGameplayType: (gameplayType: GameplayType) => void;
  getGameplayDisplayName: (gameplayType: GameplayType) => string;
  getAllGameplayTypes: () => { type: GameplayType; name: string; description: string; icon: string }[];
}

const GameplayContext = createContext<GameplayContextType | undefined>(undefined);
const STORAGE_KEY = 'gacha_gameplay_type';

interface GameplayContextProviderProps {
  children: ReactNode;
}

export function GameplayContextProvider({ children }: GameplayContextProviderProps) {
  const { user } = useUser();
  const [currentGameplayType, setCurrentGameplayType] = useState<GameplayType | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const switchGameplayType = useCallback((type: GameplayType) => {
    setCurrentGameplayType(type);
    localStorage.setItem(STORAGE_KEY, type);
    navigate(`/${type}`);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const match = location.pathname.match(/^\/([A-Z_]+)/);
      if (match && match[1]) {
        const gameplayTypeFromUrl = match[1] as GameplayType;
        if (Object.values(GameplayType).includes(gameplayTypeFromUrl)) {
          if (gameplayTypeFromUrl !== currentGameplayType) {
            setCurrentGameplayType(gameplayTypeFromUrl);
            localStorage.setItem(STORAGE_KEY, gameplayTypeFromUrl);
          }
          return;
        }
      }

      const savedGameplayType = localStorage.getItem(STORAGE_KEY) as GameplayType | null;
      if (savedGameplayType && Object.values(GameplayType).includes(savedGameplayType)) {
        setCurrentGameplayType(savedGameplayType);
      } else {
        setCurrentGameplayType(null);
        if (location.pathname !== '/') {
            navigate('/');
        }
      }
    }
  }, [location.pathname, user, currentGameplayType, navigate]);

  const getGameplayDisplayName = (gameplayType: GameplayType): string => {
    const config = GAMEPLAY_CONFIG[gameplayType as keyof typeof GAMEPLAY_CONFIG];
    return config?.name || gameplayType;
  };

  const getAllGameplayTypes = () => {
    return Object.entries(GAMEPLAY_CONFIG).map(([type, config]) => ({
      type: type as GameplayType,
      name: config.name,
      description: config.description,
      icon: config.icon
    }));
  };

  const value: GameplayContextType = {
    currentGameplayType,
    switchGameplayType,
    getGameplayDisplayName,
    getAllGameplayTypes
  };

  return (
    <GameplayContext.Provider value={value}>
      {children}
    </GameplayContext.Provider>
  );
}

export const useGameplay = (): GameplayContextType => {
  const context = useContext(GameplayContext);
  if (context === undefined) {
    throw new Error('useGameplay must be used within a GameplayContextProvider');
  }
  return context;
};

// 玩法类型配置
export const GAMEPLAY_CONFIG = {
  [GameplayType.DEFAULT]: {
    name: '默认玩法',
    description: '经典的卡牌收集体验，适合新手入门',
    icon: '🎮',
  },
  [GameplayType.BATTLE]: {
    name: '战斗玩法',
    description: '进行卡牌对战，考验策略和技巧',
    icon: '⚔️',
  },
  [GameplayType.COLLECTION]: {
    name: '收集玩法',
    description: '专注于收集和展示所有卡牌',
    icon: '📚',
  },
  [GameplayType.STRATEGY]: {
    name: '策略玩法',
    description: '构建复杂的卡组，应对不同的挑战',
    icon: '🧠',
  },
  [GameplayType.ADVENTURE]: {
    name: '冒险玩法',
    description: '探索未知世界，体验剧情和冒险',
    icon: '🗺️',
  },
  [GameplayType.PUZZLE]: {
    name: '解谜玩法',
    description: '利用卡牌解决各种谜题和难题',
    icon: '🧩',
  }
}; 