import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useDataAdapter } from '../context/DataContext';
import { useGameplay } from '../context/GameplayContext';
import { GachaHistory } from '../types';

const HistoryPage: React.FC = () => {
  const { user } = useUser();
  const dataAdapter = useDataAdapter();
  const { currentGameplayType, getGameplayDisplayName } = useGameplay();
  const [history, setHistory] = useState<GachaHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && currentGameplayType) {
      loadHistory();
    }
  }, [user, currentGameplayType]);

  const loadHistory = async () => {
    if (!user || !currentGameplayType) return;
    
    setLoading(true);
    try {
      // 获取所有历史记录
      const allHistory = await dataAdapter.getGachaHistory(user.id);
      
      // 根据当前玩法过滤历史记录
      const packs = await dataAdapter.getCardPacks();
      const filteredRecords = allHistory.filter(h => {
        const pack = packs.find(p => p.id === h.packId);
        return pack?.gameplayType === currentGameplayType;
      });
      
      setHistory(filteredRecords);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {currentGameplayType ? `抽卡历史 - ${getGameplayDisplayName(currentGameplayType)}` : '抽卡历史'}
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          {currentGameplayType ? `共 ${history.length} 条抽卡记录` : '查看您的抽卡历史记录'}
        </p>
      </div>

      {/* 检查是否选择了玩法 */}
      {!currentGameplayType ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg">请从首页选择游戏玩法</div>
          <p className="text-gray-500 text-sm mt-2">每种玩法都有独立的抽卡历史</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <div className="text-3xl md:text-4xl mb-3 md:mb-4">📋</div>
          <p className="text-gray-400 text-sm md:text-base">
            还没有抽卡记录
          </p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {history.map((record) => (
            <div key={record.id} className="card p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1 md:mb-2">
                    <h3 className="text-sm md:text-lg font-semibold text-white">
                      {record.quantity === 1 ? '单抽' : '十连抽'}
                    </h3>
                    {record.result.pityTriggered && (
                      <span className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs">
                        保底触发
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-gray-400">
                    {new Date(record.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="text-right mt-3 md:mt-0">
                  <div className="text-sm md:text-lg font-bold text-white mb-1">
                    -{record.result.currencySpent} {record.result.currencyType === 'GOLD' ? '💰' : record.result.currencyType === 'TICKET' ? '🎫' : '💎'}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">
                    获得 {record.result.cards.length} 张卡牌
                  </div>
                </div>
              </div>

              {/* Cards Result */}
              <div className="space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                  <div className="bg-gray-700 rounded-lg p-2 md:p-3">
                    <div className="text-gray-400">新卡牌</div>
                    <div className="text-green-400 font-bold">
                      {record.result.newCards.length} 张
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-2 md:p-3">
                    <div className="text-gray-400">重复卡牌</div>
                    <div className="text-blue-400 font-bold">
                      {record.result.duplicates.length} 张
                    </div>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1 md:gap-2">
                  {record.result.cards.map((card, index) => (
                    <div key={`${card.id}-${index}`} className="bg-gray-700 rounded-lg p-1 md:p-2">
                      {/* 卡片封面图片 */}
                      <div className="w-full aspect-[3/4] bg-gray-600 rounded overflow-hidden mb-1">
                        <img
                          src={card.imageUrl || '/assets/default-card.png'}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/assets/default-card.png'; }}
                        />
                      </div>
                      
                      <div className={`rarity-${card.rarity} text-xs px-1 py-0.5 rounded mb-1 text-center`}>
                        {card.rarity}
                      </div>
                      <div className="text-xs font-medium text-white text-center truncate">
                        {card.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage; 