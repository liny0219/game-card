import React from 'react';
import { Link } from 'react-router-dom';
import { useGameplay, GAMEPLAY_CONFIG } from '../context/GameplayContext';
import { GameplayType } from '../types';

const HomePage: React.FC = () => {
  const { getAllGameplayTypes } = useGameplay();

  const getGameplayConfig = (gameplayType: GameplayType) => {
    return GAMEPLAY_CONFIG[gameplayType as keyof typeof GAMEPLAY_CONFIG];
  };

  return (
    <div className="space-y-6 md:space-y-10">
      {/* 玩法选择区块 - 放在最前面 */}
      <div className="space-y-4 md:space-y-6 px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">选择游戏玩法</h2>
          <p className="text-sm sm:text-base text-gray-400">每种玩法都有独特的卡包和收集机制</p>
        </div>
        
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          {getAllGameplayTypes().map((gameplay) => {
            const config = getGameplayConfig(gameplay.type);
            
            return (
              <div key={gameplay.type} className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-colors">
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-4">
                    <div className="text-2xl sm:text-3xl md:text-4xl">{config.icon}</div>
                    <div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{config.name}</h3>
                    </div>
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-300 mb-4 md:mb-6 leading-relaxed">
                    {config.description}
                  </p>
                  
                  {/* 快速操作按钮 - 移动端2x2网格 */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Link
                      to={`/${gameplay.type}/gacha`}
                      className="flex items-center justify-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm md:text-base font-medium transition-colors"
                    >
                      <span>🎲</span>
                      <span>开始抽卡</span>
                    </Link>
                    
                    <Link
                      to={`/${gameplay.type}/collection`}
                      className="flex items-center justify-center space-x-1 sm:space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm md:text-base font-medium transition-colors"
                    >
                      <span>📚</span>
                      <span>查看收藏</span>
                    </Link>
                    
                    <Link
                      to={`/${gameplay.type}/statistics`}
                      className="flex items-center justify-center space-x-1 sm:space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm md:text-base font-medium transition-colors"
                    >
                      <span>📊</span>
                      <span>数据统计</span>
                    </Link>
                    
                    <Link
                      to={`/${gameplay.type}/history`}
                      className="flex items-center justify-center space-x-1 sm:space-x-2 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm md:text-base font-medium transition-colors"
                    >
                      <span>📋</span>
                      <span>历史记录</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 游戏介绍 - 移到玩法选择后面，红色框的内容 */}
      <div className="text-center space-y-3 md:space-y-4 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
          🎴 卡牌抽卡系统
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl md:max-w-3xl mx-auto">
          体验不同玩法的卡牌收集乐趣，每种玩法都有独特的游戏机制和收集体验
        </p>
      </div>

      {/* 系统特色介绍 */}
      <div className="space-y-4 md:space-y-6 px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">系统特色</h2>
          <p className="text-sm sm:text-base text-gray-400">丰富的功能和深度的收集体验</p>
        </div>
        
        <div className="space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
          <div className="bg-gray-800 rounded-xl p-4 md:p-6">
            <div className="text-2xl md:text-3xl mb-2 md:mb-3">🎯</div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-2">多样玩法</h3>
            <p className="text-sm md:text-base text-gray-400">
              不同的游戏玩法，带来不同的收集体验和策略深度
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 md:p-6">
            <div className="text-2xl md:text-3xl mb-2 md:mb-3">💎</div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-2">稀有收集</h3>
            <p className="text-sm md:text-base text-gray-400">
              6级稀有度系统，从普通N卡到传说LR卡，建立完整收藏
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 md:p-6">
            <div className="text-2xl md:text-3xl mb-2 md:mb-3">📊</div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-2">数据统计</h3>
            <p className="text-sm md:text-base text-gray-400">
              详细的统计分析，追踪收集进度和抽卡历史
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 