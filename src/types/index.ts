// 卡牌稀有度枚举
export enum CardRarity {
  N = 'N',
  R = 'R',
  SR = 'SR',
  SSR = 'SSR',
  UR = 'UR',
  LR = 'LR'
}

// 货币类型
export enum CurrencyType {
  GOLD = 'GOLD',
  TICKET = 'TICKET',
  PREMIUM = 'PREMIUM'
}

// 玩法类型枚举
export enum GameplayType {
  DEFAULT = 'DEFAULT',          // 默认玩法
  BATTLE = 'BATTLE',           // 战斗玩法
  COLLECTION = 'COLLECTION',   // 收集玩法
  STRATEGY = 'STRATEGY',       // 策略玩法
  ADVENTURE = 'ADVENTURE',     // 冒险玩法
  PUZZLE = 'PUZZLE'            // 解谜玩法
}

// 卡片模版
export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  schema: Record<string, any>;
  gameplayType: GameplayType;      // 玩法类型
  // 新增：技能关联配置
  skillBindings?: SkillBinding[];  // 可选的技能绑定配置
  createdAt: Date;
  updatedAt: Date;
}

// 新增：技能绑定配置接口
export interface SkillBinding {
  id: string;                      // 绑定ID
  name: string;                    // 绑定名称
  description: string;             // 绑定描述
  skillId: string;                 // 直接关联的技能实例ID
  skill?: Skill;                   // 直接关联的技能实例对象
  maxLevel: number;                // 最大等级
  unlockCondition?: SkillUnlockCondition; // 解锁条件
  attributes?: Record<string, any>; // 技能属性覆盖
}

// 卡牌类型
export interface Card {
  id: string;
  name: string;
  description: string;
  rarity: CardRarity;
  imageUrl: string;
  attributes: Record<string, any>;
  templateId: string;
  gameplayType: GameplayType;      // 玩法类型
  // 新增：技能关联
  skillBindings?: CardSkillBinding[]; // 卡片实际的技能绑定
  createdAt: Date;
  updatedAt: Date;
}

// 新增：卡片技能绑定接口
export interface CardSkillBinding {
  bindingId: string;               // 对应的模板绑定ID
  skillId: string;                 // 实际绑定的技能ID
  skill?: Skill;                   // 实际绑定的技能对象
  level: number;                   // 技能等级
  isUnlocked: boolean;             // 是否已解锁
  attributes?: Record<string, any>; // 技能属性值
}

// 保底机制配置
export interface PitySystem {
  maxPity: number;                    // 最大保底次数
  guaranteedCards: string[];          // 保底卡片池，可以是多张卡片中的任意一张
  guaranteedCardWeights?: number[];   // 保底卡片权重（可选，默认均等）
  softPityStart: number;              // 软保底开始次数
  resetOnTrigger: boolean;            // 触发保底后是否重置计数
  resetOnPackChange?: boolean;        // 切换卡包时是否重置计数（可选）
}

// 卡包配置
export interface CardPack {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string; // 卡包封面图片
  cost: number;
  currency: CurrencyType;
  isActive: boolean;
  gameplayType: GameplayType;        // 玩法类型
  // 每张卡片的具体概率分配（总和应为1.0）
  cardProbabilities: Record<string, number>;
  // 可用卡片列表
  availableCards: string[];
  // 保底系统
  pitySystem?: PitySystem;
  createdAt: Date;
  updatedAt: Date;
}

// 用户统计（聚合数据，不存储原始记录）
export interface UserStatistics {
  totalGachas: number;
  totalSpent: Record<CurrencyType, number>;
  cardsByRarity: Record<CardRarity, number>;
  gachaByRarity: Record<CardRarity, number>;
  packGachaSummary: {         // 卡包抽卡汇总（从历史记录聚合）
    packId: string;
    packName: string;
    packDescription: string;
    packCoverImageUrl?: string;
    currency: CurrencyType;
    cost: number;
    totalGachas: number;
    lastGachaAt?: Date;
  }[];
  lastGachaAt?: Date;
  pityCounters: Record<string, number>;
}

// 用户信息
export interface User {
  id: string;
  username: string;
  email: string;
  currencies: Record<CurrencyType, number>;
  statistics: UserStatistics;
  createdAt: Date;
  updatedAt: Date;
}

// 用户拥有的卡牌
export interface UserCard {
  id: string;
  userId: string;
  cardId: string;
  quantity: number;
  obtainedAt: Date;
  card?: Card;
}

// 抽卡请求
export interface GachaRequest {
  userId: string;
  packId: string;
  quantity: 1 | 10;
}

// 抽卡结果
export interface GachaResult {
  cards: Card[];
  newCards: Card[];
  duplicates: { card: Card; count: number }[];
  currencySpent: number;
  currencyType: CurrencyType;
  pityTriggered: boolean;
  timestamp: Date;
}

// 抽卡历史记录（持久化卡包信息）
export interface GachaHistory {
  id: string;
  userId: string;
  packId: string;
  packName: string;           // 持久化卡包名称
  packDescription: string;    // 持久化卡包描述
  packCoverImageUrl?: string; // 持久化卡包封面
  packCurrency: CurrencyType; // 持久化卡包货币类型
  packCost: number;           // 持久化卡包成本
  quantity: number;
  result: GachaResult;
  createdAt: Date;
}

// 统计数据
export interface Statistics {
  totalUsers: number;
  totalGachas: number;
  totalRevenue: Record<CurrencyType, number>;
  cardDistribution: Record<CardRarity, number>;
  popularPacks: { packId: string; count: number; name: string }[];
  userActivity: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

// 数据适配层接口
export interface DataAdapter {
  // 用户相关
  getUser(id: string): Promise<User | null>;
  updateUser(user: User): Promise<void>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  
  // 卡牌相关
  getCards(): Promise<Card[]>;
  getCard(id: string): Promise<Card | null>;
  updateCard(card: Card): Promise<void>;
  deleteCard(id: string): Promise<void>;
  getUserCards(userId: string): Promise<UserCard[]>;
  updateUserCard(userCard: UserCard): Promise<void>;
  // 新增：根据卡包ID获取该卡包内所有卡片
  getCardsByPackId(packId: string): Promise<Card[]>;
  // 新增：根据玩法类型过滤卡片
  getCardsByGameplayType(gameplayType: GameplayType): Promise<Card[]>;
  
  // 卡包相关
  getCardPacks(): Promise<CardPack[]>;
  getCardPack(id: string): Promise<CardPack | null>;
  updateCardPack(pack: CardPack): Promise<void>;
  deleteCardPack(id: string): Promise<void>;
  // 新增：根据玩法类型过滤卡包
  getCardPacksByGameplayType(gameplayType: GameplayType): Promise<CardPack[]>;
  
  // 抽卡相关
  performGacha(request: GachaRequest): Promise<GachaResult>;
  getGachaHistory(userId: string): Promise<GachaHistory[]>;
  
  // 统计相关
  getStatistics(): Promise<Statistics>;
  getUserStatistics(userId: string): Promise<UserStatistics>;
  updateUserStatisticsFromHistory(user: User): Promise<void>;
  // 新增：按玩法类型过滤的统计
  getStatisticsByGameplayType(gameplayType: GameplayType): Promise<Statistics>;
  getUserStatisticsByGameplayType(userId: string, gameplayType: GameplayType): Promise<UserStatistics>;
  
  // 配置相关
  getCardTemplates(): Promise<CardTemplate[]>;
  updateCardTemplate(template: CardTemplate): Promise<void>;
  // 新增：根据玩法类型过滤模板
  getCardTemplatesByGameplayType(gameplayType: GameplayType): Promise<CardTemplate[]>;
  
  // 技能绑定相关
  getSkillBindingsByTemplate(templateId: string): Promise<SkillBinding[]>;
  updateSkillBinding(templateId: string, binding: SkillBinding): Promise<void>;
  deleteSkillBinding(templateId: string, bindingId: string): Promise<void>;
  getCardSkillBindings(cardId: string): Promise<CardSkillBinding[]>;
  updateCardSkillBinding(cardId: string, binding: CardSkillBinding): Promise<void>;
  bindSkillToCard(cardId: string, bindingId: string, skillId: string): Promise<void>;
  unbindSkillFromCard(cardId: string, bindingId: string): Promise<void>;
  
  // 技能模板相关 - 为ECS准备
  getSkillTemplates(): Promise<SkillTemplate[]>;
  getSkillTemplate(id: string): Promise<SkillTemplate | null>;
  updateSkillTemplate(template: SkillTemplate): Promise<void>;
  deleteSkillTemplate(id: string): Promise<void>;
  getSkillTemplatesByGameplayType(gameplayType: GameplayType): Promise<SkillTemplate[]>;
  
  // 技能相关 - 为ECS准备
  getSkills(): Promise<Skill[]>;
  getSkill(id: string): Promise<Skill | null>;
  updateSkill(skill: Skill): Promise<void>;
  deleteSkill(id: string): Promise<void>;
  getSkillsByGameplayType(gameplayType: GameplayType): Promise<Skill[]>;
  getSkillsByType(skillType: SkillType): Promise<Skill[]>;
  
  // 用户技能相关 - 为ECS准备
  getUserSkills(userId: string): Promise<UserSkill[]>;
  updateUserSkill(userSkill: UserSkill): Promise<void>;
  unlockUserSkill(userId: string, skillId: string): Promise<void>;
  upgradeUserSkill(userId: string, skillId: string, experience: number): Promise<void>;
  
  // ECS组件数据 - 为未来ECS系统准备
  getSkillComponents(entityId: string): Promise<SkillComponent[]>;
  updateSkillComponent(component: SkillComponent): Promise<void>;
  getSkillEffects(entityId: string): Promise<SkillEffectComponent[]>;
  updateSkillEffect(effect: SkillEffectComponent): Promise<void>;
  getSkillSlotComponents(entityId: string): Promise<SkillSlotComponent[]>;
  updateSkillSlotComponent(component: SkillSlotComponent): Promise<void>;
  
  // 用户管理辅助方法
  getCurrentUser(): Promise<User | null>;
  setCurrentUser(userId: string): Promise<void>;
  logout(): Promise<void>;
  createDefaultUser(): Promise<User>;
}

// 组件Props类型
export interface CardProps {
  card: Card;
  onClick?: () => void;
  className?: string;
}

export interface GachaResultProps {
  result: GachaResult;
  onClose: () => void;
}

export interface UserCardListProps {
  cards: UserCard[];
  onCardClick?: (card: Card) => void;
}

export interface StatisticsProps {
  statistics: Statistics;
}

// 抽卡动画状态
export enum GachaAnimationState {
  IDLE = 'IDLE',
  SPINNING = 'SPINNING',
  REVEALING = 'REVEALING',
  COMPLETE = 'COMPLETE'
}

// 抽卡动画配置
export interface GachaAnimationConfig {
  duration: number;
  easing: string;
  stagger: number;
}

// 通知类型
export enum NotificationType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

// 通知消息
export interface NotificationMessage {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

// 错误类型
export enum ErrorType {
  INSUFFICIENT_CURRENCY = 'INSUFFICIENT_CURRENCY',
  CARD_PACK_NOT_FOUND = 'CARD_PACK_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  NO_AVAILABLE_CARDS = 'NO_AVAILABLE_CARDS',
  INVALID_PROBABILITY = 'INVALID_PROBABILITY',
  PITY_SYSTEM_ERROR = 'PITY_SYSTEM_ERROR',
  DATA_CORRUPTION = 'DATA_CORRUPTION'
}

export interface GachaError {
  type: ErrorType;
  message: string;
  details?: any;
}

// ==================== 技能系统类型定义 ====================

// 技能稀有度枚举
export enum SkillRarity {
  N = 'N',      // 普通
  R = 'R',      // 稀有
  SR = 'SR',    // 超稀有
  SSR = 'SSR',  // 特超稀有
  UR = 'UR',    // 超特稀有
  LR = 'LR'     // 传说
}

// 技能类型枚举
export enum SkillType {
  ATTACK = 'ATTACK',           // 攻击技能
  DEFENSE = 'DEFENSE',         // 防御技能
  SUPPORT = 'SUPPORT',         // 辅助技能
  HEAL = 'HEAL',              // 治疗技能
  BUFF = 'BUFF',              // 增益技能
  DEBUFF = 'DEBUFF',          // 减益技能
  SPECIAL = 'SPECIAL'         // 特殊技能
}

// 技能目标类型
export enum SkillTargetType {
  SELF = 'SELF',                 // 自身
  SINGLE_ENEMY = 'SINGLE_ENEMY', // 单个敌人
  ALL_ENEMIES = 'ALL_ENEMIES',   // 所有敌人
  SINGLE_ALLY = 'SINGLE_ALLY',   // 单个盟友
  ALL_ALLIES = 'ALL_ALLIES',     // 所有盟友
  AREA = 'AREA',                 // 区域效果
  RANDOM = 'RANDOM'              // 随机目标
}

// 技能效果类型
export enum SkillEffectType {
  DAMAGE = 'DAMAGE',             // 伤害
  HEAL = 'HEAL',                 // 治疗
  BUFF_ATTACK = 'BUFF_ATTACK',   // 攻击增益
  BUFF_DEFENSE = 'BUFF_DEFENSE', // 防御增益
  DEBUFF_ATTACK = 'DEBUFF_ATTACK', // 攻击减益
  DEBUFF_DEFENSE = 'DEBUFF_DEFENSE', // 防御减益
  STUN = 'STUN',                 // 眩晕
  SILENCE = 'SILENCE',           // 沉默
  DOT = 'DOT',                   // 持续伤害
  HOT = 'HOT',                   // 持续治疗
  SHIELD = 'SHIELD',             // 护盾
  CLEANSE = 'CLEANSE'            // 净化
}

// 技能状态枚举
export enum SkillState {
  READY = 'READY',           // 准备就绪
  COOLDOWN = 'COOLDOWN',     // 冷却中
  CASTING = 'CASTING',       // 施法中
  DISABLED = 'DISABLED'      // 禁用（未装备、等级不足等）
}

// 技能效果定义
export interface SkillEffectDefinition {
  type: SkillEffectType;
  target: SkillTargetType;
  duration: number | 'instant';   // 持续时间或即时效果
  magnitude: {
    base: number;                 // 基础值
    scaling: number;              // 等级缩放
    attribute?: string;           // 关联属性（如攻击力）
  };
  conditions?: SkillCondition[];  // 触发条件
}

// 技能条件
export interface SkillCondition {
  type: 'health_percentage' | 'mana_percentage' | 'has_buff' | 'has_debuff';
  value: number | string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
}

// 技能解锁条件
export interface SkillUnlockCondition {
  type: 'level' | 'skill_mastery' | 'item_required' | 'quest_completed';
  value: number | string;
  description: string;
}

// 技能模板接口
export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  skillType: SkillType;
  
  // ECS系统相关字段
  targetType: SkillTargetType;    // 目标类型
  range: number;                  // 技能范围
  castTime: number;               // 施法时间
  cooldown: number;               // 基础冷却时间
  manaCost: number;               // 基础魔法消耗
  
  // 效果定义
  effects: SkillEffectDefinition[];
  
  // 属性schema - 保持与现有卡片模板兼容
  schema: Record<string, any>;
  gameplayType: GameplayType;
  createdAt: Date;
  updatedAt: Date;
}

// 技能接口
export interface Skill {
  id: string;
  name: string;
  description: string;
  rarity: SkillRarity;
  skillType: SkillType;
  iconUrl: string;
  
  // 关联模板
  templateId: string;
  
  // ECS系统属性 - 基于模板schema
  attributes: Record<string, any>;
  
  // 技能等级相关
  maxLevel: number;
  levelScaling: Record<string, number>; // 等级缩放系数
  
  // 解锁条件
  unlockConditions: SkillUnlockCondition[];
  
  gameplayType: GameplayType;
  createdAt: Date;
  updatedAt: Date;
}

// 用户技能接口
export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  level: number;               // 技能等级
  experience: number;          // 技能经验
  isUnlocked: boolean;         // 是否已解锁
  obtainedAt: Date;
  skill?: Skill;
}

// ECS组件接口
export interface SkillComponent {
  entityId: string;           // 实体ID
  skillId: string;            // 技能ID
  level: number;              // 技能等级
  cooldown: number;           // 冷却时间
  manaCost: number;           // 魔法消耗
  lastUsedAt?: Date;          // 上次使用时间
}

export interface SkillSlotComponent {
  entityId: string;           // 实体ID
  slots: SkillSlot[];         // 技能槽位
  maxSlots: number;           // 最大槽位数
}

export interface SkillSlot {
  slotId: string;
  skillId?: string;           // 装备的技能ID（undefined表示未装备）
  isLocked: boolean;          // 是否锁定
  unlockLevel: number;        // 解锁等级
}

export interface SkillEffectComponent {
  entityId: string;           // 目标实体ID
  skillId: string;            // 来源技能ID
  effectType: SkillEffectType; // 效果类型
  duration: number;           // 持续时间
  magnitude: number;          // 效果强度
  startTime: Date;            // 开始时间
  endTime: Date;              // 结束时间
}

export interface CastingComponent {
  entityId: string;
  skillId: string;
  startTime: Date;
  endTime: Date;
  targetId?: string;
} 