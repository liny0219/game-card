import React, { useState, useEffect } from 'react';
import { Card, CardPack, CardTemplate, CardRarity, CurrencyType } from '../types';
import { useDataAdapter } from '../context/DataContext';
import { motion } from 'framer-motion';

const AdminPage: React.FC = () => {
  const dataAdapter = useDataAdapter();
  const [activeTab, setActiveTab] = useState<'cards' | 'packs' | 'templates'>('cards');
  const [cards, setCards] = useState<Card[]>([]);
  const [packs, setPacks] = useState<CardPack[]>([]);
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingPack, setEditingPack] = useState<CardPack | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // 当编辑模板改变时，重置JSON编辑状态
  useEffect(() => {
    if (editingTemplate) {
      setJsonText(JSON.stringify(editingTemplate.schema, null, 2));
      setJsonError('');
    } else {
      setJsonText('');
      setJsonError('');
    }
  }, [editingTemplate?.id]); // 只在模板ID改变时重置

  // 数据导入导出功能
  const exportData = () => {
    try {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          cards: localStorage.getItem('gacha_cards'),
          cardPacks: localStorage.getItem('gacha_card_packs'),
          cardTemplates: localStorage.getItem('gacha_card_templates'),
          users: localStorage.getItem('gacha_users'),
          userCards: localStorage.getItem('gacha_user_cards'),
          gachaHistory: localStorage.getItem('gacha_history'),
          pityCounters: localStorage.getItem('gacha_pity_counters'),
          currentUser: localStorage.getItem('gacha_current_user')
        }
      };

      // 解析JSON以验证数据
      const parsedData = {
        ...exportData,
        data: {
          cards: exportData.data.cards ? JSON.parse(exportData.data.cards) : null,
          cardPacks: exportData.data.cardPacks ? JSON.parse(exportData.data.cardPacks) : null,
          cardTemplates: exportData.data.cardTemplates ? JSON.parse(exportData.data.cardTemplates) : null,
          users: exportData.data.users ? JSON.parse(exportData.data.users) : null,
          userCards: exportData.data.userCards ? JSON.parse(exportData.data.userCards) : null,
          gachaHistory: exportData.data.gachaHistory ? JSON.parse(exportData.data.gachaHistory) : null,
          pityCounters: exportData.data.pityCounters ? JSON.parse(exportData.data.pityCounters) : null,
          currentUser: exportData.data.currentUser ? JSON.parse(exportData.data.currentUser) : null
        }
      };

      const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gacha-system-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('数据导出成功！');
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败，请查看控制台了解详情');
    }
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      // 验证数据格式
      if (!importedData.version || !importedData.data) {
        throw new Error('无效的备份文件格式');
      }

      // 确认导入
      if (!confirm(`确定要导入备份数据吗？\n\n备份时间: ${importedData.timestamp}\n版本: ${importedData.version}\n\n这将覆盖当前所有数据！`)) {
        return;
      }

      // 恢复数据到localStorage
      Object.entries(importedData.data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const storageKey = key === 'cards' ? 'gacha_cards' :
                           key === 'cardPacks' ? 'gacha_card_packs' :
                           key === 'cardTemplates' ? 'gacha_card_templates' :
                           key === 'users' ? 'gacha_users' :
                           key === 'userCards' ? 'gacha_user_cards' :
                           key === 'gachaHistory' ? 'gacha_history' :
                           key === 'pityCounters' ? 'gacha_pity_counters' :
                           key === 'currentUser' ? 'gacha_current_user' : null;
          
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(value));
          }
        }
      });

      // 重新加载数据
      await loadData();
      setImportFile(null);
      alert('数据导入成功！页面将刷新以应用新数据。');
      window.location.reload();
    } catch (error) {
      console.error('导入数据失败:', error);
      alert(`导入数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setImportFile(null);
    }
  };

  const exportPartialData = (dataType: 'cards' | 'cardPacks' | 'cardTemplates') => {
    try {
      let data;
      let filename;
      
      switch (dataType) {
        case 'cards':
          data = { cards: JSON.parse(localStorage.getItem('gacha_cards') || '[]') };
          filename = `cards-backup-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'cardPacks':
          data = { cardPacks: JSON.parse(localStorage.getItem('gacha_card_packs') || '[]') };
          filename = `card-packs-backup-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'cardTemplates':
          data = { cardTemplates: JSON.parse(localStorage.getItem('gacha_card_templates') || '[]') };
          filename = `templates-backup-${new Date().toISOString().split('T')[0]}.json`;
          break;
      }

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        type: 'partial',
        dataType,
        data
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`${dataType === 'cards' ? '卡片' : dataType === 'cardPacks' ? '卡包' : '模板'}数据导出成功！`);
    } catch (error) {
      console.error('导出部分数据失败:', error);
      alert('导出数据失败，请查看控制台了解详情');
    }
  };

  const loadData = async () => {
    try {
      const [cardsData, packsData, templatesData] = await Promise.all([
        dataAdapter.getCards(),
        dataAdapter.getCardPacks(),
        dataAdapter.getCardTemplates()
      ]);
      setCards(cardsData);
      setPacks(packsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleSaveCard = async (card: Card) => {
    try {
      await dataAdapter.updateCard(card);
      const updatedCards = await dataAdapter.getCards();
      setCards(updatedCards);
      setEditingCard(null);
    } catch (error) {
      console.error('保存卡片失败:', error);
    }
  };

  const handleSavePack = async (pack: CardPack) => {
    try {
      await dataAdapter.updateCardPack(pack);
      const updatedPacks = await dataAdapter.getCardPacks();
      setPacks(updatedPacks);
      setEditingPack(null);
    } catch (error) {
      console.error('保存卡包失败:', error);
    }
  };

  const handleSaveTemplate = async (template: CardTemplate) => {
    try {
      await dataAdapter.updateCardTemplate(template);
      const updatedTemplates = await dataAdapter.getCardTemplates();
      setTemplates(updatedTemplates);
      setEditingTemplate(null);
      setJsonText('');
      setJsonError('');
    } catch (error) {
      console.error('保存模版失败:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('确定要删除这张卡片吗？删除后将影响所有相关的卡包配置。')) {
      try {
        await dataAdapter.deleteCard(cardId);
        const updatedCards = await dataAdapter.getCards();
        setCards(updatedCards);
      } catch (error) {
        console.error('删除卡片失败:', error);
      }
    }
  };

  const handleDeletePack = async (packId: string) => {
    if (confirm('确定要删除这个卡包吗？删除后用户将无法从此卡包抽卡。')) {
      try {
        await dataAdapter.deleteCardPack(packId);
        const updatedPacks = await dataAdapter.getCardPacks();
        setPacks(updatedPacks);
      } catch (error) {
        console.error('删除卡包失败:', error);
      }
    }
  };

  // 渲染卡片属性显示（只读）
  const renderCardAttributes = (card: Card) => {
    const template = templates.find(t => t.id === card.templateId);
    if (!template?.schema?.properties) {
      // 如果没有模板schema，显示所有属性
      return Object.entries(card.attributes).map(([key, value]) => (
        <span key={key} className="text-sm text-gray-900">
          {key}: {typeof value === 'boolean' ? (value ? '是' : '否') : value}
        </span>
      ));
    }

    // 根据schema渲染属性
    return Object.entries(template.schema.properties)
      .filter(([key]) => card.attributes[key] !== undefined)
      .map(([key, propSchema]: [string, any]) => {
        const value = card.attributes[key];
        const displayValue = typeof value === 'boolean' ? (value ? '是' : '否') : value;
        const label = propSchema.title || key;
        
        return (
          <span key={key} className="text-sm text-gray-900">
            {label}: {displayValue}
          </span>
        );
      });
  };

  // 根据JSON Schema渲染动态属性字段
  const renderSchemaFields = (schema: any, attributes: Record<string, any>, onChange: (key: string, value: any) => void) => {
    if (!schema || !schema.properties) return null;

    return Object.entries(schema.properties).map(([key, propSchema]: [string, any]) => {
      const isRequired = schema.required && schema.required.includes(key);
      const currentValue = attributes[key];

      const renderField = () => {
        switch (propSchema.type) {
          case 'number':
          case 'integer':
            return (
              <input
                type="number"
                value={currentValue || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const finalValue = Math.max(propSchema.minimum || 0, Math.min(propSchema.maximum || Infinity, value));
                  onChange(key, finalValue);
                }}
                className="w-full p-2 border rounded-md text-gray-900 bg-white"
                min={propSchema.minimum || 0}
                max={propSchema.maximum}
                step={propSchema.type === 'integer' ? 1 : 0.1}
                required={isRequired}
              />
            );
          
          case 'string':
            if (propSchema.enum) {
              return (
                <select
                  value={currentValue || ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="w-full p-2 border rounded-md text-gray-900 bg-white"
                  required={isRequired}
                >
                  <option value="">请选择...</option>
                  {propSchema.enum.map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              );
            } else if (propSchema.format === 'textarea') {
              return (
                <textarea
                  value={currentValue || ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="w-full p-2 border rounded-md text-gray-900 bg-white"
                  rows={3}
                  maxLength={propSchema.maxLength}
                  required={isRequired}
                />
              );
            } else {
              return (
                <input
                  type="text"
                  value={currentValue || ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="w-full p-2 border rounded-md text-gray-900 bg-white"
                  maxLength={propSchema.maxLength}
                  required={isRequired}
                  placeholder={propSchema.description || `输入${key}`}
                />
              );
            }
          
          case 'boolean':
            return (
              <select
                value={currentValue?.toString() || 'false'}
                onChange={(e) => onChange(key, e.target.value === 'true')}
                className="w-full p-2 border rounded-md text-gray-900 bg-white"
                required={isRequired}
              >
                <option value="false">否</option>
                <option value="true">是</option>
              </select>
            );
          
          default:
            return (
              <input
                type="text"
                value={currentValue || ''}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full p-2 border rounded-md text-gray-900 bg-white"
                required={isRequired}
                placeholder={propSchema.description || `输入${key}`}
              />
            );
        }
      };

      return (
        <div key={key} className="col-span-1">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {propSchema.title || key}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField()}
          {propSchema.description && (
            <p className="text-xs text-gray-500 mt-1">{propSchema.description}</p>
          )}
        </div>
      );
    });
  };

  const renderCardEditor = () => {
    if (!editingCard) return null;

    // 确保所有必要字段都有默认值
    const safeEditingCard = {
      ...editingCard,
      name: editingCard.name || '',
      description: editingCard.description || '',
      imageUrl: editingCard.imageUrl || '',
      rarity: editingCard.rarity || CardRarity.N,
      templateId: editingCard.templateId || 'basic-card',
      attributes: {
        ...editingCard.attributes
      } as Record<string, any>
    };

    // 获取当前模板
    const currentTemplate = templates.find(t => t.id === safeEditingCard.templateId);
    
    // 根据模板schema初始化attributes的默认值
    if (currentTemplate?.schema?.properties) {
      Object.entries(currentTemplate.schema.properties).forEach(([key, propSchema]: [string, any]) => {
        if (safeEditingCard.attributes[key] === undefined) {
          switch (propSchema.type) {
            case 'number':
            case 'integer':
              safeEditingCard.attributes[key] = propSchema.default || propSchema.minimum || 0;
              break;
            case 'string':
              safeEditingCard.attributes[key] = propSchema.default || '';
              break;
            case 'boolean':
              safeEditingCard.attributes[key] = propSchema.default || false;
              break;
            default:
              safeEditingCard.attributes[key] = propSchema.default || '';
          }
        }
      });
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-6 shadow-lg h-fit"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">编辑卡片</h3>
          <button
            onClick={() => setEditingCard(null)}
            className="px-3 py-1 text-gray-600 border rounded-md hover:bg-gray-50"
          >
            取消
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              卡片名称
            </label>
            <input
              type="text"
              value={safeEditingCard.name}
              onChange={(e) => setEditingCard({...editingCard, name: e.target.value})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              稀有度
            </label>
            <select
              value={safeEditingCard.rarity}
              onChange={(e) => setEditingCard({...editingCard, rarity: e.target.value as CardRarity})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
            >
              {Object.values(CardRarity).map(rarity => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              描述
            </label>
            <textarea
              value={safeEditingCard.description}
              onChange={(e) => setEditingCard({...editingCard, description: e.target.value})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
              rows={3}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              封面图片URL
            </label>
            <input
              type="text"
              value={safeEditingCard.imageUrl}
              onChange={(e) => setEditingCard({...editingCard, imageUrl: e.target.value})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
              placeholder="输入图片URL..."
            />
            {safeEditingCard.imageUrl && (
              <div className="mt-2">
                <img 
                  src={safeEditingCard.imageUrl} 
                  alt="预览"
                  className="w-32 h-40 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          {/* 动态渲染基于模板schema的属性字段 */}
          {currentTemplate && renderSchemaFields(
            currentTemplate.schema,
            safeEditingCard.attributes,
            (key: string, value: any) => {
              setEditingCard({
                ...editingCard,
                attributes: { ...editingCard.attributes, [key]: value }
              });
            }
          )}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              卡片模板
            </label>
            <select
              value={safeEditingCard.templateId}
              onChange={(e) => {
                const newTemplateId = e.target.value;
                const newTemplate = templates.find(t => t.id === newTemplateId);
                let newAttributes = { ...editingCard.attributes };
                
                if (newTemplate?.schema?.properties) {
                  // 创建新的attributes对象，只保留新模板中定义的字段
                  const templateAttributes: Record<string, any> = {};
                  
                  Object.entries(newTemplate.schema.properties).forEach(([key, propSchema]: [string, any]) => {
                    if (newAttributes[key] !== undefined) {
                      // 保留现有值
                      templateAttributes[key] = newAttributes[key];
                    } else {
                      // 设置默认值
                      switch (propSchema.type) {
                        case 'number':
                        case 'integer':
                          templateAttributes[key] = propSchema.default || propSchema.minimum || 0;
                          break;
                        case 'string':
                          templateAttributes[key] = propSchema.default || '';
                          break;
                        case 'boolean':
                          templateAttributes[key] = propSchema.default || false;
                          break;
                        default:
                          templateAttributes[key] = propSchema.default || '';
                      }
                    }
                  });
                  
                  newAttributes = templateAttributes;
                }
                
                setEditingCard({
                  ...editingCard,
                  templateId: newTemplateId,
                  attributes: newAttributes
                });
              }}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={() => handleSaveCard(editingCard)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      </motion.div>
    );
  };

  const renderPackEditor = () => {
    if (!editingPack) return null;

    // 确保所有必要字段都有默认值
    const safeEditingPack = {
      ...editingPack,
      name: editingPack.name || '',
      description: editingPack.description || '',
      coverImageUrl: editingPack.coverImageUrl || '/packs/default.jpg',
      cost: editingPack.cost || 0,
      currency: editingPack.currency || CurrencyType.GOLD,
      isActive: editingPack.isActive !== undefined ? editingPack.isActive : true,
      cardProbabilities: editingPack.cardProbabilities || {},
      rarityProbabilities: editingPack.rarityProbabilities || {
        [CardRarity.N]: 0.60,
        [CardRarity.R]: 0.25,
        [CardRarity.SR]: 0.10,
        [CardRarity.SSR]: 0.04,
        [CardRarity.UR]: 0.009,
        [CardRarity.LR]: 0.001
      },
      availableCards: editingPack.availableCards || [],
      pitySystem: editingPack.pitySystem || {
        maxPity: 90,
        guaranteedCards: [],
        softPityStart: 75,
        resetOnTrigger: true
      }
    };



    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-6 shadow-lg h-fit"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">编辑卡包</h3>
          <button
            onClick={() => setEditingPack(null)}
            className="px-3 py-1 text-gray-600 border rounded-md hover:bg-gray-50"
          >
            取消
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              卡包名称
            </label>
            <input
              type="text"
              value={safeEditingPack.name}
              onChange={(e) => setEditingPack({...editingPack, name: e.target.value})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              封面图片URL
            </label>
            <input
              type="text"
              value={safeEditingPack.coverImageUrl}
              onChange={(e) => setEditingPack({...editingPack, coverImageUrl: e.target.value})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
              placeholder="输入图片URL..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              消耗货币
            </label>
            <select
              value={safeEditingPack.currency}
              onChange={(e) => setEditingPack({...editingPack, currency: e.target.value as CurrencyType})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
            >
              {Object.values(CurrencyType).map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              价格
            </label>
            <input
              type="number"
              value={safeEditingPack.cost}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setEditingPack({...editingPack, cost: Math.max(0, value)});
              }}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              是否启用
            </label>
            <select
              value={safeEditingPack.isActive.toString()}
              onChange={(e) => setEditingPack({...editingPack, isActive: e.target.value === 'true'})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
            >
              <option value="true">启用</option>
              <option value="false">禁用</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              描述
            </label>
            <textarea
              value={safeEditingPack.description}
              onChange={(e) => setEditingPack({...editingPack, description: e.target.value})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
              rows={3}
            />
          </div>
          <div className="col-span-2">
            <h4 className="font-medium text-gray-900 mb-2">稀有度概率</h4>
            {Object.entries(safeEditingPack.rarityProbabilities).map(([rarity, probability]) => (
              <div key={rarity} className="flex items-center space-x-2 mb-2">
                <span className="w-12 text-sm text-gray-900">{rarity}:</span>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={probability}
                  onChange={(e) => setEditingPack({
                    ...editingPack,
                    rarityProbabilities: {
                      ...editingPack.rarityProbabilities,
                      [rarity]: parseFloat(e.target.value)
                    }
                  })}
                  className="flex-1 p-2 border rounded-md text-gray-900 bg-white"
                />
                <span className="text-sm text-gray-500">
                  ({(probability * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-900">卡片概率设置</h4>
              <button
                onClick={() => {
                  // 根据稀有度概率重新计算每张卡片的概率
                  const newCardProbabilities = { ...safeEditingPack.cardProbabilities };
                  const rarityGroups = cards.reduce((acc, card) => {
                    if (!acc[card.rarity]) acc[card.rarity] = [];
                    acc[card.rarity].push(card.id);
                    return acc;
                  }, {} as Record<CardRarity, string[]>);

                  Object.entries(safeEditingPack.rarityProbabilities).forEach(([rarity, weight]) => {
                    const cardsInRarity = rarityGroups[rarity as CardRarity] || [];
                    const individualProbability = cardsInRarity.length > 0 ? weight / cardsInRarity.length : 0;
                    cardsInRarity.forEach(cardId => {
                      newCardProbabilities[cardId] = individualProbability;
                    });
                  });

                  setEditingPack({
                    ...editingPack,
                    cardProbabilities: newCardProbabilities
                  });
                }}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                根据稀有度重新分配
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md p-2">
              {Object.entries(safeEditingPack.cardProbabilities).map(([cardId, probability]) => {
                const card = cards.find(c => c.id === cardId);
                if (!card) return null;
                return (
                  <div key={cardId} className="flex items-center space-x-2 mb-1">
                    <span className="w-32 text-sm truncate text-gray-900" title={card.name}>
                      {card.name}
                    </span>
                    <span className={`w-8 text-xs px-1 rounded ${
                      card.rarity === CardRarity.LR ? 'bg-yellow-100 text-yellow-800' :
                      card.rarity === CardRarity.UR ? 'bg-purple-100 text-purple-800' :
                      card.rarity === CardRarity.SSR ? 'bg-red-100 text-red-800' :
                      card.rarity === CardRarity.SR ? 'bg-blue-100 text-blue-800' :
                      card.rarity === CardRarity.R ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {card.rarity}
                    </span>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      max="1"
                      value={probability}
                      onChange={(e) => setEditingPack({
                        ...editingPack,
                        cardProbabilities: {
                          ...editingPack.cardProbabilities,
                          [cardId]: parseFloat(e.target.value)
                        }
                      })}
                      className="flex-1 p-1 border rounded-md text-sm text-gray-900 bg-white"
                    />
                    <span className="text-xs text-gray-500 w-16">
                      ({(probability * 100).toFixed(2)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {safeEditingPack.pitySystem && (
            <div className="col-span-2">
              <h4 className="font-medium text-gray-900 mb-2">保底系统</h4>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">最大保底</label>
                                    <input
                    type="number"
                    value={safeEditingPack.pitySystem.maxPity}
                    onChange={(e) => setEditingPack({
                      ...editingPack,
                      pitySystem: {
                        ...safeEditingPack.pitySystem,
                        maxPity: parseInt(e.target.value)
                      }
                    })}
                    className="w-full p-2 border rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">软保底开始</label>
                  <input
                    type="number"
                    value={safeEditingPack.pitySystem.softPityStart}
                    onChange={(e) => setEditingPack({
                      ...editingPack,
                      pitySystem: {
                        ...safeEditingPack.pitySystem,
                        softPityStart: parseInt(e.target.value)
                      }
                    })}
                    className="w-full p-2 border rounded-md text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs text-gray-500">保底卡片池</label>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        const ssrAndAbove = cards.filter(c => 
                          c.rarity === CardRarity.SSR || c.rarity === CardRarity.UR || c.rarity === CardRarity.LR
                        ).map(c => c.id);
                        setEditingPack({
                          ...editingPack,
                          pitySystem: {
                            ...safeEditingPack.pitySystem,
                            guaranteedCards: ssrAndAbove
                          }
                        });
                      }}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      SSR+
                    </button>
                    <button
                      onClick={() => {
                        const urAndAbove = cards.filter(c => 
                          c.rarity === CardRarity.UR || c.rarity === CardRarity.LR
                        ).map(c => c.id);
                        setEditingPack({
                          ...editingPack,
                          pitySystem: {
                            ...safeEditingPack.pitySystem,
                            guaranteedCards: urAndAbove
                          }
                        });
                      }}
                      className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                    >
                      UR+
                    </button>
                    <button
                      onClick={() => {
                        setEditingPack({
                          ...editingPack,
                          pitySystem: {
                            ...safeEditingPack.pitySystem,
                            guaranteedCards: []
                          }
                        });
                      }}
                      className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                    >
                      清空
                    </button>
                  </div>
                </div>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                  {cards.map(card => (
                    <div key={card.id} className="flex items-center space-x-2 mb-1">
                      <input
                        type="checkbox"
                        checked={safeEditingPack.pitySystem.guaranteedCards.includes(card.id)}
                        onChange={(e) => {
                          const guaranteedCards = e.target.checked
                            ? [...safeEditingPack.pitySystem.guaranteedCards, card.id]
                            : safeEditingPack.pitySystem.guaranteedCards.filter(id => id !== card.id);
                          setEditingPack({
                            ...editingPack,
                            pitySystem: {
                              ...safeEditingPack.pitySystem,
                              guaranteedCards
                            }
                          });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm flex-1 text-gray-900">{card.name}</span>
                      <span className={`text-xs px-1 rounded ${
                        card.rarity === CardRarity.LR ? 'bg-yellow-100 text-yellow-800' :
                        card.rarity === CardRarity.UR ? 'bg-purple-100 text-purple-800' :
                        card.rarity === CardRarity.SSR ? 'bg-red-100 text-red-800' :
                        card.rarity === CardRarity.SR ? 'bg-blue-100 text-blue-800' :
                        card.rarity === CardRarity.R ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {card.rarity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={() => handleSavePack(editingPack)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      </motion.div>
    );
  };

  const renderTemplateEditor = () => {
    if (!editingTemplate) return null;

    // 确保所有必要字段都有默认值
    const safeEditingTemplate = {
      ...editingTemplate,
      name: editingTemplate.name || '',
      description: editingTemplate.description || '',
      schema: editingTemplate.schema || {}
    };

    const handleJsonChange = (value: string) => {
      setJsonText(value);
      
      try {
        const parsedSchema = JSON.parse(value);
        setEditingTemplate({
          ...editingTemplate,
          schema: parsedSchema
        });
        setJsonError('');
      } catch (error) {
        setJsonError(`JSON格式错误: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-6 shadow-lg h-fit"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">编辑卡片模版</h3>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setJsonText('');
              setJsonError('');
            }}
            className="px-3 py-1 text-gray-600 border rounded-md hover:bg-gray-50"
          >
            取消
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              模版名称
            </label>
            <input
              type="text"
              value={safeEditingTemplate.name}
              onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              描述
            </label>
            <textarea
              value={safeEditingTemplate.description}
              onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
              className="w-full p-2 border rounded-md text-gray-900 bg-white"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              属性模式 (JSON)
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              className={`w-full p-2 border rounded-md font-mono text-sm text-gray-900 bg-white ${
                jsonError ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={8}
              placeholder="输入JSON Schema..."
            />
            {jsonError && (
              <div className="mt-2 text-red-600 text-sm">
                {jsonError}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              提示：这里定义卡片属性的结构。例如：
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs">
{`{
  "type": "object",
  "properties": {
    "attack": {"type": "number", "minimum": 0},
    "defense": {"type": "number", "minimum": 0}
  },
  "required": ["attack", "defense"]
}`}
              </pre>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={() => handleSaveTemplate(editingTemplate)}
            disabled={!!jsonError}
            className={`px-4 py-2 rounded-md ${
              jsonError 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            保存
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Mobile Warning */}
      <div className="lg:hidden bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm">
              管理界面建议在桌面端使用，以获得最佳体验。
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">系统管理</h1>
          <div className="flex space-x-3">
            {/* 导入导出功能 */}
            <div className="flex space-x-2">
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
              >
                导出所有数据
              </button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImportFile(file);
                      importData(file);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                  导入数据
                </button>
              </div>
              
              {/* 部分导出下拉菜单 */}
              <div className="relative group">
                <button className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm">
                  部分导出 ▼
                </button>
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={() => exportPartialData('cards')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  >
                    导出卡片数据
                  </button>
                  <button
                    onClick={() => exportPartialData('cardPacks')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  >
                    导出卡包数据
                  </button>
                  <button
                    onClick={() => exportPartialData('cardTemplates')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                  >
                    导出模板数据
                  </button>
                </div>
              </div>
            </div>
            
            <div className="border-l border-gray-300 h-8"></div>
            
            {/* 清除数据入口 */}
            <button
              onClick={() => {
                if (confirm('确定要跳转到数据清除页面吗？')) {
                  window.open('/clear-data.html', '_blank');
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
            >
              清除数据
            </button>
          </div>
        </div>
        
        {/* 标签导航 */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'cards'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            卡片管理
          </button>
          <button
            onClick={() => setActiveTab('packs')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'packs'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            卡包管理
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'templates'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            模版管理
          </button>
        </div>

        {/* 数据统计信息和导入导出说明 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">数据统计</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded-md">
                <div className="font-medium text-gray-900">{cards.length}</div>
                <div className="text-gray-500">卡片总数</div>
              </div>
              <div className="bg-white p-3 rounded-md">
                <div className="font-medium text-gray-900">{packs.length}</div>
                <div className="text-gray-500">卡包总数</div>
              </div>
              <div className="bg-white p-3 rounded-md">
                <div className="font-medium text-gray-900">{templates.length}</div>
                <div className="text-gray-500">模板总数</div>
              </div>
              <div className="bg-white p-3 rounded-md">
                <div className="font-medium text-gray-900">
                  {Object.keys(localStorage).filter(key => key.startsWith('gacha_')).length}
                </div>
                <div className="text-gray-500">存储键数</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-900 mb-3">导入导出功能</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p>• <strong>导出所有数据</strong>：备份完整的系统数据，包括卡片、卡包、模板、用户等</p>
              <p>• <strong>导入数据</strong>：从备份文件恢复数据，会覆盖当前所有数据</p>
              <p>• <strong>部分导出</strong>：只导出特定类型的数据（卡片/卡包/模板）</p>
              <p>• <strong>文件格式</strong>：JSON格式，包含版本信息和时间戳</p>
              <p className="text-green-700 font-medium">💡 建议在修改重要数据前先导出备份</p>
            </div>
          </div>
        </div>

        {/* 内容区域 - 左侧列表，右侧编辑 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧列表区域 */}
          <div className="lg:col-span-1">
            {activeTab === 'cards' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">卡片列表</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => exportPartialData('cards')}
                      className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                    >
                      导出
                    </button>
                    <button
                      onClick={() => {
                        // 使用第一个可用模板
                        const defaultTemplate = templates[0] || {
                          id: 'basic-card',
                          schema: {
                            type: 'object',
                            properties: {
                              attack: { type: 'number', minimum: 0, default: 100 },
                              defense: { type: 'number', minimum: 0, default: 80 }
                            },
                            required: ['attack', 'defense']
                          }
                        };

                        // 根据模板schema生成初始属性
                        const initialAttributes: Record<string, any> = {};
                        if (defaultTemplate.schema?.properties) {
                          Object.entries(defaultTemplate.schema.properties).forEach(([key, propSchema]: [string, any]) => {
                            switch (propSchema.type) {
                              case 'number':
                              case 'integer':
                                initialAttributes[key] = propSchema.default || propSchema.minimum || 0;
                                break;
                              case 'string':
                                initialAttributes[key] = propSchema.default || '';
                                break;
                              case 'boolean':
                                initialAttributes[key] = propSchema.default || false;
                                break;
                              default:
                                initialAttributes[key] = propSchema.default || '';
                            }
                          });
                        }

                        const newCard: Card = {
                          id: `custom-${Date.now()}`,
                          name: '新卡片',
                          description: '自定义卡片',
                          rarity: CardRarity.N,
                          imageUrl: '/assets/card_n.png',
                          attributes: initialAttributes,
                          templateId: defaultTemplate.id,
                          createdAt: new Date(),
                          updatedAt: new Date()
                        };
                        setEditingCard(newCard);
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      新建
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-4 pl-2">
                  {cards.map(card => (
                    <div 
                      key={card.id} 
                      className={`bg-white rounded-lg p-3 shadow cursor-pointer transition-all hover:shadow-md relative ${
                        editingCard?.id === card.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      style={{
                        margin: editingCard?.id === card.id ? '2px' : '0',
                        transform: editingCard?.id === card.id ? 'scale(1.01)' : 'scale(1)'
                      }}
                      onClick={() => setEditingCard({
                        ...card,
                        attributes: { ...card.attributes }
                      })}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm truncate flex-1 mr-2">{card.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                          card.rarity === CardRarity.LR ? 'bg-yellow-100 text-yellow-800' :
                          card.rarity === CardRarity.UR ? 'bg-purple-100 text-purple-800' :
                          card.rarity === CardRarity.SSR ? 'bg-red-100 text-red-800' :
                          card.rarity === CardRarity.SR ? 'bg-blue-100 text-blue-800' :
                          card.rarity === CardRarity.R ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {card.rarity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{card.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 truncate flex-1 mr-2">
                          {templates.find(t => t.id === card.templateId)?.name || card.templateId}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card.id);
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex-shrink-0"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'packs' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">卡包列表</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => exportPartialData('cardPacks')}
                      className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                    >
                      导出
                    </button>
                    <button
                      onClick={() => {
                        const newPack: CardPack = {
                          id: `custom-pack-${Date.now()}`,
                          name: '新卡包',
                          description: '自定义卡包',
                          coverImageUrl: '/packs/default.jpg',
                          cost: 100,
                          currency: CurrencyType.GOLD,
                          isActive: true,
                          cardProbabilities: cards.reduce((acc, card) => {
                            acc[card.id] = card.rarity === CardRarity.N ? 0.02 : 
                                          card.rarity === CardRarity.R ? 0.0125 : 
                                          card.rarity === CardRarity.SR ? 0.01 : 
                                          card.rarity === CardRarity.SSR ? 0.008 : 
                                          card.rarity === CardRarity.UR ? 0.003 : 0.001;
                            return acc;
                          }, {} as Record<string, number>),
                          rarityProbabilities: {
                            [CardRarity.N]: 0.60,
                            [CardRarity.R]: 0.25,
                            [CardRarity.SR]: 0.10,
                            [CardRarity.SSR]: 0.04,
                            [CardRarity.UR]: 0.009,
                            [CardRarity.LR]: 0.001
                          },
                          availableCards: cards.map(c => c.id),
                          pitySystem: {
                            maxPity: 90,
                            guaranteedCards: cards.filter(c => c.rarity === CardRarity.SSR || c.rarity === CardRarity.UR || c.rarity === CardRarity.LR).map(c => c.id),
                            softPityStart: 75,
                            resetOnTrigger: true
                          },
                          createdAt: new Date(),
                          updatedAt: new Date()
                        };
                        setEditingPack(newPack);
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      新建
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-4 pl-2">
                  {packs.map(pack => (
                    <div 
                      key={pack.id} 
                      className={`bg-white rounded-lg p-3 shadow cursor-pointer transition-all hover:shadow-md relative ${
                        editingPack?.id === pack.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      style={{
                        margin: editingPack?.id === pack.id ? '2px' : '0',
                        transform: editingPack?.id === pack.id ? 'scale(1.01)' : 'scale(1)'
                      }}
                      onClick={() => setEditingPack({
                        ...pack,
                        cardProbabilities: { ...pack.cardProbabilities },
                        rarityProbabilities: { ...pack.rarityProbabilities },
                        availableCards: [...pack.availableCards],
                        pitySystem: pack.pitySystem ? {
                          ...pack.pitySystem,
                          guaranteedCards: [...pack.pitySystem.guaranteedCards]
                        } : undefined
                      })}
                    >
                      <div className="flex items-start space-x-3">
                        <img 
                          src={pack.coverImageUrl || '/packs/default.jpg'} 
                          alt={pack.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = '/packs/default.jpg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-sm truncate flex-1 mr-2">{pack.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                              pack.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {pack.isActive ? '启用' : '禁用'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{pack.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 truncate flex-1 mr-2">
                              {pack.cost} {pack.currency} | 保底: {pack.pitySystem?.maxPity || 'N/A'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePack(pack.id);
                              }}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex-shrink-0"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">模版功能说明</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• <strong>模版定义卡片结构</strong>：通过JSON Schema定义卡片的属性字段和类型</p>
                    <p>• <strong>动态表单生成</strong>：编辑卡片时会根据选择的模版自动生成相应的输入字段</p>
                    <p>• <strong>支持多种数据类型</strong>：number（数字）、string（文本）、boolean（是/否）、enum（选择项）</p>
                    <p>• <strong>属性验证</strong>：可设置最小值、最大值、必填字段等验证规则</p>
                    <p>• <strong>自定义标题和描述</strong>：为每个字段设置友好的显示名称和帮助文本</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">模版列表</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => exportPartialData('cardTemplates')}
                      className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                    >
                      导出
                    </button>
                    <button
                      onClick={() => {
                        const newTemplate: CardTemplate = {
                          id: `custom-template-${Date.now()}`,
                          name: '新模版',
                          description: '自定义卡片模版',
                          schema: {
                            type: 'object',
                            properties: {
                              attack: { type: 'number', minimum: 0 },
                              defense: { type: 'number', minimum: 0 }
                            },
                            required: ['attack', 'defense']
                          },
                          createdAt: new Date(),
                          updatedAt: new Date()
                        };
                        setEditingTemplate(newTemplate);
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      新建
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-4 pl-2">
                  {templates.map(template => (
                    <div 
                      key={template.id} 
                      className={`bg-white rounded-lg p-3 shadow cursor-pointer transition-all hover:shadow-md relative ${
                        editingTemplate?.id === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      style={{
                        margin: editingTemplate?.id === template.id ? '2px' : '0',
                        transform: editingTemplate?.id === template.id ? 'scale(1.01)' : 'scale(1)'
                      }}
                      onClick={() => {
                        setEditingTemplate(template);
                        setJsonText(JSON.stringify(template.schema, null, 2));
                        setJsonError('');
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-500 text-xs">📋</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-sm truncate flex-1 mr-2">{template.name}</h3>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{template.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 truncate flex-1 mr-2">
                              {Object.keys(template.schema?.properties || {}).length} 个属性
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // 这里可以添加删除模板的逻辑
                              }}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex-shrink-0"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧编辑区域 */}
          <div className="lg:col-span-3">
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {activeTab === 'cards' && editingCard && renderCardEditor()}
              {activeTab === 'packs' && editingPack && renderPackEditor()}
              {activeTab === 'templates' && editingTemplate && renderTemplateEditor()}
              
              {((activeTab === 'cards' && !editingCard) || 
                (activeTab === 'packs' && !editingPack) || 
                (activeTab === 'templates' && !editingTemplate)) && (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">选择项目进行编辑</h3>
                  <p className="text-gray-600">
                    从左侧列表中选择一个项目来开始编辑
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 