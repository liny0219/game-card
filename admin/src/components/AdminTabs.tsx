import React from 'react';

interface AdminTabsProps {
  activeTab: 'cards' | 'packs' | 'templates';
  setActiveTab: (tab: 'cards' | 'packs' | 'templates') => void;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'cards', name: '卡牌管理' },
    { id: 'packs', name: '卡包管理' },
    { id: 'templates', name: '模板管理' },
  ];

  return (
    <div className="flex border-b border-gray-700 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as 'cards' | 'packs' | 'templates')}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ease-in-out
            ${activeTab === tab.id
              ? 'border-b-2 border-indigo-400 text-indigo-300'
              : 'border-b-2 border-transparent text-gray-400 hover:text-white'
            }`}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
};

export default AdminTabs; 