import { 
  DataAdapter, 
  User, 
  Card, 
  UserCard, 
  CardPack, 
  GachaRequest, 
  GachaResult, 
  GachaHistory, 
  Statistics, 
  UserStatistics, 
  CardTemplate, 
  CardRarity, 
  CurrencyType,
  GameplayType,
  ErrorType,
  GachaError,
  SkillTemplate,
  Skill,
  UserSkill,
  SkillComponent,
  SkillEffectComponent,
  SkillSlotComponent,
  SkillType,
  SkillRarity,
  SkillTargetType,
  SkillEffectType,
  SkillBinding,
  CardSkillBinding
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export class LocalStorageAdapter implements DataAdapter {
  private readonly STORAGE_KEYS = {
    USERS: 'gacha_users',
    CARDS: 'gacha_cards',
    USER_CARDS: 'gacha_user_cards',
    CARD_PACKS: 'gacha_card_packs',
    GACHA_HISTORY: 'gacha_history',
    CARD_TEMPLATES: 'gacha_card_templates',
    CURRENT_USER: 'gacha_current_user',
    PITY_COUNTERS: 'gacha_pity_counters',
    // 技能系统相关
    SKILL_TEMPLATES: 'gacha_skill_templates',
    SKILLS: 'gacha_skills',
    USER_SKILLS: 'gacha_user_skills',
    SKILL_COMPONENTS: 'gacha_skill_components',
    SKILL_EFFECTS: 'gacha_skill_effects',
    SKILL_SLOT_COMPONENTS: 'gacha_skill_slot_components'
  };

  // 概率验证容差
  private readonly PROBABILITY_TOLERANCE = 0.001;

  // 缓存系统
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = {
    STATISTICS: 5 * 60 * 1000,      // 5分钟
    USER_STATISTICS: 2 * 60 * 1000, // 2分钟
    CARDS: 10 * 60 * 1000,          // 10分钟
    PACKS: 10 * 60 * 1000,          // 10分钟
    TEMPLATES: 30 * 60 * 1000       // 30分钟
  };

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // 初始化默认数据
    if (!this.getFromStorage(this.STORAGE_KEYS.USERS)) {
      this.setToStorage(this.STORAGE_KEYS.USERS, []);
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.CARDS)) {
      this.initializeCards();
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.USER_CARDS)) {
      this.setToStorage(this.STORAGE_KEYS.USER_CARDS, []);
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.CARD_PACKS)) {
      this.initializeCardPacks();
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.GACHA_HISTORY)) {
      this.setToStorage(this.STORAGE_KEYS.GACHA_HISTORY, []);
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.CARD_TEMPLATES)) {
      this.initializeCardTemplates();
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.PITY_COUNTERS)) {
      this.setToStorage(this.STORAGE_KEYS.PITY_COUNTERS, {});
    }

    // 技能系统初始化
    if (!this.getFromStorage(this.STORAGE_KEYS.SKILL_TEMPLATES)) {
      this.initializeSkillTemplates();
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.SKILLS)) {
      this.initializeSkills();
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.USER_SKILLS)) {
      this.setToStorage(this.STORAGE_KEYS.USER_SKILLS, []);
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.SKILL_COMPONENTS)) {
      this.setToStorage(this.STORAGE_KEYS.SKILL_COMPONENTS, []);
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.SKILL_EFFECTS)) {
      this.setToStorage(this.STORAGE_KEYS.SKILL_EFFECTS, []);
    }
    if (!this.getFromStorage(this.STORAGE_KEYS.SKILL_SLOT_COMPONENTS)) {
      this.setToStorage(this.STORAGE_KEYS.SKILL_SLOT_COMPONENTS, []);
    }

    // 数据迁移：确保现有用户有gachaByRarity字段
    this.migrateUserStatistics();
  }

  private migrateUserStatistics() {
    const users = this.getFromStorage<User[]>(this.STORAGE_KEYS.USERS) || [];
    let hasChanges = false;

    users.forEach(user => {
      if (!user.statistics.gachaByRarity) {
        user.statistics.gachaByRarity = {
          [CardRarity.N]: 0,
          [CardRarity.R]: 0,
          [CardRarity.SR]: 0,
          [CardRarity.SSR]: 0,
          [CardRarity.UR]: 0,
          [CardRarity.LR]: 0
        };
        hasChanges = true;
      }
      if (!user.statistics.packGachaSummary) {
        user.statistics.packGachaSummary = [];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.setToStorage(this.STORAGE_KEYS.USERS, users);
    }
  }

  private getFromStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error);
      return null;
    }
  }

  private setToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing to localStorage key ${key}:`, error);
    }
  }

  // 概率验证方法
  private validateCardProbabilities(pack: CardPack): void {
    const availableCards = pack.availableCards;
    const probabilities = pack.cardProbabilities;
    
    // 检查所有可用卡片都有概率
    for (const cardId of availableCards) {
      if (!(cardId in probabilities)) {
        throw {
          type: ErrorType.INVALID_PROBABILITY,
          message: `Card ${cardId} is available but has no probability assigned`,
          details: { cardId, availableCards, probabilities }
        } as GachaError;
      }
    }
    
    // 检查概率总和是否为1.0（允许容差）
    const totalProbability = availableCards.reduce((sum, cardId) => {
      const prob = probabilities[cardId];
      if (prob < 0 || prob > 1) {
        throw {
          type: ErrorType.INVALID_PROBABILITY,
          message: `Invalid probability value for card ${cardId}: ${prob}`,
          details: { cardId, probability: prob }
        } as GachaError;
      }
      return sum + prob;
    }, 0);
    
    if (Math.abs(totalProbability - 1.0) > this.PROBABILITY_TOLERANCE) {
      throw {
        type: ErrorType.INVALID_PROBABILITY,
        message: `Total probability must be 1.0, got ${totalProbability.toFixed(4)}`,
        details: { totalProbability, availableCards, probabilities }
      } as GachaError;
    }
  }

  // 缓存管理方法
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setToCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // 保底系统验证
  private validatePitySystem(pack: CardPack): void {
    if (!pack.pitySystem) return;
    
    const { pitySystem } = pack;
    
    // 检查保底卡片是否在可用卡片中
    for (const cardId of pitySystem.guaranteedCards) {
      if (!pack.availableCards.includes(cardId)) {
        throw {
          type: ErrorType.PITY_SYSTEM_ERROR,
          message: `Guaranteed card ${cardId} is not in available cards`,
          details: { cardId, availableCards: pack.availableCards, guaranteedCards: pitySystem.guaranteedCards }
        } as GachaError;
      }
    }
    
    // 检查保底权重（如果提供）
    if (pitySystem.guaranteedCardWeights) {
      if (pitySystem.guaranteedCardWeights.length !== pitySystem.guaranteedCards.length) {
        throw {
          type: ErrorType.PITY_SYSTEM_ERROR,
          message: 'Guaranteed card weights length must match guaranteed cards length',
          details: { 
            weightsLength: pitySystem.guaranteedCardWeights.length, 
            cardsLength: pitySystem.guaranteedCards.length 
          }
        } as GachaError;
      }
      
      // 检查权重是否为正数
      for (let i = 0; i < pitySystem.guaranteedCardWeights.length; i++) {
        if (pitySystem.guaranteedCardWeights[i] <= 0) {
          throw {
            type: ErrorType.PITY_SYSTEM_ERROR,
            message: `Invalid weight for guaranteed card ${pitySystem.guaranteedCards[i]}: ${pitySystem.guaranteedCardWeights[i]}`,
            details: { cardId: pitySystem.guaranteedCards[i], weight: pitySystem.guaranteedCardWeights[i] }
          } as GachaError;
        }
      }
    }
  }

  // 用户相关
  async getUser(id: string): Promise<User | null> {
    const users = this.getFromStorage<User[]>(this.STORAGE_KEYS.USERS) || [];
    return users.find(user => user.id === id) || null;
  }

  async updateUser(user: User): Promise<void> {
    const users = this.getFromStorage<User[]>(this.STORAGE_KEYS.USERS) || [];
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = { ...user, updatedAt: new Date() };
      this.setToStorage(this.STORAGE_KEYS.USERS, users);
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const users = this.getFromStorage<User[]>(this.STORAGE_KEYS.USERS) || [];
    const newUser: User = {
      ...userData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(newUser);
    this.setToStorage(this.STORAGE_KEYS.USERS, users);
    return newUser;
  }

  // 卡牌相关
  async getCards(): Promise<Card[]> {
    const cacheKey = 'cards';
    const cached = this.getFromCache<Card[]>(cacheKey);
    if (cached) return cached;
    
    const cards = this.getFromStorage<Card[]>(this.STORAGE_KEYS.CARDS) || [];
    this.setToCache(cacheKey, cards, this.CACHE_TTL.CARDS);
    return cards;
  }

  async getCard(id: string): Promise<Card | null> {
    const cards = await this.getCards();
    return cards.find(card => card.id === id) || null;
  }

  async updateCard(card: Card): Promise<void> {
    const cards = await this.getCards();
    const index = cards.findIndex(c => c.id === card.id);
    if (index !== -1) {
      cards[index] = { ...card, updatedAt: new Date() };
    } else {
      cards.push({ ...card, createdAt: new Date(), updatedAt: new Date() });
    }
    this.setToStorage(this.STORAGE_KEYS.CARDS, cards);
    this.invalidateCache('cards');
  }

  async deleteCard(id: string): Promise<void> {
    const cards = await this.getCards();
    const filteredCards = cards.filter(c => c.id !== id);
    this.setToStorage(this.STORAGE_KEYS.CARDS, filteredCards);
    this.invalidateCache('cards');
  }

  async getUserCards(userId: string): Promise<UserCard[]> {
    const userCards = this.getFromStorage<UserCard[]>(this.STORAGE_KEYS.USER_CARDS) || [];
    const filteredCards = userCards.filter(uc => uc.userId === userId);
    
    // 补充卡牌信息
    const cards = await this.getCards();
    return filteredCards.map(uc => ({
      ...uc,
      card: cards.find(c => c.id === uc.cardId)
    }));
  }

  async updateUserCard(userCard: UserCard): Promise<void> {
    const userCards = this.getFromStorage<UserCard[]>(this.STORAGE_KEYS.USER_CARDS) || [];
    const index = userCards.findIndex(uc => uc.id === userCard.id);
    if (index !== -1) {
      userCards[index] = userCard;
    } else {
      userCards.push(userCard);
    }
    this.setToStorage(this.STORAGE_KEYS.USER_CARDS, userCards);
  }

  // 卡包相关
  async getCardPacks(): Promise<CardPack[]> {
    const cacheKey = 'packs';
    const cached = this.getFromCache<CardPack[]>(cacheKey);
    if (cached) return cached;
    
    const packs = this.getFromStorage<CardPack[]>(this.STORAGE_KEYS.CARD_PACKS) || [];
    this.setToCache(cacheKey, packs, this.CACHE_TTL.PACKS);
    return packs;
  }

  async getCardPack(id: string): Promise<CardPack | null> {
    const packs = await this.getCardPacks();
    return packs.find(pack => pack.id === id) || null;
  }

  async updateCardPack(pack: CardPack): Promise<void> {
    // 验证卡包数据
    this.validateCardProbabilities(pack);
    this.validatePitySystem(pack);
    
    const packs = await this.getCardPacks();
    const index = packs.findIndex(p => p.id === pack.id);
    if (index !== -1) {
      packs[index] = { ...pack, updatedAt: new Date() };
    } else {
      packs.push({ ...pack, createdAt: new Date(), updatedAt: new Date() });
    }
    this.setToStorage(this.STORAGE_KEYS.CARD_PACKS, packs);
    this.invalidateCache('packs');
  }

  async deleteCardPack(id: string): Promise<void> {
    const packs = await this.getCardPacks();
    const filteredPacks = packs.filter(p => p.id !== id);
    this.setToStorage(this.STORAGE_KEYS.CARD_PACKS, filteredPacks);
    this.invalidateCache('packs');
  }

  // 抽卡相关
  async performGacha(request: GachaRequest): Promise<GachaResult> {
    const pack = await this.getCardPack(request.packId);
    if (!pack) {
      throw {
        type: ErrorType.CARD_PACK_NOT_FOUND,
        message: `Card pack ${request.packId} not found`,
        details: { packId: request.packId }
      } as GachaError;
    }

    const user = await this.getUser(request.userId);
    if (!user) {
      throw {
        type: ErrorType.USER_NOT_FOUND,
        message: `User ${request.userId} not found`,
        details: { userId: request.userId }
      } as GachaError;
    }

    // 检查货币是否足够
    const totalCost = pack.cost * request.quantity;
    if (user.currencies[pack.currency] < totalCost) {
      throw {
        type: ErrorType.INSUFFICIENT_CURRENCY,
        message: `Insufficient currency. Required: ${totalCost} ${pack.currency}, Available: ${user.currencies[pack.currency]}`,
        details: { 
          required: totalCost, 
          available: user.currencies[pack.currency], 
          currency: pack.currency 
        }
      } as GachaError;
    }

    // 获取保底计数
    const pityCounters = this.getFromStorage<Record<string, Record<string, number>>>(this.STORAGE_KEYS.PITY_COUNTERS) || {};
    const userPityCounters = pityCounters[request.userId] || {};
    let currentPity = userPityCounters[request.packId] || 0;

    // 执行抽卡
    const cards: Card[] = [];
    let pityTriggered = false;

    for (let i = 0; i < request.quantity; i++) {
      const result = await this.drawSingleCard(pack, currentPity);
      cards.push(result.card);
      
      if (result.pityTriggered) {
        pityTriggered = true;
        currentPity = 0;
      } else {
        currentPity++;
      }
    }

    // 更新保底计数
    if (!pityCounters[request.userId]) {
      pityCounters[request.userId] = {};
    }
    pityCounters[request.userId][request.packId] = currentPity;
    this.setToStorage(this.STORAGE_KEYS.PITY_COUNTERS, pityCounters);

    // 处理重复卡牌
    const { newCards, duplicates } = await this.processDuplicates(request.userId, cards);

    // 扣除货币
    user.currencies[pack.currency] -= totalCost;
    
    // 更新用户统计
    user.statistics.totalGachas += request.quantity;
    user.statistics.totalSpent[pack.currency] += totalCost;
    user.statistics.lastGachaAt = new Date();
    
    // 更新卡牌统计
    cards.forEach(card => {
      user.statistics.cardsByRarity[card.rarity] = (user.statistics.cardsByRarity[card.rarity] || 0) + 1;
      user.statistics.gachaByRarity[card.rarity] = (user.statistics.gachaByRarity[card.rarity] || 0) + 1;
    });

    await this.updateUser(user);

    // 创建抽卡结果
    const result: GachaResult = {
      cards,
      newCards,
      duplicates,
      currencySpent: totalCost,
      currencyType: pack.currency,
      pityTriggered,
      timestamp: new Date()
    };

    // 记录抽卡历史（持久化卡包信息）
    await this.recordGachaHistory(request.userId, request.packId, request.quantity, result, pack);

    // 清除相关缓存
    this.invalidateCache('global_statistics');
    this.invalidateCache(`user_statistics_${request.userId}`);

    return result;
  }

  private async drawSingleCard(pack: CardPack, currentPity: number): Promise<{ card: Card; pityTriggered: boolean }> {
    let pityTriggered = false;
    
    // 检查是否触发保底
    if (pack.pitySystem && currentPity >= pack.pitySystem.maxPity) {
      pityTriggered = true;
      const card = await this.getRandomGuaranteedCard(pack);
      return { card, pityTriggered };
    }

    // 按卡片概率抽取
    const card = await this.drawCardByProbability(pack, currentPity);
    
    return { card, pityTriggered };
  }

  private async drawCardByProbability(pack: CardPack, currentPity: number): Promise<Card> {
    let random = Math.random();
    
    // 应用软保底逻辑
    if (pack.pitySystem && currentPity >= pack.pitySystem.softPityStart) {
      const pityBonus = this.calculatePityBonus(currentPity, pack.pitySystem.softPityStart, pack.pitySystem.maxPity);
      // 软保底增加高稀有度卡片的概率
      random = random * (1 - pityBonus * 0.5);
    }

    // 按卡片概率抽取
    const cardEntries = Object.entries(pack.cardProbabilities)
      .filter(([cardId]) => pack.availableCards.includes(cardId))
      .sort(([, a], [, b]) => b - a);

    let cumulativeProbability = 0;
    for (const [cardId, probability] of cardEntries) {
      cumulativeProbability += probability;
      if (random <= cumulativeProbability) {
        const card = await this.getCard(cardId);
        if (card) {
          return card;
        }
      }
    }

    // 如果没有抽到任何卡片，返回第一张可用卡片
    const firstAvailableCard = await this.getCard(pack.availableCards[0]);
    if (!firstAvailableCard) {
      throw {
        type: ErrorType.NO_AVAILABLE_CARDS,
        message: `No available cards in pack ${pack.id}`,
        details: { packId: pack.id, availableCards: pack.availableCards }
      } as GachaError;
    }
    return firstAvailableCard;
  }

  private calculatePityBonus(currentPity: number, softPityStart: number, maxPity: number): number {
    const progress = (currentPity - softPityStart) / (maxPity - softPityStart);
    return Math.min(progress * 0.5, 0.5);
  }



  private async getRandomGuaranteedCard(pack: CardPack): Promise<Card> {
    if (!pack.pitySystem || pack.pitySystem.guaranteedCards.length === 0) {
      throw {
        type: ErrorType.PITY_SYSTEM_ERROR,
        message: `No guaranteed cards configured for pack ${pack.id}`,
        details: { packId: pack.id, pitySystem: pack.pitySystem }
      } as GachaError;
    }

    // 使用权重选择保底卡片（如果提供权重）
    let selectedCardId: string;
    if (pack.pitySystem.guaranteedCardWeights && pack.pitySystem.guaranteedCardWeights.length > 0) {
      // 按权重随机选择
      const totalWeight = pack.pitySystem.guaranteedCardWeights.reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;
      
      for (let i = 0; i < pack.pitySystem.guaranteedCards.length; i++) {
        random -= pack.pitySystem.guaranteedCardWeights[i];
        if (random <= 0) {
          selectedCardId = pack.pitySystem.guaranteedCards[i];
          break;
        }
      }
      selectedCardId = pack.pitySystem.guaranteedCards[pack.pitySystem.guaranteedCards.length - 1];
    } else {
      // 均等概率选择
      const randomIndex = Math.floor(Math.random() * pack.pitySystem.guaranteedCards.length);
      selectedCardId = pack.pitySystem.guaranteedCards[randomIndex];
    }

    const card = await this.getCard(selectedCardId);
    
    if (!card) {
      throw {
        type: ErrorType.PITY_SYSTEM_ERROR,
        message: `Guaranteed card ${selectedCardId} not found in pack ${pack.id}`,
        details: { cardId: selectedCardId, packId: pack.id }
      } as GachaError;
    }
    
    return card;
  }

  private async processDuplicates(
    userId: string,
    cards: Card[]
  ): Promise<{ newCards: Card[]; duplicates: { card: Card; count: number }[] }> {
    const userCards = await this.getUserCards(userId);
    const existingCardIds = new Set(userCards.map(uc => uc.cardId));
    
    const cardCounts = new Map<string, number>();
    const uniqueCards = new Map<string, Card>();

    cards.forEach(card => {
      cardCounts.set(card.id, (cardCounts.get(card.id) || 0) + 1);
      uniqueCards.set(card.id, card);
    });

    const newCards: Card[] = [];
    const duplicates: { card: Card; count: number }[] = [];

    for (const [cardId, count] of cardCounts) {
      const card = uniqueCards.get(cardId)!;
      
      if (existingCardIds.has(cardId)) {
        duplicates.push({ card, count });
        // 更新已有卡牌数量
        const existingUserCard = userCards.find(uc => uc.cardId === cardId);
        if (existingUserCard) {
          existingUserCard.quantity += count;
          await this.updateUserCard(existingUserCard);
        }
      } else {
        newCards.push(card);
        // 创建新的用户卡牌
        const newUserCard: UserCard = {
          id: uuidv4(),
          userId,
          cardId,
          quantity: count,
          obtainedAt: new Date()
        };
        await this.updateUserCard(newUserCard);
      }
    }

    return { newCards, duplicates };
  }

  private async recordGachaHistory(
    userId: string,
    packId: string,
    quantity: number,
    result: GachaResult,
    pack: CardPack
  ): Promise<void> {
    const history = this.getFromStorage<GachaHistory[]>(this.STORAGE_KEYS.GACHA_HISTORY) || [];
    const newRecord: GachaHistory = {
      id: uuidv4(),
      userId,
      packId,
      packName: pack.name,
      packDescription: pack.description,
      packCoverImageUrl: pack.coverImageUrl,
      packCurrency: pack.currency,
      packCost: pack.cost,
      quantity,
      result,
      createdAt: new Date()
    };
    history.push(newRecord);
    this.setToStorage(this.STORAGE_KEYS.GACHA_HISTORY, history);
  }

  async getGachaHistory(userId: string): Promise<GachaHistory[]> {
    const history = this.getFromStorage<GachaHistory[]>(this.STORAGE_KEYS.GACHA_HISTORY) || [];
    return history.filter(h => h.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // 统计相关
  async getStatistics(): Promise<Statistics> {
    const cacheKey = 'global_statistics';
    const cached = this.getFromCache<Statistics>(cacheKey);
    if (cached) return cached;
    
    const users = this.getFromStorage<User[]>(this.STORAGE_KEYS.USERS) || [];
    const history = this.getFromStorage<GachaHistory[]>(this.STORAGE_KEYS.GACHA_HISTORY) || [];
    const packs = await this.getCardPacks();

    const totalUsers = users.length;
    const totalGachas = history.reduce((sum, h) => sum + h.quantity, 0);
    
    const totalRevenue: Record<CurrencyType, number> = {
      [CurrencyType.GOLD]: 0,
      [CurrencyType.TICKET]: 0,
      [CurrencyType.PREMIUM]: 0
    };

    const cardDistribution: Record<CardRarity, number> = {
      [CardRarity.N]: 0,
      [CardRarity.R]: 0,
      [CardRarity.SR]: 0,
      [CardRarity.SSR]: 0,
      [CardRarity.UR]: 0,
      [CardRarity.LR]: 0
    };

    history.forEach(h => {
      totalRevenue[h.result.currencyType] += h.result.currencySpent;
      h.result.cards.forEach(card => {
        cardDistribution[card.rarity]++;
      });
    });

    const packCounts = new Map<string, number>();
    history.forEach(h => {
      packCounts.set(h.packId, (packCounts.get(h.packId) || 0) + 1);
    });

    const popularPacks = Array.from(packCounts.entries())
      .map(([packId, count]) => ({
        packId,
        count,
        name: packs.find(p => p.id === packId)?.name || 'Unknown'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 简化的活跃度统计
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const userActivity = {
      daily: users.filter(u => u.statistics.lastGachaAt && new Date(u.statistics.lastGachaAt) > oneDayAgo).length,
      weekly: users.filter(u => u.statistics.lastGachaAt && new Date(u.statistics.lastGachaAt) > oneWeekAgo).length,
      monthly: users.filter(u => u.statistics.lastGachaAt && new Date(u.statistics.lastGachaAt) > oneMonthAgo).length
    };

    const statistics = {
      totalUsers,
      totalGachas,
      totalRevenue,
      cardDistribution,
      popularPacks,
      userActivity
    };
    
    this.setToCache(cacheKey, statistics, this.CACHE_TTL.STATISTICS);
    return statistics;
  }

  async getUserStatistics(userId: string): Promise<UserStatistics> {
    const cacheKey = `user_statistics_${userId}`;
    const cached = this.getFromCache<UserStatistics>(cacheKey);
    if (cached) return cached;
    
    const user = await this.getUser(userId);
    if (!user) {
      throw {
        type: ErrorType.USER_NOT_FOUND,
        message: `User ${userId} not found`,
        details: { userId }
      } as GachaError;
    }
    
    // 从历史记录聚合统计信息
    await this.updateUserStatisticsFromHistory(user);
    
    this.setToCache(cacheKey, user.statistics, this.CACHE_TTL.USER_STATISTICS);
    return user.statistics;
  }

  async getStatisticsByGameplayType(gameplayType: GameplayType): Promise<Statistics> {
    const cacheKey = `global_statistics_${gameplayType}`;
    const cached = this.getFromCache<Statistics>(cacheKey);
    if (cached) return cached;
    
    const users = this.getFromStorage<User[]>(this.STORAGE_KEYS.USERS) || [];
    const history = this.getFromStorage<GachaHistory[]>(this.STORAGE_KEYS.GACHA_HISTORY) || [];
    const packs = await this.getCardPacksByGameplayType(gameplayType);
    const packIds = new Set(packs.map(p => p.id));

    // 只统计指定玩法类型的卡包历史记录
    const filteredHistory = history.filter(h => packIds.has(h.packId));

    const totalUsers = users.length;
    const totalGachas = filteredHistory.reduce((sum, h) => sum + h.quantity, 0);
    
    const totalRevenue: Record<CurrencyType, number> = {
      [CurrencyType.GOLD]: 0,
      [CurrencyType.TICKET]: 0,
      [CurrencyType.PREMIUM]: 0
    };

    const cardDistribution: Record<CardRarity, number> = {
      [CardRarity.N]: 0,
      [CardRarity.R]: 0,
      [CardRarity.SR]: 0,
      [CardRarity.SSR]: 0,
      [CardRarity.UR]: 0,
      [CardRarity.LR]: 0
    };

    filteredHistory.forEach(h => {
      totalRevenue[h.result.currencyType] += h.result.currencySpent;
      h.result.cards.forEach(card => {
        cardDistribution[card.rarity]++;
      });
    });

    const packCounts = new Map<string, number>();
    filteredHistory.forEach(h => {
      packCounts.set(h.packId, (packCounts.get(h.packId) || 0) + 1);
    });

    const popularPacks = Array.from(packCounts.entries())
      .map(([packId, count]) => ({
        packId,
        count,
        name: packs.find(p => p.id === packId)?.name || 'Unknown'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 简化的活跃度统计（基于该玩法类型的抽卡活动）
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const userActivity = {
      daily: filteredHistory.filter(h => new Date(h.createdAt) > oneDayAgo).map(h => h.userId).filter((v, i, a) => a.indexOf(v) === i).length,
      weekly: filteredHistory.filter(h => new Date(h.createdAt) > oneWeekAgo).map(h => h.userId).filter((v, i, a) => a.indexOf(v) === i).length,
      monthly: filteredHistory.filter(h => new Date(h.createdAt) > oneMonthAgo).map(h => h.userId).filter((v, i, a) => a.indexOf(v) === i).length
    };

    const statistics = {
      totalUsers,
      totalGachas,
      totalRevenue,
      cardDistribution,
      popularPacks,
      userActivity
    };
    
    this.setToCache(cacheKey, statistics, this.CACHE_TTL.STATISTICS);
    return statistics;
  }

  async getUserStatisticsByGameplayType(userId: string, gameplayType: GameplayType): Promise<UserStatistics> {
    const cacheKey = `user_statistics_${userId}_${gameplayType}`;
    const cached = this.getFromCache<UserStatistics>(cacheKey);
    if (cached) return cached;
    
    const user = await this.getUser(userId);
    if (!user) {
      throw {
        type: ErrorType.USER_NOT_FOUND,
        message: `User ${userId} not found`,
        details: { userId }
      } as GachaError;
    }

    // 获取用户的抽卡历史记录
    const allHistory = await this.getGachaHistory(userId);
    const packs = await this.getCardPacksByGameplayType(gameplayType);
    const packIds = new Set(packs.map(p => p.id));
    
    // 只统计指定玩法类型的卡包历史记录
    const filteredHistory = allHistory.filter(h => packIds.has(h.packId));

    // 初始化统计数据
    const statistics: UserStatistics = {
      totalGachas: 0,
      totalSpent: {
        [CurrencyType.GOLD]: 0,
        [CurrencyType.TICKET]: 0,
        [CurrencyType.PREMIUM]: 0
      },
      cardsByRarity: {
        [CardRarity.N]: 0,
        [CardRarity.R]: 0,
        [CardRarity.SR]: 0,
        [CardRarity.SSR]: 0,
        [CardRarity.UR]: 0,
        [CardRarity.LR]: 0
      },
      gachaByRarity: {
        [CardRarity.N]: 0,
        [CardRarity.R]: 0,
        [CardRarity.SR]: 0,
        [CardRarity.SSR]: 0,
        [CardRarity.UR]: 0,
        [CardRarity.LR]: 0
      },
      pityCounters: {},
      packGachaSummary: []
    };

    // 聚合卡包统计
    const packStats = new Map<string, {
      packId: string;
      packName: string;
      packDescription: string;
      packCoverImageUrl?: string;
      currency: CurrencyType;
      cost: number;
      totalGachas: number;
      lastGachaAt?: Date;
    }>();

    // 从过滤后的历史记录聚合数据
    filteredHistory.forEach(record => {
      statistics.totalGachas += record.quantity;
      statistics.totalSpent[record.packCurrency] += record.result.currencySpent;
      
      record.result.cards.forEach(card => {
        statistics.cardsByRarity[card.rarity]++;
        statistics.gachaByRarity[card.rarity]++;
      });
      
      const existing = packStats.get(record.packId);
      if (existing) {
        existing.totalGachas += record.quantity;
        if (!existing.lastGachaAt || new Date(record.createdAt) > new Date(existing.lastGachaAt)) {
          existing.lastGachaAt = record.createdAt;
        }
      } else {
        packStats.set(record.packId, {
          packId: record.packId,
          packName: record.packName,
          packDescription: record.packDescription,
          packCoverImageUrl: record.packCoverImageUrl,
          currency: record.packCurrency,
          cost: record.packCost,
          totalGachas: record.quantity,
          lastGachaAt: record.createdAt
        });
      }
      
      if (!statistics.lastGachaAt || new Date(record.createdAt) > new Date(statistics.lastGachaAt)) {
        statistics.lastGachaAt = record.createdAt;
      }
    });

    statistics.packGachaSummary = Array.from(packStats.values())
      .sort((a, b) => new Date(b.lastGachaAt || 0).getTime() - new Date(a.lastGachaAt || 0).getTime());
    
    this.setToCache(cacheKey, statistics, this.CACHE_TTL.USER_STATISTICS);
    return statistics;
  }

  public async updateUserStatisticsFromHistory(user: User): Promise<void> {
    const history = await this.getGachaHistory(user.id);
    
    // 重置统计
    user.statistics.totalGachas = 0;
    user.statistics.totalSpent = {
      [CurrencyType.GOLD]: 0,
      [CurrencyType.TICKET]: 0,
      [CurrencyType.PREMIUM]: 0
    };
    user.statistics.cardsByRarity = {
      [CardRarity.N]: 0,
      [CardRarity.R]: 0,
      [CardRarity.SR]: 0,
      [CardRarity.SSR]: 0,
      [CardRarity.UR]: 0,
      [CardRarity.LR]: 0
    };
    user.statistics.gachaByRarity = {
      [CardRarity.N]: 0,
      [CardRarity.R]: 0,
      [CardRarity.SR]: 0,
      [CardRarity.SSR]: 0,
      [CardRarity.UR]: 0,
      [CardRarity.LR]: 0
    };

    // 聚合卡包统计
    const packStats = new Map<string, {
      packId: string;
      packName: string;
      packDescription: string;
      packCoverImageUrl?: string;
      currency: CurrencyType;
      cost: number;
      totalGachas: number;
      lastGachaAt?: Date;
    }>();

    // 从历史记录聚合数据
    history.forEach(record => {
      // 总抽卡次数
      user.statistics.totalGachas += record.quantity;
      
      // 总花费
      user.statistics.totalSpent[record.packCurrency] += record.result.currencySpent;
      
      // 按稀有度统计
      record.result.cards.forEach(card => {
        user.statistics.cardsByRarity[card.rarity]++;
        user.statistics.gachaByRarity[card.rarity]++;
      });
      
      // 卡包统计
      const existing = packStats.get(record.packId);
      if (existing) {
        existing.totalGachas += record.quantity;
        if (!existing.lastGachaAt || new Date(record.createdAt) > new Date(existing.lastGachaAt)) {
          existing.lastGachaAt = record.createdAt;
        }
      } else {
        packStats.set(record.packId, {
          packId: record.packId,
          packName: record.packName,
          packDescription: record.packDescription,
          packCoverImageUrl: record.packCoverImageUrl,
          currency: record.packCurrency,
          cost: record.packCost,
          totalGachas: record.quantity,
          lastGachaAt: record.createdAt
        });
      }
      
      // 更新最后抽卡时间
      if (!user.statistics.lastGachaAt || new Date(record.createdAt) > new Date(user.statistics.lastGachaAt)) {
        user.statistics.lastGachaAt = record.createdAt;
      }
    });

    // 更新卡包汇总
    user.statistics.packGachaSummary = Array.from(packStats.values())
      .sort((a, b) => new Date(b.lastGachaAt || 0).getTime() - new Date(a.lastGachaAt || 0).getTime());

    // 保存更新后的用户数据
    await this.updateUser(user);
  }

  // 配置相关
  async getCardTemplates(): Promise<CardTemplate[]> {
    return this.getFromStorage<CardTemplate[]>(this.STORAGE_KEYS.CARD_TEMPLATES) || [];
  }

  async updateCardTemplate(template: CardTemplate): Promise<void> {
    const templates = this.getFromStorage<CardTemplate[]>(this.STORAGE_KEYS.CARD_TEMPLATES) || [];
    const index = templates.findIndex(t => t.id === template.id);
    if (index !== -1) {
      templates[index] = template;
    } else {
      templates.push(template);
    }
    this.setToStorage(this.STORAGE_KEYS.CARD_TEMPLATES, templates);
  }

  // 用户管理辅助方法
  async getCurrentUser(): Promise<User | null> {
    const currentUserId = this.getFromStorage<string>(this.STORAGE_KEYS.CURRENT_USER);
    return currentUserId ? await this.getUser(currentUserId) : null;
  }

  async setCurrentUser(userId: string): Promise<void> {
    this.setToStorage(this.STORAGE_KEYS.CURRENT_USER, userId);
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
  }

  async createDefaultUser(): Promise<User> {
    const defaultUser = await this.createUser({
      username: 'Player',
      email: 'player@example.com',
      currencies: {
        [CurrencyType.GOLD]: 10000,
        [CurrencyType.TICKET]: 10,
        [CurrencyType.PREMIUM]: 0
      },
      statistics: {
        totalGachas: 0,
        totalSpent: {
          [CurrencyType.GOLD]: 0,
          [CurrencyType.TICKET]: 0,
          [CurrencyType.PREMIUM]: 0
        },
        cardsByRarity: {
          [CardRarity.N]: 0,
          [CardRarity.R]: 0,
          [CardRarity.SR]: 0,
          [CardRarity.SSR]: 0,
          [CardRarity.UR]: 0,
          [CardRarity.LR]: 0
        },
        gachaByRarity: {
          [CardRarity.N]: 0,
          [CardRarity.R]: 0,
          [CardRarity.SR]: 0,
          [CardRarity.SSR]: 0,
          [CardRarity.UR]: 0,
          [CardRarity.LR]: 0
        },
        packGachaSummary: [],
        pityCounters: {}
      }
    });

    await this.setCurrentUser(defaultUser.id);
    return defaultUser;
  }

  // 数据初始化方法
  private initializeCards(): void {
    const defaultCards: Card[] = [
      // N卡 - 普通战士
      {
        id: 'n-1',
        name: '普通战士',
        description: '一名普通的战士，拥有基础的战斗能力',
        rarity: CardRarity.N,
        imageUrl: '/assets/card_n.png',
        attributes: { attack: 100, defense: 80 },
        templateId: 'basic-card',
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // R卡 - 精英骑士
      {
        id: 'r-1',
        name: '精英骑士',
        description: '训练有素的骑士，装备精良的铠甲',
        rarity: CardRarity.R,
        imageUrl: '/assets/card_r.png',
        attributes: { attack: 200, defense: 150 },
        templateId: 'basic-card',
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // SR卡 - 魔法师
      {
        id: 'sr-1',
        name: '高级魔法师',
        description: '掌握强大魔法的法师，能够施展毁灭性法术',
        rarity: CardRarity.SR,
        imageUrl: '/assets/card_sr.png',
        attributes: { attack: 400, defense: 300 },
        templateId: 'basic-card',
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // SSR卡 - 圣骑士
      {
        id: 'ssr-1',
        name: '圣骑士',
        description: '神圣的骑士，拥有神圣力量的庇护',
        rarity: CardRarity.SSR,
        imageUrl: '/assets/card_ssr.png',
        attributes: { attack: 800, defense: 600 },
        templateId: 'basic-card',
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // UR卡 - 龙骑士
      {
        id: 'ur-1',
        name: '龙骑士',
        description: '驾驭巨龙的骑士，拥有无与伦比的力量',
        rarity: CardRarity.UR,
        imageUrl: '/assets/card_ur.png',
        attributes: { attack: 1500, defense: 1200 },
        templateId: 'basic-card',
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // LR卡 - 龙王
      {
        id: 'lr-1',
        name: '龙王',
        description: '传说中的龙王，拥有毁天灭地的力量',
        rarity: CardRarity.LR,
        imageUrl: '/assets/card_lr.png',
        attributes: { attack: 3000, defense: 2500, special: 'Dragon Breath' },
        templateId: 'legendary-card',
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.setToStorage(this.STORAGE_KEYS.CARDS, defaultCards);
  }

  private initializeCardPacks(): void {
    const cards = this.getFromStorage<Card[]>(this.STORAGE_KEYS.CARDS) || [];
    const cardIds = cards.map(c => c.id);

    // 为每张卡片计算概率
    const calculateCardProbabilities = (totalCards: Card[], rarityWeights: Record<CardRarity, number>) => {
      const probabilities: Record<string, number> = {};
      const rarityGroups = totalCards.reduce((acc, card) => {
        if (!acc[card.rarity]) acc[card.rarity] = [];
        acc[card.rarity].push(card.id);
        return acc;
      }, {} as Record<CardRarity, string[]>);

      Object.entries(rarityWeights).forEach(([rarity, weight]) => {
        const cardsInRarity = rarityGroups[rarity as CardRarity] || [];
        const individualProbability = cardsInRarity.length > 0 ? weight / cardsInRarity.length : 0;
        cardsInRarity.forEach(cardId => {
          probabilities[cardId] = individualProbability;
        });
      });

      return probabilities;
    };

    // 基础卡包的稀有度权重
    const basicRarityWeights = {
      [CardRarity.N]: 0.60,
      [CardRarity.R]: 0.25,
      [CardRarity.SR]: 0.10,
      [CardRarity.SSR]: 0.04,
      [CardRarity.UR]: 0.009,
      [CardRarity.LR]: 0.001
    };

    // 高级卡包的稀有度权重
    const premiumRarityWeights = {
      [CardRarity.N]: 0.45,
      [CardRarity.R]: 0.35,
      [CardRarity.SR]: 0.15,
      [CardRarity.SSR]: 0.04,
      [CardRarity.UR]: 0.009,
      [CardRarity.LR]: 0.001
    };

    const defaultPacks: CardPack[] = [
      {
        id: 'standard-pack',
        name: '标准卡包',
        description: '包含各种稀有度卡牌的标准卡包',
        coverImageUrl: '/assets/pack_standard.png',
        cost: 100,
        currency: CurrencyType.GOLD,
        isActive: true,
        gameplayType: GameplayType.DEFAULT,
        cardProbabilities: calculateCardProbabilities(cards, basicRarityWeights),
        availableCards: cardIds,
        pitySystem: {
          maxPity: 90,
          guaranteedCards: cards.filter(c => c.rarity === CardRarity.SSR || c.rarity === CardRarity.UR || c.rarity === CardRarity.LR).map(c => c.id),
          softPityStart: 75,
          resetOnTrigger: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'premium-pack',
        name: '高级卡包',
        description: '高稀有度卡牌概率提升的高级卡包',
        coverImageUrl: '/assets/pack_premium.png',
        cost: 200,
        currency: CurrencyType.GOLD,
        isActive: true,
        gameplayType: GameplayType.DEFAULT,
        cardProbabilities: calculateCardProbabilities(cards, premiumRarityWeights),
        availableCards: cardIds,
        pitySystem: {
          maxPity: 80,
          guaranteedCards: cards.filter(c => c.rarity === CardRarity.SSR || c.rarity === CardRarity.UR || c.rarity === CardRarity.LR).map(c => c.id),
          softPityStart: 65,
          resetOnTrigger: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'legendary-pack',
        name: '传说卡包',
        description: '专注于传说级卡牌的稀有卡包',
        coverImageUrl: '/assets/pack_legendary.png',
        cost: 500,
        currency: CurrencyType.GOLD,
        isActive: true,
        gameplayType: GameplayType.DEFAULT,
        cardProbabilities: calculateCardProbabilities(cards, {
          [CardRarity.N]: 0.30,
          [CardRarity.R]: 0.40,
          [CardRarity.SR]: 0.20,
          [CardRarity.SSR]: 0.08,
          [CardRarity.UR]: 0.015,
          [CardRarity.LR]: 0.005
        }),
        availableCards: cardIds,
        pitySystem: {
          maxPity: 70,
          guaranteedCards: cards.filter(c => c.rarity === CardRarity.SSR || c.rarity === CardRarity.UR || c.rarity === CardRarity.LR).map(c => c.id),
          softPityStart: 55,
          resetOnTrigger: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.setToStorage(this.STORAGE_KEYS.CARD_PACKS, defaultPacks);
  }

  private initializeCardTemplates(): void {
    // 先初始化技能，获取技能对象
    const defaultSkills: Skill[] = [
      {
        id: 'basic-attack',
        name: '基础攻击',
        description: '简单的物理攻击',
        rarity: SkillRarity.N,
        skillType: SkillType.ATTACK,
        iconUrl: '/assets/skill_basic_attack.png',
        templateId: 'attack-skill',
        attributes: {
          damage: 50,
          criticalChance: 0.05
        },
        maxLevel: 10,
        levelScaling: {
          damage: 5,
          criticalChance: 0.01
        },
        unlockConditions: [
          {
            type: 'level',
            value: 1,
            description: '角色等级达到1级'
          }
        ],
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'heal-spell',
        name: '治疗术',
        description: '恢复目标生命值',
        rarity: SkillRarity.R,
        skillType: SkillType.HEAL,
        iconUrl: '/assets/skill_heal.png',
        templateId: 'heal-skill',
        attributes: {
          healing: 60,
          overheal: false
        },
        maxLevel: 8,
        levelScaling: {
          healing: 8
        },
        unlockConditions: [
          {
            type: 'level',
            value: 5,
            description: '角色等级达到5级'
          }
        ],
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // 模板定义
    const defaultTemplates: CardTemplate[] = [
      {
        id: 'basic-card',
        name: '基础卡片模版',
        description: '标准的卡片模版，包含基本属性',
        schema: {
          type: 'object',
          properties: {
            attack: { 
              type: 'number', 
              minimum: 0, 
              maximum: 2000, 
              default: 100,
              title: '攻击力',
              description: '卡片的攻击力值'
            },
            defense: { 
              type: 'number', 
              minimum: 0, 
              maximum: 2000, 
              default: 80,
              title: '防御力',
              description: '卡片的防御力值'
            }
          },
          required: ['attack', 'defense']
        },
        skillBindings: [
          {
            id: 'basic-skill-1',
            name: '技能1',
            description: '基础攻击技能，可对敌人造成伤害',
            skillId: 'basic-attack',
            skill: defaultSkills.find(s => s.id === 'basic-attack'),
            maxLevel: 10,
            unlockCondition: {
              type: 'level',
              value: 1,
              description: '角色等级达到1级解锁'
            }
          }
        ],
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'legendary-card',
        name: '传说卡片模版',
        description: '传说级卡片模版，包含特殊技能',
        schema: {
          type: 'object',
          properties: {
            attack: { 
              type: 'number', 
              minimum: 500, 
              maximum: 5000, 
              default: 1000,
              title: '攻击力',
              description: '传说卡片的攻击力'
            },
            defense: { 
              type: 'number', 
              minimum: 400, 
              maximum: 4000, 
              default: 800,
              title: '防御力',
              description: '传说卡片的防御力'
            },
            special: { 
              type: 'string',
              title: '特殊技能',
              description: '卡片的独特技能描述',
              default: ''
            }
          },
          required: ['attack', 'defense', 'special']
        },
        skillBindings: [
          {
            id: 'legendary-skill-1',
            name: '技能1',
            description: '传说级攻击技能，造成强大的伤害',
            skillId: 'basic-attack',
            skill: defaultSkills.find(s => s.id === 'basic-attack'),
            maxLevel: 15,
            unlockCondition: {
              type: 'level',
              value: 10,
              description: '角色等级达到10级解锁'
            }
          },
          {
            id: 'legendary-skill-2',
            name: '技能2',
            description: '传说级治疗技能，恢复大量生命值',
            skillId: 'heal-spell',
            skill: defaultSkills.find(s => s.id === 'heal-spell'),
            maxLevel: 12,
            unlockCondition: {
              type: 'level',
              value: 15,
              description: '角色等级达到15级解锁'
            }
          }
        ],
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.setToStorage(this.STORAGE_KEYS.CARD_TEMPLATES, defaultTemplates);
    // 也要初始化技能存储，防止被覆盖
    this.setToStorage(this.STORAGE_KEYS.SKILLS, defaultSkills);
  }

  // 新增：根据卡包ID获取该卡包内所有卡片
  async getCardsByPackId(packId: string): Promise<Card[]> {
    const packs = await this.getCardPacks();
    const pack = packs.find(p => p.id === packId);
    if (!pack) return [];
    const allCards = await this.getCards();
    return allCards.filter(card => pack.availableCards.includes(card.id));
  }

  // 新增：根据玩法类型过滤卡片
  async getCardsByGameplayType(gameplayType: GameplayType): Promise<Card[]> {
    const cacheKey = `cards_gameplay_${gameplayType}`;
    const cached = this.getFromCache<Card[]>(cacheKey);
    if (cached) return cached;

    const allCards = await this.getCards();
    const filteredCards = allCards.filter(card => card.gameplayType === gameplayType);
    
    this.setToCache(cacheKey, filteredCards, this.CACHE_TTL.CARDS);
    return filteredCards;
  }

  // 新增：根据玩法类型过滤卡包
  async getCardPacksByGameplayType(gameplayType: GameplayType): Promise<CardPack[]> {
    const cacheKey = `packs_gameplay_${gameplayType}`;
    const cached = this.getFromCache<CardPack[]>(cacheKey);
    if (cached) return cached;

    const allPacks = await this.getCardPacks();
    const filteredPacks = allPacks.filter(pack => pack.gameplayType === gameplayType);
    
    this.setToCache(cacheKey, filteredPacks, this.CACHE_TTL.PACKS);
    return filteredPacks;
  }

  // 新增：根据玩法类型过滤模板
  async getCardTemplatesByGameplayType(gameplayType: GameplayType): Promise<CardTemplate[]> {
    const cacheKey = `templates_gameplay_${gameplayType}`;
    const cached = this.getFromCache<CardTemplate[]>(cacheKey);
    if (cached) return cached;

    const allTemplates = await this.getCardTemplates();
    const filteredTemplates = allTemplates.filter(template => template.gameplayType === gameplayType);
    
    this.setToCache(cacheKey, filteredTemplates, this.CACHE_TTL.TEMPLATES);
    return filteredTemplates;
  }

  // ==================== 技能系统方法实现 ====================

  // 技能模板相关方法
  async getSkillTemplates(): Promise<SkillTemplate[]> {
    const cacheKey = 'skill_templates_all';
    const cached = this.getFromCache<SkillTemplate[]>(cacheKey);
    if (cached) return cached;

    const templates = this.getFromStorage<SkillTemplate[]>(this.STORAGE_KEYS.SKILL_TEMPLATES) || [];
    this.setToCache(cacheKey, templates, this.CACHE_TTL.TEMPLATES);
    return templates;
  }

  async getSkillTemplate(id: string): Promise<SkillTemplate | null> {
    const templates = await this.getSkillTemplates();
    return templates.find(template => template.id === id) || null;
  }

  async updateSkillTemplate(template: SkillTemplate): Promise<void> {
    const templates = await this.getSkillTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    
    if (index >= 0) {
      templates[index] = { ...template, updatedAt: new Date() };
    } else {
      templates.push({ ...template, createdAt: new Date(), updatedAt: new Date() });
    }
    
    this.setToStorage(this.STORAGE_KEYS.SKILL_TEMPLATES, templates);
    this.invalidateCache('skill_templates');
  }

  async deleteSkillTemplate(id: string): Promise<void> {
    const templates = await this.getSkillTemplates();
    const filteredTemplates = templates.filter(t => t.id !== id);
    this.setToStorage(this.STORAGE_KEYS.SKILL_TEMPLATES, filteredTemplates);
    this.invalidateCache('skill_templates');
  }

  async getSkillTemplatesByGameplayType(gameplayType: GameplayType): Promise<SkillTemplate[]> {
    const cacheKey = `skill_templates_gameplay_${gameplayType}`;
    const cached = this.getFromCache<SkillTemplate[]>(cacheKey);
    if (cached) return cached;

    const allTemplates = await this.getSkillTemplates();
    const filteredTemplates = allTemplates.filter(template => template.gameplayType === gameplayType);
    
    this.setToCache(cacheKey, filteredTemplates, this.CACHE_TTL.TEMPLATES);
    return filteredTemplates;
  }

  // 技能相关方法
  async getSkills(): Promise<Skill[]> {
    const cacheKey = 'skills_all';
    const cached = this.getFromCache<Skill[]>(cacheKey);
    if (cached) return cached;

    const skills = this.getFromStorage<Skill[]>(this.STORAGE_KEYS.SKILLS) || [];
    this.setToCache(cacheKey, skills, this.CACHE_TTL.CARDS);
    return skills;
  }

  async getSkill(id: string): Promise<Skill | null> {
    const skills = await this.getSkills();
    return skills.find(skill => skill.id === id) || null;
  }

  async updateSkill(skill: Skill): Promise<void> {
    const skills = await this.getSkills();
    const index = skills.findIndex(s => s.id === skill.id);
    
    if (index >= 0) {
      skills[index] = { ...skill, updatedAt: new Date() };
    } else {
      skills.push({ ...skill, createdAt: new Date(), updatedAt: new Date() });
    }
    
    this.setToStorage(this.STORAGE_KEYS.SKILLS, skills);
    this.invalidateCache('skills');
  }

  async deleteSkill(id: string): Promise<void> {
    const skills = await this.getSkills();
    const filteredSkills = skills.filter(s => s.id !== id);
    this.setToStorage(this.STORAGE_KEYS.SKILLS, filteredSkills);
    this.invalidateCache('skills');
  }

  async getSkillsByGameplayType(gameplayType: GameplayType): Promise<Skill[]> {
    const cacheKey = `skills_gameplay_${gameplayType}`;
    const cached = this.getFromCache<Skill[]>(cacheKey);
    if (cached) return cached;

    const allSkills = await this.getSkills();
    const filteredSkills = allSkills.filter(skill => skill.gameplayType === gameplayType);
    
    this.setToCache(cacheKey, filteredSkills, this.CACHE_TTL.CARDS);
    return filteredSkills;
  }

  async getSkillsByType(skillType: SkillType): Promise<Skill[]> {
    const cacheKey = `skills_type_${skillType}`;
    const cached = this.getFromCache<Skill[]>(cacheKey);
    if (cached) return cached;

    const allSkills = await this.getSkills();
    const filteredSkills = allSkills.filter(skill => skill.skillType === skillType);
    
    this.setToCache(cacheKey, filteredSkills, this.CACHE_TTL.CARDS);
    return filteredSkills;
  }

  // 用户技能相关方法
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    const userSkills = this.getFromStorage<UserSkill[]>(this.STORAGE_KEYS.USER_SKILLS) || [];
    const userSkillList = userSkills.filter(us => us.userId === userId);
    
    // 加载技能详情
    const skills = await this.getSkills();
    return userSkillList.map(userSkill => ({
      ...userSkill,
      skill: skills.find(s => s.id === userSkill.skillId)
    }));
  }

  async updateUserSkill(userSkill: UserSkill): Promise<void> {
    const userSkills = this.getFromStorage<UserSkill[]>(this.STORAGE_KEYS.USER_SKILLS) || [];
    const index = userSkills.findIndex(us => us.id === userSkill.id);
    
    if (index >= 0) {
      userSkills[index] = userSkill;
    } else {
      userSkills.push(userSkill);
    }
    
    this.setToStorage(this.STORAGE_KEYS.USER_SKILLS, userSkills);
  }

  async unlockUserSkill(userId: string, skillId: string): Promise<void> {
    const userSkills = this.getFromStorage<UserSkill[]>(this.STORAGE_KEYS.USER_SKILLS) || [];
    const existingSkill = userSkills.find(us => us.userId === userId && us.skillId === skillId);
    
    if (!existingSkill) {
      const newUserSkill: UserSkill = {
        id: uuidv4(),
        userId,
        skillId,
        level: 1,
        experience: 0,
        isUnlocked: true,
        obtainedAt: new Date()
      };
      userSkills.push(newUserSkill);
      this.setToStorage(this.STORAGE_KEYS.USER_SKILLS, userSkills);
    } else if (!existingSkill.isUnlocked) {
      existingSkill.isUnlocked = true;
      this.setToStorage(this.STORAGE_KEYS.USER_SKILLS, userSkills);
    }
  }

  async upgradeUserSkill(userId: string, skillId: string, experience: number): Promise<void> {
    const userSkills = this.getFromStorage<UserSkill[]>(this.STORAGE_KEYS.USER_SKILLS) || [];
    const userSkill = userSkills.find(us => us.userId === userId && us.skillId === skillId);
    
    if (userSkill) {
      userSkill.experience += experience;
      
      // 简单的升级逻辑：每100经验升1级
      const newLevel = Math.floor(userSkill.experience / 100) + 1;
      if (newLevel > userSkill.level) {
        userSkill.level = newLevel;
      }
      
      this.setToStorage(this.STORAGE_KEYS.USER_SKILLS, userSkills);
    }
  }

  // ECS组件数据方法
  async getSkillComponents(entityId: string): Promise<SkillComponent[]> {
    const components = this.getFromStorage<SkillComponent[]>(this.STORAGE_KEYS.SKILL_COMPONENTS) || [];
    return components.filter(component => component.entityId === entityId);
  }

  async updateSkillComponent(component: SkillComponent): Promise<void> {
    const components = this.getFromStorage<SkillComponent[]>(this.STORAGE_KEYS.SKILL_COMPONENTS) || [];
    const index = components.findIndex(c => c.entityId === component.entityId && c.skillId === component.skillId);
    
    if (index >= 0) {
      components[index] = component;
    } else {
      components.push(component);
    }
    
    this.setToStorage(this.STORAGE_KEYS.SKILL_COMPONENTS, components);
  }

  async getSkillEffects(entityId: string): Promise<SkillEffectComponent[]> {
    const effects = this.getFromStorage<SkillEffectComponent[]>(this.STORAGE_KEYS.SKILL_EFFECTS) || [];
    return effects.filter(effect => effect.entityId === entityId);
  }

  async updateSkillEffect(effect: SkillEffectComponent): Promise<void> {
    const effects = this.getFromStorage<SkillEffectComponent[]>(this.STORAGE_KEYS.SKILL_EFFECTS) || [];
    const index = effects.findIndex(e => e.entityId === effect.entityId && e.skillId === effect.skillId);
    
    if (index >= 0) {
      effects[index] = effect;
    } else {
      effects.push(effect);
    }
    
    this.setToStorage(this.STORAGE_KEYS.SKILL_EFFECTS, effects);
  }

  async getSkillSlotComponents(entityId: string): Promise<SkillSlotComponent[]> {
    const components = this.getFromStorage<SkillSlotComponent[]>(this.STORAGE_KEYS.SKILL_SLOT_COMPONENTS) || [];
    return components.filter(component => component.entityId === entityId);
  }

  async updateSkillSlotComponent(component: SkillSlotComponent): Promise<void> {
    const components = this.getFromStorage<SkillSlotComponent[]>(this.STORAGE_KEYS.SKILL_SLOT_COMPONENTS) || [];
    const index = components.findIndex(c => c.entityId === component.entityId);
    
    if (index >= 0) {
      components[index] = component;
    } else {
      components.push(component);
    }
    
    this.setToStorage(this.STORAGE_KEYS.SKILL_SLOT_COMPONENTS, components);
  }

  // 初始化技能模板
  private initializeSkillTemplates(): void {
    const defaultSkillTemplates: SkillTemplate[] = [
      {
        id: 'attack-skill',
        name: '攻击技能模板',
        description: '基础攻击技能模板，包含伤害计算',
        skillType: SkillType.ATTACK,
        targetType: SkillTargetType.SINGLE_ENEMY,
        range: 1,
        castTime: 0,
        cooldown: 3,
        manaCost: 20,
        effects: [
          {
            type: SkillEffectType.DAMAGE,
            target: SkillTargetType.SINGLE_ENEMY,
            duration: 'instant',
            magnitude: {
              base: 100,
              scaling: 10,
              attribute: 'attack'
            }
          }
        ],
        schema: {
          type: 'object',
          properties: {
            damage: {
              type: 'number',
              minimum: 0,
              maximum: 1000,
              default: 100,
              title: '基础伤害',
              description: '技能的基础伤害值'
            },
            criticalChance: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              default: 0.1,
              title: '暴击率',
              description: '技能暴击的概率'
            }
          },
          required: ['damage', 'criticalChance']
        },
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'heal-skill',
        name: '治疗技能模板',
        description: '基础治疗技能模板，包含治疗计算',
        skillType: SkillType.HEAL,
        targetType: SkillTargetType.SINGLE_ALLY,
        range: 1,
        castTime: 1,
        cooldown: 5,
        manaCost: 30,
        effects: [
          {
            type: SkillEffectType.HEAL,
            target: SkillTargetType.SINGLE_ALLY,
            duration: 'instant',
            magnitude: {
              base: 80,
              scaling: 8,
              attribute: 'healing'
            }
          }
        ],
        schema: {
          type: 'object',
          properties: {
            healing: {
              type: 'number',
              minimum: 0,
              maximum: 500,
              default: 80,
              title: '治疗量',
              description: '技能的治疗量'
            },
            overheal: {
              type: 'boolean',
              default: false,
              title: '允许过量治疗',
              description: '是否允许治疗量超过最大生命值'
            }
          },
          required: ['healing', 'overheal']
        },
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.setToStorage(this.STORAGE_KEYS.SKILL_TEMPLATES, defaultSkillTemplates);
  }

  // 初始化技能
  private initializeSkills(): void {
    const defaultSkills: Skill[] = [
      {
        id: 'basic-attack',
        name: '基础攻击',
        description: '简单的物理攻击',
        rarity: SkillRarity.N,
        skillType: SkillType.ATTACK,
        iconUrl: '/assets/skill_basic_attack.png',
        templateId: 'attack-skill',
        attributes: {
          damage: 50,
          criticalChance: 0.05
        },
        maxLevel: 10,
        levelScaling: {
          damage: 5,
          criticalChance: 0.01
        },
        unlockConditions: [
          {
            type: 'level',
            value: 1,
            description: '角色等级达到1级'
          }
        ],
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'heal-spell',
        name: '治疗术',
        description: '恢复目标生命值',
        rarity: SkillRarity.R,
        skillType: SkillType.HEAL,
        iconUrl: '/assets/skill_heal.png',
        templateId: 'heal-skill',
        attributes: {
          healing: 60,
          overheal: false
        },
        maxLevel: 8,
        levelScaling: {
          healing: 8
        },
        unlockConditions: [
          {
            type: 'level',
            value: 5,
            description: '角色等级达到5级'
          }
        ],
        gameplayType: GameplayType.DEFAULT,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.setToStorage(this.STORAGE_KEYS.SKILLS, defaultSkills);
  }

  // ==================== 技能绑定相关方法 ====================

  async getSkillBindingsByTemplate(templateId: string): Promise<SkillBinding[]> {
    const templates = this.getFromStorage<CardTemplate[]>(this.STORAGE_KEYS.CARD_TEMPLATES) || [];
    const template = templates.find(t => t.id === templateId);
    return template?.skillBindings || [];
  }

  async updateSkillBinding(templateId: string, binding: SkillBinding): Promise<void> {
    const templates = this.getFromStorage<CardTemplate[]>(this.STORAGE_KEYS.CARD_TEMPLATES) || [];
    const templateIndex = templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      throw new Error(`Template ${templateId} not found`);
    }

    const template = templates[templateIndex];
    const skillBindings = template.skillBindings || [];
    const bindingIndex = skillBindings.findIndex(b => b.id === binding.id);
    
    if (bindingIndex >= 0) {
      skillBindings[bindingIndex] = binding;
    } else {
      skillBindings.push(binding);
    }

    template.skillBindings = skillBindings;
    template.updatedAt = new Date();
    templates[templateIndex] = template;
    
    this.setToStorage(this.STORAGE_KEYS.CARD_TEMPLATES, templates);
    this.invalidateCache('templates');
  }

  async deleteSkillBinding(templateId: string, bindingId: string): Promise<void> {
    const templates = this.getFromStorage<CardTemplate[]>(this.STORAGE_KEYS.CARD_TEMPLATES) || [];
    const templateIndex = templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      throw new Error(`Template ${templateId} not found`);
    }

    const template = templates[templateIndex];
    const skillBindings = template.skillBindings || [];
    const filteredBindings = skillBindings.filter(b => b.id !== bindingId);
    
    template.skillBindings = filteredBindings;
    template.updatedAt = new Date();
    templates[templateIndex] = template;
    
    this.setToStorage(this.STORAGE_KEYS.CARD_TEMPLATES, templates);
    this.invalidateCache('templates');
  }

  async getCardSkillBindings(cardId: string): Promise<CardSkillBinding[]> {
    const cards = this.getFromStorage<Card[]>(this.STORAGE_KEYS.CARDS) || [];
    const card = cards.find(c => c.id === cardId);
    return card?.skillBindings || [];
  }

  async updateCardSkillBinding(cardId: string, binding: CardSkillBinding): Promise<void> {
    const cards = this.getFromStorage<Card[]>(this.STORAGE_KEYS.CARDS) || [];
    const cardIndex = cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      throw new Error(`Card ${cardId} not found`);
    }

    const card = cards[cardIndex];
    const skillBindings = card.skillBindings || [];
    const bindingIndex = skillBindings.findIndex(b => b.bindingId === binding.bindingId);
    
    if (bindingIndex >= 0) {
      skillBindings[bindingIndex] = binding;
    } else {
      skillBindings.push(binding);
    }

    card.skillBindings = skillBindings;
    card.updatedAt = new Date();
    cards[cardIndex] = card;
    
    this.setToStorage(this.STORAGE_KEYS.CARDS, cards);
    this.invalidateCache('cards');
  }

  async bindSkillToCard(cardId: string, bindingId: string, skillId: string): Promise<void> {
    const cards = this.getFromStorage<Card[]>(this.STORAGE_KEYS.CARDS) || [];
    const skills = this.getFromStorage<Skill[]>(this.STORAGE_KEYS.SKILLS) || [];
    
    const cardIndex = cards.findIndex(c => c.id === cardId);
    const skill = skills.find(s => s.id === skillId);
    
    if (cardIndex === -1) {
      throw new Error(`Card ${cardId} not found`);
    }
    
    if (!skill) {
      throw new Error(`Skill ${skillId} not found`);
    }

    const card = cards[cardIndex];
    const skillBindings = card.skillBindings || [];
    const bindingIndex = skillBindings.findIndex(b => b.bindingId === bindingId);
    
    if (bindingIndex >= 0) {
      skillBindings[bindingIndex].skillId = skillId;
      skillBindings[bindingIndex].skill = skill;
      skillBindings[bindingIndex].level = 1;
      skillBindings[bindingIndex].isUnlocked = true;
      skillBindings[bindingIndex].attributes = { ...skill.attributes };
    } else {
      skillBindings.push({
        bindingId,
        skillId,
        skill,
        level: 1,
        isUnlocked: true,
        attributes: { ...skill.attributes }
      });
    }

    card.skillBindings = skillBindings;
    card.updatedAt = new Date();
    cards[cardIndex] = card;
    
    this.setToStorage(this.STORAGE_KEYS.CARDS, cards);
    this.invalidateCache('cards');
  }

  async unbindSkillFromCard(cardId: string, bindingId: string): Promise<void> {
    const cards = this.getFromStorage<Card[]>(this.STORAGE_KEYS.CARDS) || [];
    const cardIndex = cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      throw new Error(`Card ${cardId} not found`);
    }

    const card = cards[cardIndex];
    const skillBindings = card.skillBindings || [];
    const bindingIndex = skillBindings.findIndex(b => b.bindingId === bindingId);
    
    if (bindingIndex >= 0) {
      skillBindings[bindingIndex].skillId = '';
      skillBindings[bindingIndex].skill = undefined;
      skillBindings[bindingIndex].level = 0;
      skillBindings[bindingIndex].isUnlocked = false;
      skillBindings[bindingIndex].attributes = {};
    }

    card.skillBindings = skillBindings;
    card.updatedAt = new Date();
    cards[cardIndex] = card;
    
    this.setToStorage(this.STORAGE_KEYS.CARDS, cards);
    this.invalidateCache('cards');
  }
} 