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
  createdAt: Date;
  updatedAt: Date;
}

// 卡片模版
export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  schema: Record<string, any>;
  gameplayType: GameplayType;      // 玩法类型
  createdAt: Date;
  updatedAt: Date;
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