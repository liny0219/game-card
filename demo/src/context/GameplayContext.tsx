import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GameplayType } from '../types';

interface GameplayContextType {
  currentGameplayType: GameplayType | null;
  setCurrentGameplayType: (gameplayType: GameplayType) => void;
  switchGameplayType: (gameplayType: GameplayType, page?: string) => void;
  getGameplayDisplayName: (gameplayType: GameplayType) => string;
  getAllGameplayTypes: () => { type: GameplayType; name: string; description: string; icon: string }[];
}

const GameplayContext = createContext<GameplayContextType | undefined>(undefined);

// 玩法类型配置
export const GAMEPLAY_CONFIG = {
  [GameplayType.DEFAULT]: {
    name: '默认玩法',
    description: '经典的卡牌收集体验，适合新手入门',
    icon: '🎮',
    color: 'blue'
  },
  [GameplayType.ADVENTURE]: {
    name: '冒险玩法',
    description: '探索未知世界，体验剧情和冒险',
    icon: '🗺️',
    color: 'yellow'
  }
};

// 从路径中提取玩法类型的工具函数
const extractGameplayTypeFromPath = (pathname: string): GameplayType | null => {
  const segments = pathname.split('/').filter(Boolean);
  const supportedTypes = Object.keys(GAMEPLAY_CONFIG) as GameplayType[];
  
  // 检查每个路径段，找到第一个匹配的玩法类型
  for (const segment of segments) {
    if (supportedTypes.includes(segment as GameplayType)) {
      return segment as GameplayType;
    }
  }
  
  return null;
};

export const GameplayContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentGameplayType, setCurrentGameplayTypeState] = useState<GameplayType | null>(null);

  useEffect(() => {
    const gameplayTypeFromPath = extractGameplayTypeFromPath(location.pathname);
    
    if (gameplayTypeFromPath) {
      setCurrentGameplayTypeState(gameplayTypeFromPath);
    } else {
      setCurrentGameplayTypeState(null);
    }
  }, [location.pathname]);

  const setCurrentGameplayType = (gameplayType: GameplayType) => {
    setCurrentGameplayTypeState(gameplayType);
  };

  const switchGameplayType = (gameplayType: GameplayType, page: string = 'gacha') => {
    if (page === 'admin') {
      navigate(`/admin/${gameplayType}`);
    } else {
      navigate(`/${gameplayType}/${page}`);
    }
  };

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
    setCurrentGameplayType,
    switchGameplayType,
    getGameplayDisplayName,
    getAllGameplayTypes
  };

  return (
    <GameplayContext.Provider value={value}>
      {children}
    </GameplayContext.Provider>
  );
};

export const useGameplay = (): GameplayContextType => {
  const context = useContext(GameplayContext);
  if (context === undefined) {
    throw new Error('useGameplay must be used within a GameplayContextProvider');
  }
  return context;
}; 