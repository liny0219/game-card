import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useGameplay } from '../context/GameplayContext';
import { CurrencyType, GameplayType } from '../types';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user } = useUser();
  const { currentGameplayType } = useGameplay();

  // 功能页面配置
  const functionPages = [
    { name: '抽卡', path: 'gacha', icon: '🎲' },
    { name: '收藏', path: 'collection', icon: '📚' },
    { name: '统计', path: 'statistics', icon: '📊' },
    { name: '历史', path: 'history', icon: '📋' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isGameplayPageActive = (gameplayType: GameplayType, page: string) => {
    return location.pathname === `/${gameplayType}/${page}`;
  };

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 space-y-3 sm:space-y-0">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🎴</div>
            <span className="text-xl font-bold text-white">抽卡系统</span>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
            {/* 首页链接 */}
            <Link
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                isActive('/')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>🏠</span>
              <span>首页</span>
            </Link>

            {/* 功能导航 - 当在玩法页面时显示 */}
            {currentGameplayType && (
              <>
                {functionPages.map((page) => (
                  <Link
                    key={page.path}
                    to={`/${currentGameplayType}/${page.path}`}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                      isGameplayPageActive(currentGameplayType, page.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span>{page.icon}</span>
                    <span className="hidden sm:inline">{page.name}</span>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* 紧凑资产显示 */}
              <div className="inline-flex items-center space-x-4 md:space-x-6 bg-gray-700 rounded-full px-4 md:px-6 py-2 md:py-3">
                <div className="flex items-center space-x-1">
                  <span className="text-sm md:text-base">💰</span>
                  <span className="text-sm md:text-base font-bold text-yellow-400">{user.currencies[CurrencyType.GOLD]}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm md:text-base">🎫</span>
                  <span className="text-sm md:text-base font-bold text-blue-400">{user.currencies[CurrencyType.TICKET]}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm md:text-base">💎</span>
                  <span className="text-sm md:text-base font-bold text-purple-400">{user.currencies[CurrencyType.PREMIUM]}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs md:text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white text-xs md:text-sm hidden md:inline">{user.username}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 