import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useDataAdapter } from '../context/DataContext';
import { Statistics, UserStatistics, CurrencyType, GameplayType } from '../types';

const StatisticsPage: React.FC = () => {
  const { user } = useUser();
  const dataAdapter = useDataAdapter();
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [globalStats, setGlobalStats] = useState<Statistics | null>(null);
  const [selectedGameplayType, setSelectedGameplayType] = useState<GameplayType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user, selectedGameplayType]);

  const loadStatistics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let userStatsData: UserStatistics;
      let globalStatsData: Statistics;

      if (selectedGameplayType === 'ALL') {
        [userStatsData, globalStatsData] = await Promise.all([
          dataAdapter.getUserStatistics(user.id),
          dataAdapter.getStatistics()
        ]);
      } else {
        [userStatsData, globalStatsData] = await Promise.all([
          dataAdapter.getUserStatisticsByGameplayType(user.id, selectedGameplayType),
          dataAdapter.getStatisticsByGameplayType(selectedGameplayType)
        ]);
      }
      
      setUserStats(userStatsData);
      setGlobalStats(globalStatsData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
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
    <div className="space-y-6 md:space-y-8 px-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">数据统计</h1>
        <p className="text-gray-400 text-sm md:text-base">详细的抽卡数据分析</p>
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

      {/* User Statistics */}
      {userStats && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-semibold text-white">个人统计</h2>
            {selectedGameplayType !== 'ALL' && (
              <div className="text-sm text-blue-400 bg-blue-400/10 px-3 py-1 rounded">
                当前显示：{selectedGameplayType === GameplayType.DEFAULT ? '默认玩法' :
                          selectedGameplayType === GameplayType.BATTLE ? '战斗玩法' :
                          selectedGameplayType === GameplayType.COLLECTION ? '收集玩法' :
                          selectedGameplayType === GameplayType.STRATEGY ? '策略玩法' :
                          selectedGameplayType === GameplayType.ADVENTURE ? '冒险玩法' :
                          selectedGameplayType === GameplayType.PUZZLE ? '解谜玩法' : selectedGameplayType}
              </div>
            )}
          </div>
          
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <div className="card p-3 md:p-6 text-center">
              <div className="text-lg md:text-3xl font-bold text-blue-400 mb-1 md:mb-2">
                {userStats.totalGachas}
              </div>
              <div className="text-gray-400 text-xs md:text-sm">总抽卡次数</div>
            </div>
            
            <div className="card p-3 md:p-6 text-center">
              <div className="text-lg md:text-3xl font-bold text-green-400 mb-1 md:mb-2">
                {Object.values(userStats.cardsByRarity).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-gray-400 text-xs md:text-sm">拥有卡牌</div>
            </div>
            
            <div className="card p-3 md:p-6 text-center">
              <div className="text-lg md:text-3xl font-bold text-yellow-400 mb-1 md:mb-2">
                {userStats.totalSpent[CurrencyType.GOLD]}
              </div>
              <div className="text-gray-400 text-xs md:text-sm">花费金币</div>
            </div>
            
            <div className="card p-3 md:p-6 text-center">
              <div className="text-lg md:text-3xl font-bold text-purple-400 mb-1 md:mb-2">
                {userStats.totalSpent[CurrencyType.TICKET]}
              </div>
              <div className="text-gray-400 text-xs md:text-sm">花费抽卡券</div>
            </div>
          </div>

          {/* Rarity Distribution */}
          <div className="card p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">稀有度分布</h3>
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {Object.entries(userStats.cardsByRarity).map(([rarity, count]) => (
                <div key={rarity} className="text-center">
                  <div className={`rarity-${rarity} rounded-lg p-2 md:p-4 mb-1 md:mb-2`}>
                    <div className="text-lg md:text-2xl font-bold">{count}</div>
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">{rarity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Gacha */}
          {userStats.lastGachaAt && (
            <div className="card p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">最近抽卡</h3>
              <p className="text-gray-400 text-sm md:text-base">
                {new Date(userStats.lastGachaAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Pack Gacha Statistics */}
          {userStats.packGachaSummary && userStats.packGachaSummary.length > 0 && (
            <div className="card p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">卡包抽卡统计</h3>
              <div className="space-y-3">
                {userStats.packGachaSummary.map((summary) => (
                  <div key={summary.packId} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      {summary.packCoverImageUrl && (
                        <img 
                          src={summary.packCoverImageUrl} 
                          alt={summary.packName}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm md:text-base font-medium text-white">{summary.packName}</div>
                        <div className="text-xs text-gray-400">{summary.packDescription}</div>
                        {summary.lastGachaAt && (
                          <div className="text-xs text-gray-500">
                            最后抽卡: {new Date(summary.lastGachaAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm md:text-base font-bold text-blue-400">
                        {summary.totalGachas} 次
                      </div>
                      <div className="text-xs text-gray-400">
                        {summary.cost} {summary.currency === 'GOLD' ? '💰' : summary.currency === 'TICKET' ? '🎫' : '💎'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Statistics */}
      {globalStats && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">全局统计</h2>
            {selectedGameplayType !== 'ALL' && (
              <div className="text-sm text-green-400 bg-green-400/10 px-3 py-1 rounded">
                当前显示：{selectedGameplayType === GameplayType.DEFAULT ? '默认玩法' :
                          selectedGameplayType === GameplayType.BATTLE ? '战斗玩法' :
                          selectedGameplayType === GameplayType.COLLECTION ? '收集玩法' :
                          selectedGameplayType === GameplayType.STRATEGY ? '策略玩法' :
                          selectedGameplayType === GameplayType.ADVENTURE ? '冒险玩法' :
                          selectedGameplayType === GameplayType.PUZZLE ? '解谜玩法' : selectedGameplayType}
              </div>
            )}
          </div>
          
          {/* Global Overview */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <div className="card p-3 md:p-6 text-center">
              <div className="text-lg md:text-3xl font-bold text-blue-400 mb-1 md:mb-2">
                {globalStats.totalUsers}
              </div>
              <div className="text-gray-400 text-xs md:text-base">总用户数</div>
            </div>
            
            <div className="card p-3 md:p-6 text-center">
              <div className="text-lg md:text-3xl font-bold text-green-400 mb-1 md:mb-2">
                {globalStats.totalGachas}
              </div>
              <div className="text-gray-400 text-xs md:text-base">总抽卡次数</div>
            </div>
            
            <div className="card p-3 md:p-6 text-center">
              <div className="text-lg md:text-3xl font-bold text-yellow-400 mb-1 md:mb-2">
                {globalStats.totalRevenue[CurrencyType.GOLD]}
              </div>
              <div className="text-gray-400 text-xs md:text-base">总金币收入</div>
            </div>
            
            <div className="card p-3 md:p-6 text-center">
              <div className="text-lg md:text-3xl font-bold text-purple-400 mb-1 md:mb-2">
                {globalStats.totalRevenue[CurrencyType.TICKET]}
              </div>
              <div className="text-gray-400 text-xs md:text-base">总抽卡券收入</div>
            </div>
          </div>

          {/* Global Card Distribution */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">全局卡牌分布</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(globalStats.cardDistribution).map(([rarity, count]) => (
                <div key={rarity} className="text-center">
                  <div className={`rarity-${rarity} rounded-lg p-4 mb-2`}>
                    <div className="text-2xl font-bold">{count}</div>
                  </div>
                  <div className="text-sm text-gray-400">{rarity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Packs */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">热门卡包</h3>
            <div className="space-y-3">
              {globalStats.popularPacks.map((pack, index) => (
                <div key={pack.packId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <span className="text-white font-medium">{pack.name}</span>
                  </div>
                  <div className="text-blue-400 font-bold">{pack.count} 次</div>
                </div>
              ))}
            </div>
          </div>

          {/* User Activity */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">用户活跃度</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {globalStats.userActivity.daily}
                </div>
                <div className="text-sm text-gray-400">日活跃用户</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {globalStats.userActivity.weekly}
                </div>
                <div className="text-sm text-gray-400">周活跃用户</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {globalStats.userActivity.monthly}
                </div>
                <div className="text-sm text-gray-400">月活跃用户</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage; 