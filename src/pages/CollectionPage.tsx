import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useDataAdapter } from '../context/DataContext';
import { UserCard, CardRarity } from '../types';

const CollectionPage: React.FC = () => {
  const { user } = useUser();
  const dataAdapter = useDataAdapter();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<UserCard[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserCards();
    }
  }, [user]);

  useEffect(() => {
    filterCards();
  }, [userCards, selectedRarity]);

  const loadUserCards = async () => {
    if (!user) return;
    
    try {
      const cards = await dataAdapter.getUserCards(user.id);
      setUserCards(cards);
    } catch (error) {
      console.error('Failed to load user cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCards = () => {
    if (selectedRarity === 'ALL') {
      setFilteredCards(userCards);
    } else {
      setFilteredCards(userCards.filter(uc => uc.card?.rarity === selectedRarity));
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
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">我的收藏</h1>
        <p className="text-gray-400 text-sm md:text-base">
          共收集 {userCards.length} 张卡牌
        </p>
      </div>

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
            {selectedRarity === 'ALL' ? '还没有收集任何卡牌' : `还没有收集 ${selectedRarity} 稀有度的卡牌`}
          </p>
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
                    src={card?.coverImageUrl || card?.imageUrl || '/cards/default.jpg'}
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
    </div>
  );
};

export default CollectionPage; 