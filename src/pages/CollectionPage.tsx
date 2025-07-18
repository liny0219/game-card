import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useDataAdapter } from '../context/DataContext';
import { useGameplay } from '../context/GameplayContext';
import { UserCard, CardRarity } from '../types';

const CollectionPage: React.FC = () => {
  const { user } = useUser();
  const dataAdapter = useDataAdapter();
  const { currentGameplayType, getGameplayDisplayName } = useGameplay();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<UserCard[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && currentGameplayType) {
      loadUserCards();
    }
  }, [user, currentGameplayType]);

  useEffect(() => {
    filterCards();
  }, [userCards, selectedRarity]);

  const loadUserCards = async () => {
    if (!user || !currentGameplayType) return;
    
    try {
      const allUserCards = await dataAdapter.getUserCards(user.id);
      // 只加载当前玩法的卡片
      const currentGameplayCards = allUserCards.filter(uc => uc.card?.gameplayType === currentGameplayType);
      setUserCards(currentGameplayCards);
    } catch (error) {
      console.error('Failed to load user cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCards = () => {
    let filtered = [...userCards];
    
    // 按稀有度过滤
    if (selectedRarity !== 'ALL') {
      filtered = filtered.filter(uc => uc.card?.rarity === selectedRarity);
    }
    
    setFilteredCards(filtered);
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
          {currentGameplayType ? `我的收藏 - ${getGameplayDisplayName(currentGameplayType)}` : '我的收藏'}
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          {currentGameplayType ? `${getGameplayDisplayName(currentGameplayType)}玩法 - 共收集 ${userCards.length} 张卡牌` : '查看您收集的卡牌'}
        </p>
      </div>

      {/* 检查是否选择了玩法 */}
      {!currentGameplayType ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg">请从首页选择游戏玩法</div>
          <p className="text-gray-500 text-sm mt-2">每种玩法都有独立的卡牌收藏</p>
        </div>
      ) : (
        <>
          {/* Filter */}
      <div className="flex flex-wrap justify-center gap-2 px-4">
        <button
          onClick={() => setSelectedRarity('ALL')}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            selectedRarity === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          全部 ({userCards.length})
        </button>
        
        {Object.values(CardRarity).map((rarity) => {
          const count = userCards.filter(uc => uc.card?.rarity === rarity).length;
          return (
            <button
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedRarity === rarity
                  ? `rarity-${rarity} text-white`
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {rarity} ({count})
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <div className="text-3xl md:text-4xl mb-3 md:mb-4">📭</div>
          <p className="text-gray-400 text-sm md:text-base">
            {selectedRarity === 'ALL' 
              ? '还没有收集任何卡牌' 
              : `没有找到符合条件的卡牌`}
          </p>
          {(selectedRarity !== 'ALL') && (
            <p className="text-gray-500 text-xs mt-2">
              尝试调整过滤条件或去抽卡获得新卡牌
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
          {filteredCards.map((userCard) => {
            const card = userCard.card;
            return (
              <div key={userCard.id} className="relative group bg-gray-800 rounded-xl shadow flex flex-col items-center p-2 md:p-3 overflow-hidden">
                {/* 封面图片为主视觉 */}
                <div className="w-full aspect-[3/4] bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                  <img
                    src={card?.imageUrl || '/cards/default.jpg'}
                    alt={card?.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.src = '/cards/default.jpg'; }}
                  />
                  {/* 稀有度角标 */}
                  <span className={`absolute top-2 left-2 px-2 py-1 text-xs rounded rarity-${card?.rarity}`}>{card?.rarity}</span>
                </div>
                {/* 名称、稀有度、描述一行展示 */}
                <div className="w-full flex items-center justify-center mt-1 gap-1">
                  <span className={`rarity-${card?.rarity} text-xs px-2 py-1 rounded shrink-0`}>{card?.rarity}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-semibold text-white truncate text-left">{card?.name}</div>
                    <div className="text-[10px] md:text-xs text-gray-400 truncate text-left">{card?.description}</div>
                  </div>
                </div>
                {/* 数量角标 */}
                <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full shadow">x{userCard.quantity}</span>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default CollectionPage; 