import React from 'react';
import { useUser } from '../context/UserContext';
import { CardRarity } from '../types';

const HomePage: React.FC = () => {
  const { user, loading } = useUser();

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

  // 统计数据
  const totalCards = user ? Object.values(user.statistics.cardsByRarity).reduce((a, b) => a + b, 0) : 0;

  // 稀有度分布数据
  const rarityList = Object.values(CardRarity);
  const rarityCollection: Record<CardRarity, number> = user ? user.statistics.cardsByRarity : {} as Record<CardRarity, number>;

  return (
    <div className="space-y-8">
      {/* 卡牌收藏区块 */}
      <div className="bg-gray-800 rounded-xl shadow p-4 md:p-6 mx-2 md:mx-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base md:text-lg font-bold text-white">
            拥有卡牌 {totalCards} 张
          </div>
        </div>
        
        {/* 稀有度分布 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
          {rarityList.map((rarity) => (
            <div key={rarity} className="text-center">
              <div className={`rarity-${rarity} rounded-lg p-2 md:p-3 mb-1 md:mb-2`}>
                <div className="text-xs md:text-lg font-bold">{rarity}</div>
              </div>
              <div className="text-xs md:text-sm text-gray-400">
                {(rarityCollection[rarity] || 0) + ' 张'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage; 