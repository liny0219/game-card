import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { useDataAdapter } from '../context/DataContext';
import { CardPack, GachaResult, GachaAnimationState, GameplayType, CardRarity } from '../types';
import GlobalModal from '../components/GlobalModal';

const GachaPage: React.FC = () => {
  const { user, refreshUser } = useUser();
  const dataAdapter = useDataAdapter();
  const [cardPacks, setCardPacks] = useState<CardPack[]>([]);
  const [filteredPacks, setFilteredPacks] = useState<CardPack[]>([]);
  const [selectedGameplayType, setSelectedGameplayType] = useState<GameplayType | 'ALL'>('ALL');
  const [selectedPack, setSelectedPack] = useState<CardPack | null>(null);
  const [gachaResult, setGachaResult] = useState<GachaResult | null>(null);
  const [animationState, setAnimationState] = useState<GachaAnimationState>(GachaAnimationState.IDLE);
  const [loading, setLoading] = useState(true);
  const [packDetail, setPackDetail] = useState<CardPack | null>(null);
  const [packDetailCards, setPackDetailCards] = useState<any[]>([]);
  const [packDetailLoading, setPackDetailLoading] = useState(false);
  const [showPackCards, setShowPackCards] = useState(false);

  useEffect(() => {
    loadCardPacks();
  }, []);

  useEffect(() => {
    filterPacks();
  }, [cardPacks, selectedGameplayType]);

  const loadCardPacks = async () => {
    try {
      const packs = await dataAdapter.getCardPacks();
      setCardPacks(packs);
    } catch (error) {
      toast.error('加载卡包失败');
    } finally {
      setLoading(false);
    }
  };

  const filterPacks = () => {
    let filtered: CardPack[];
    if (selectedGameplayType === 'ALL') {
      filtered = cardPacks;
    } else {
      filtered = cardPacks.filter(pack => pack.gameplayType === selectedGameplayType);
    }
    setFilteredPacks(filtered);
    
    // 更新选中的卡包
    if (filtered.length > 0) {
      if (!selectedPack || !filtered.find(pack => pack.id === selectedPack.id)) {
        setSelectedPack(filtered[0]);
      }
    } else {
      setSelectedPack(null);
    }
  };

  const handleGacha = async (quantity: 1 | 10) => {
    if (!user || !selectedPack) return;

    const totalCost = selectedPack.cost * quantity;
    if (user.currencies[selectedPack.currency] < totalCost) {
      toast.error('货币不足');
      return;
    }

    try {
      setAnimationState(GachaAnimationState.SPINNING);
      
      // 模拟抽卡动画延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await dataAdapter.performGacha({
        userId: user.id,
        packId: selectedPack.id,
        quantity
      });

      setGachaResult(result);
      setAnimationState(GachaAnimationState.REVEALING);
      
      // 刷新用户数据
      await refreshUser();
      
      // 显示结果提示
      if (result.pityTriggered) {
        toast.success('🎉 保底触发！获得稀有卡牌！');
      }
      
      if (result.newCards.length > 0) {
        toast.success(`✨ 获得 ${result.newCards.length} 张新卡牌！`);
      }
      
    } catch (error) {
      toast.error('抽卡失败');
      setAnimationState(GachaAnimationState.IDLE);
    }
  };

  const closeResult = () => {
    setGachaResult(null);
    setAnimationState(GachaAnimationState.IDLE);
  };

  // 打开卡包详情弹窗
  const openPackDetail = async (pack: CardPack) => {
    setPackDetail(pack);
    setPackDetailLoading(true);
    try {
      // 获取卡包内所有卡片（假设有getCardsByPackId方法）
      const cards = await dataAdapter.getCardsByPackId(pack.id);
      setPackDetailCards(cards);
    } catch {
      setPackDetailCards([]);
    } finally {
      setPackDetailLoading(false);
    }
  };
  const closePackDetail = () => {
    setPackDetail(null);
    setPackDetailCards([]);
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
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 px-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">抽卡系统</h1>
        <p className="text-gray-400 text-sm md:text-base mb-4">选择卡包开始您的抽卡之旅</p>
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

      {/* Card Packs 封面主视觉，点击弹窗 */}
      {filteredPacks.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg">暂无该玩法类型的卡包</div>
          <p className="text-gray-500 text-sm mt-2">请选择其他玩法类型或联系管理员添加卡包</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {filteredPacks.map((pack) => (
          <div
            key={pack.id}
            className="bg-gray-800 rounded-xl shadow flex flex-col items-center p-3 md:p-5 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
            onClick={() => openPackDetail(pack)}
          >
            <img
              src={pack.coverImageUrl || '/packs/default.jpg'}
              alt={pack.name}
              className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg mb-2"
              onError={e => { e.currentTarget.src = '/packs/default.jpg'; }}
            />
            <div className="text-base md:text-lg font-semibold text-white mb-1 truncate w-full text-center">{pack.name}</div>
            <div className="text-xs text-gray-400 mb-1 line-clamp-1 w-full text-center">{pack.description}</div>
            <div className="flex items-center justify-between w-full mt-auto">
              <span className="text-sm font-bold text-white">{pack.cost} {pack.currency === 'GOLD' ? '💰' : pack.currency === 'TICKET' ? '🎫' : '💎'}</span>
              <span className={`px-2 py-1 rounded text-xs ml-2 ${pack.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{pack.isActive ? '启用' : '禁用'}</span>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* 卡包详情弹窗 */}
      <GlobalModal open={!!packDetail} onClose={closePackDetail} zIndex={50} className="p-4 md:p-6 w-full max-w-lg md:max-w-2xl max-h-[95vh] md:max-h-[85vh]">
        {packDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-lg md:max-w-2xl max-h-[95vh] md:max-h-[85vh] overflow-y-auto relative"
            onClick={e => e.stopPropagation()}
          >
              {/* 关闭按钮 */}
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl font-bold focus:outline-none z-10"
                onClick={closePackDetail}
                aria-label="关闭"
              >
                ×
              </button>
              {/* 封面与基本信息 */}
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={packDetail.coverImageUrl || '/packs/default.jpg'}
                  alt={packDetail.name}
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg"
                  onError={e => { e.currentTarget.src = '/packs/default.jpg'; }}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-xl font-bold text-white mb-1">{packDetail.name}</h2>
                  <p className="text-gray-400 text-xs md:text-sm mb-2 line-clamp-2">{packDetail.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-white">{packDetail.cost} {packDetail.currency === 'GOLD' ? '💰' : packDetail.currency === 'TICKET' ? '🎫' : '💎'}</span>
                    <span className={`px-2 py-1 rounded text-xs ${packDetail.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{packDetail.isActive ? '启用' : '禁用'}</span>
                  </div>
                </div>
              </div>
              {/* 卡包内卡片详细列表入口 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">卡包内容</h4>
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-sm font-semibold"
                  onClick={() => setShowPackCards(true)}
                >
                  查看详细卡片与概率
                </button>
              </div>
              {/* 二级弹窗：卡片详细列表 */}
                <GlobalModal open={showPackCards} onClose={() => setShowPackCards(false)} zIndex={60} className="p-4 md:p-6 w-full max-w-md max-h-[80vh]">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-md max-h-[80vh] overflow-y-auto relative"
                    onClick={e => e.stopPropagation()}
                  >
                      {/* 关闭按钮 */}
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl font-bold focus:outline-none z-10"
                        onClick={() => setShowPackCards(false)}
                        aria-label="关闭"
                      >
                        ×
                      </button>
                      <h3 className="text-base md:text-lg font-bold text-white mb-3">卡包详细内容</h3>
                      {packDetailLoading ? (
                        <div className="text-center text-gray-400 py-4">加载中...</div>
                      ) : packDetailCards.length === 0 ? (
                        <div className="text-center text-gray-400 py-4">暂无卡片</div>
                      ) : (
                        <div className="divide-y divide-gray-700">
                          {packDetailCards.map(card => {
                            let cardProbability = '';
                            if (card.probability !== undefined) {
                              cardProbability = (card.probability * 100).toFixed(2) + '%';
                            } else if (packDetail.cardProbabilities && packDetail.cardProbabilities[card.id]) {
                              cardProbability = (packDetail.cardProbabilities[card.id] * 100).toFixed(2) + '%';
                            } else {
                              cardProbability = '--';
                            }
                            return (
                              <div key={card.id} className="flex items-center py-2 gap-2">
                                <span className="flex-1 text-xs font-medium text-white truncate">{card.name}</span>
                                <span className={`rarity-${card.rarity} text-xs px-2 py-1 rounded`}>{card.rarity}</span>
                                <span className="text-xs text-gray-400 w-16 text-right">{cardProbability}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                </GlobalModal>
              {/* 概率与保底信息 */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">稀有度概率</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {Object.values(CardRarity).map((rarity) => {
                    const cardsOfRarity = packDetailCards.filter(c => c.rarity === rarity);
                    const totalProbability = cardsOfRarity.reduce((sum, c) => {
                      return sum + (packDetail.cardProbabilities[c.id] || 0);
                    }, 0);
                    
                    return (
                      <div key={rarity} className="text-center">
                        <div className={`rarity-${rarity} text-xs px-2 py-1 rounded mb-1`}>{rarity}</div>
                        <div className="text-xs text-gray-400">{(totalProbability * 100).toFixed(1)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {packDetail.pitySystem && (
                <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-300">
                    <span className="font-medium">保底机制：</span>
                    {packDetail.pitySystem.maxPity} 抽必出高稀有度卡牌
                  </div>
                </div>
              )}
              {/* 抽卡操作区块 */}
              <div className="space-y-3">
                <div className="h-20 md:h-24 flex items-center justify-center relative bg-gray-700 rounded-lg">
                  <AnimatePresence mode="wait">
                    {animationState === GachaAnimationState.SPINNING && selectedPack?.id === packDetail.id && (
                      <motion.div
                        key="spinning"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-center absolute inset-0 flex flex-col items-center justify-center"
                      >
                        <div className="text-3xl md:text-4xl mb-2 animate-spin">🎲</div>
                        <div className="text-sm md:text-base text-white">抽卡中...</div>
                      </motion.div>
                    )}
                    {animationState === GachaAnimationState.IDLE && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center absolute inset-0 flex flex-col items-center justify-center"
                      >
                        <div className="text-3xl md:text-4xl mb-2">🎴</div>
                        <div className="text-sm md:text-base text-gray-400">准备抽卡</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      setSelectedPack(packDetail);
                      handleGacha(1);
                    }}
                    disabled={animationState !== GachaAnimationState.IDLE}
                    className="btn btn-primary text-sm md:text-base px-4 md:px-6 py-2 md:py-3 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    单抽 ({packDetail.cost} {packDetail.currency === 'GOLD' ? '💰' : packDetail.currency === 'TICKET' ? '🎫' : '💎'})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPack(packDetail);
                      handleGacha(10);
                    }}
                    disabled={animationState !== GachaAnimationState.IDLE}
                    className="btn btn-success text-sm md:text-base px-4 md:px-6 py-2 md:py-3 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    十连抽 ({packDetail.cost * 10} {packDetail.currency === 'GOLD' ? '💰' : packDetail.currency === 'TICKET' ? '🎫' : '💎'})
                  </button>
                </div>
              </div>
          </motion.div>
        )}
      </GlobalModal>

      {/* Gacha Result Modal */}
      <GlobalModal 
        open={!!gachaResult} 
        onClose={closeResult} 
        zIndex={70} 
        className="p-4 md:p-6 w-full max-w-lg md:max-w-2xl max-h-[95vh] md:max-h-[85vh]"
      >
        {gachaResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-white mb-2">抽卡结果</h2>
              <div className="flex items-center justify-center space-x-2 text-sm md:text-base">
                <span className="text-gray-400">获得 {gachaResult.cards.length} 张卡牌</span>
                {gachaResult.pityTriggered && (
                  <span className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs">🎉 保底触发</span>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-900 bg-opacity-50 rounded-lg p-3 text-center">
                <div className="text-green-400 font-bold text-lg">
                  {gachaResult.newCards.length}
                </div>
                <div className="text-green-300 text-xs">新卡牌</div>
              </div>
              <div className="bg-blue-900 bg-opacity-50 rounded-lg p-3 text-center">
                <div className="text-blue-400 font-bold text-lg">
                  {gachaResult.duplicates.length}
                </div>
                <div className="text-blue-300 text-xs">重复卡牌</div>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1 md:gap-2 mb-4">
              {gachaResult.cards.map((card, index) => (
                <motion.div
                  key={`${card.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gray-700 rounded-lg p-1 md:p-2 text-center ${
                    gachaResult.newCards.includes(card) ? 'ring-1 ring-green-500' : ''
                  }`}
                >
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
                  <div className="text-xs font-medium text-white truncate">
                    {card.name}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={closeResult}
              className="btn btn-primary w-full text-sm md:text-base py-2 md:py-3"
            >
              确认
            </button>
          </motion.div>
        )}
      </GlobalModal>
    </div>
  );
};

export default GachaPage; 