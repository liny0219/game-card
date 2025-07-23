import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import {
  Card, CardPack, CardTemplate, Skill, SkillTemplate, User, UserCard, GachaHistory, UserStatistics, GachaRequest, GachaResult, Statistics, DataAdapter, GameplayType, SkillType, UserSkill, SkillComponent, SkillEffectComponent, SkillSlotComponent, CardRarity, CurrencyType, SkillRarity, SkillTargetType, SkillEffectType
} from "../types/index.js";

const DATA_DIR = path.join(process.cwd(), "data");

// Helper function to read a JSON file
async function readJSONFile<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [] as T; // Return empty array if file doesn't exist
    }
    throw error;
  }
}

// Helper function to write a JSON file
async function writeJSONFile<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export class FileSystemAdapter implements Partial<DataAdapter> {

  constructor() {
    this.initializeData().catch(err => console.error("Failed to initialize data:", err));
  }

  private async initializeData(): Promise<void> {
    const files = ['cards.json', 'cardPacks.json', 'cardTemplates.json', 'skills.json', 'skillTemplates.json'];
    let shouldInitialize = false;

    for (const file of files) {
      try {
        await fs.access(path.join(DATA_DIR, file));
      } catch (error) {
        shouldInitialize = true;
        break;
      }
    }

    if (shouldInitialize) {
      console.log("Initializing default data files...");
      await this.createDefaultData();
    }
  }

  private async createDefaultData(): Promise<void> {
         // Initialize skillTemplates first (dependency for other data)
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

    // Initialize skills
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

    // Initialize cards with complete data structure
    const defaultCards: Card[] = [
      {
        id: 'card-001',
        name: '哥布林',
        description: '弱小的绿皮生物',
        rarity: CardRarity.N,
        imageUrl: '/assets/card_n.png',
        attributes: {
          attack: 50,
          defense: 20
        },
        templateId: 'tpl-default-hero',
        gameplayType: GameplayType.DEFAULT,
        skillBindings: [], // Initialize as empty array, not undefined
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'card-002',
        name: '兽人',
        description: '强壮的战士',
        rarity: CardRarity.R,
        imageUrl: '/assets/card_r.png',
        attributes: {
          attack: 100,
          defense: 80
        },
        templateId: 'tpl-default-hero',
        gameplayType: GameplayType.DEFAULT,
        skillBindings: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Initialize card templates
    const defaultCardTemplates: CardTemplate[] = [
      {
        id: 'tpl-default-hero',
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
      }
    ];

    // Initialize card packs
    const defaultCardPacks: CardPack[] = [
      {
        id: 'standard-pack',
        name: '标准卡包',
        description: '包含各种稀有度卡牌的标准卡包',
        coverImageUrl: '/assets/pack_standard.png',
        cost: 100,
        currency: CurrencyType.GOLD,
        isActive: true,
        gameplayType: GameplayType.DEFAULT,
        cardProbabilities: {
          'card-001': 0.6,
          'card-002': 0.4
        },
        availableCards: ['card-001', 'card-002'],
        pitySystem: {
          maxPity: 90,
          guaranteedCards: ['card-002'],
          softPityStart: 75,
          resetOnTrigger: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Write all data files
    await writeJSONFile('skillTemplates.json', defaultSkillTemplates);
    await writeJSONFile('skills.json', defaultSkills);
    await writeJSONFile('cards.json', defaultCards);
    await writeJSONFile('cardTemplates.json', defaultCardTemplates);
    await writeJSONFile('cardPacks.json', defaultCardPacks);

    console.log("Default data files created successfully");
  }
  
  // Method implementations
  async getCards(): Promise<Card[]> { return readJSONFile('cards.json'); }
  async getCard(id: string): Promise<Card | null> {
    const cards = await this.getCards();
    return cards.find(c => c.id === id) || null;
  }
  async updateCard(card: Card): Promise<void> {
    const cards = await this.getCards();
    const index = cards.findIndex(c => c.id === card.id);
    if (index !== -1) {
      cards[index] = card;
    } else {
      cards.push(card);
    }
    await writeJSONFile('cards.json', cards);
  }
  async deleteCard(id: string): Promise<void> {
    let cards = await this.getCards();
    cards = cards.filter(c => c.id !== id);
    await writeJSONFile('cards.json', cards);
  }

  async getCardPacks(): Promise<CardPack[]> { return readJSONFile('cardPacks.json'); }
  async updateCardPack(pack: CardPack): Promise<void> {
    const packs = await this.getCardPacks();
    const index = packs.findIndex(p => p.id === pack.id);
    if (index !== -1) {
      packs[index] = { ...pack, updatedAt: new Date() };
    } else {
      packs.push({ ...pack, id: pack.id || uuidv4(), createdAt: new Date(), updatedAt: new Date() });
    }
    await writeJSONFile('cardPacks.json', packs);
  }
  async deleteCardPack(id: string): Promise<void> {
    let packs = await this.getCardPacks();
    packs = packs.filter(p => p.id !== id);
    await writeJSONFile('cardPacks.json', packs);
  }

  async getCardTemplates(): Promise<CardTemplate[]> { return readJSONFile('cardTemplates.json'); }
  async updateCardTemplate(template: CardTemplate): Promise<void> {
    const templates = await this.getCardTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    if (index !== -1) {
      templates[index] = { ...template, updatedAt: new Date() };
    } else {
      templates.push({ ...template, id: template.id || uuidv4(), createdAt: new Date(), updatedAt: new Date() });
    }
    await writeJSONFile('cardTemplates.json', templates);
  }
  async deleteCardTemplate(id: string): Promise<void> {
    let templates = await this.getCardTemplates();
    templates = templates.filter(t => t.id !== id);
    await writeJSONFile('cardTemplates.json', templates);
  }

  async getSkills(): Promise<Skill[]> { return readJSONFile('skills.json'); }
  async updateSkill(skill: Skill): Promise<void> {
    const skills = await this.getSkills();
    const index = skills.findIndex(s => s.id === skill.id);
    if (index !== -1) {
      skills[index] = { ...skill, updatedAt: new Date() };
    } else {
      skills.push({ ...skill, id: skill.id || uuidv4(), createdAt: new Date(), updatedAt: new Date() });
    }
    await writeJSONFile('skills.json', skills);
  }
  async deleteSkill(id: string): Promise<void> {
    let skills = await this.getSkills();
    skills = skills.filter(s => s.id !== id);
    await writeJSONFile('skills.json', skills);
  }

  async getSkillTemplates(): Promise<SkillTemplate[]> { return readJSONFile('skillTemplates.json'); }
  async updateSkillTemplate(template: SkillTemplate): Promise<void> {
    const templates = await this.getSkillTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    if (index !== -1) {
      templates[index] = { ...template, updatedAt: new Date() };
    } else {
      templates.push({ ...template, id: template.id || uuidv4(), createdAt: new Date(), updatedAt: new Date() });
    }
    await writeJSONFile('skillTemplates.json', templates);
  }
  async deleteSkillTemplate(id: string): Promise<void> {
    let templates = await this.getSkillTemplates();
    templates = templates.filter(t => t.id !== id);
    await writeJSONFile('skillTemplates.json', templates);
  }
} 