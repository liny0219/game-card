import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useDataAdapter } from '../context/DataContext';
import { GachaHistory, GameplayType } from '../types';

const HistoryPage: React.FC = () => {
  const { user } = useUser();
  const dataAdapter = useDataAdapter();
  const [history, setHistory] = useState<GachaHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<GachaHistory[]>([]);
  const [selectedGameplayType, setSelectedGameplayType] = useState<GameplayType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    filterHistory();
  }, [history, selectedGameplayType]);

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      const historyData = await dataAdapter.getGachaHistory(user.id);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = async () => {
    if (selectedGameplayType === 'ALL') {
      setFilteredHistory(history);
    } else {
      // 根据抽卡历史中的卡包ID获取卡包信息进行过滤
      const dataAdapter = useDataAdapter();
      const packs = await dataAdapter.getCardPacks();
      const filteredRecords = history.filter(h => {
        const pack = packs.find(p => p.id === h.packId);
        return pack?.gameplayType === selectedGameplayType;
      });
      setFilteredHistory(filteredRecords);
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
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">抽卡历史</h1>
        <p className="text-gray-400 text-sm md:text-base">
          共 {history.length} 条抽卡记录
        </p>
      </div>

      {/* 玩法类型过滤器 */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-300">玩法类型：</label>
          <select
            value={selectedGameplayType}
            onChange={(e) => setSelectedGameplayType(e.target.value as GameplayType | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            style={{ color: '#1f2937' }}
          >
            <option value="ALL">全部</option>
            {Object.values(GameplayType).map(type => (
              <option key={type} value={type}>
                {type === GameplayType.DEFAULT ? '默认玩法' :
                 type === GameplayType.BATTLE ? '战斗玩法' :
                 type === GameplayType.COLLECTION ? '收集玩法' :
                 type === GameplayType.STRATEGY ? '策略玩法' :
                 type === GameplayType.ADVENTURE ? '冒险玩法' :
                 type === GameplayType.PUZZLE ? '解谜玩法' : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <div className="text-3xl md:text-4xl mb-3 md:mb-4">📋</div>
          <p className="text-gray-400 text-sm md:text-base">
            {history.length === 0 ? '还没有抽卡记录' : '没有找到符合条件的抽卡记录'}
          </p>
          {history.length > 0 && (
            <p className="text-gray-500 text-xs mt-2">
              尝试调整过滤条件查看其他记录
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {filteredHistory.map((record) => (
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