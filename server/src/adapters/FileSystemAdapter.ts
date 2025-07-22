import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  CardPack,
  CardTemplate,
  Skill,
  SkillTemplate,
  User,
  UserCard,
  GachaHistory,
  UserStatistics,
  GachaRequest,
  GachaResult,
  Statistics,
  DataAdapter,
  GameplayType,
  SkillType,
  UserSkill,
  SkillComponent,
  SkillEffectComponent,
  SkillSlotComponent,
} from "../types";

const DATA_DIR = path.join(process.cwd(), "data");

export class FileSystemAdapter implements Partial<DataAdapter> {
  private cache = new Map<string, any>();

  constructor() {
    this.initializeDataDirectory();
  }

  private async initializeDataDirectory() {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    return path.join(DATA_DIR, `${key}.json`);
  }

  private async readData<T>(key: string): Promise<T[]> {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T[];
    }
    try {
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const parsedData = JSON.parse(data);
      this.cache.set(key, parsedData);
      return parsedData;
    } catch (error) {
      // If the file doesn't exist, return an empty array.
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async writeData<T>(key: string, data: T[]): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    this.cache.set(key, data);
  }

  async getCards(): Promise<Card[]> {
    return this.readData<Card>('cards');
  }

  async updateCard(card: Card): Promise<void> {
    const cards = await this.readData<Card>('cards');
    const index = cards.findIndex(c => c.id === card.id);
    if (index !== -1) {
      cards[index] = { ...card, updatedAt: new Date() };
    } else {
      cards.push({ ...card, id: card.id || uuidv4(), createdAt: new Date(), updatedAt: new Date() });
    }
    await this.writeData('cards', cards);
  }
  
  async deleteCard(id: string): Promise<void> {
    let cards = await this.readData<Card>('cards');
    cards = cards.filter(c => c.id !== id);
    await this.writeData('cards', cards);
  }
  
  async getCardPacks(): Promise<CardPack[]> {
    return this.readData<CardPack>('cardPacks');
  }

  async updateCardPack(pack: CardPack): Promise<void> {
    const packs = await this.readData<CardPack>('cardPacks');
    const index = packs.findIndex(p => p.id === pack.id);
    if (index !== -1) {
      packs[index] = { ...pack, updatedAt: new Date() };
    } else {
      packs.push({ ...pack, id: pack.id || uuidv4(), createdAt: new Date(), updatedAt: new Date() });
    }
    await this.writeData('cardPacks', packs);
  }

  async deleteCardPack(id: string): Promise<void> {
    let packs = await this.readData<CardPack>('cardPacks');
    packs = packs.filter(p => p.id !== id);
    await this.writeData('cardPacks', packs);
  }

  async getCardTemplates(): Promise<CardTemplate[]> {
    return this.readData<CardTemplate>('cardTemplates');
  }

  async updateCardTemplate(template: CardTemplate): Promise<void> {
    const templates = await this.readData<CardTemplate>('cardTemplates');
    const index = templates.findIndex(t => t.id === template.id);
    if (index !== -1) {
      templates[index] = { ...template, updatedAt: new Date() };
    } else {
      templates.push({ ...template, id: template.id || uuidv4(), createdAt: new Date(), updatedAt: new Date() });
    }
    await this.writeData('cardTemplates', templates);
  }

  async getSkills(): Promise<Skill[]> {
    return this.readData<Skill>('skills');
  }
  
  async updateSkill(skill: Skill): Promise<void> {
    const skills = await this.readData<Skill>('skills');
    const index = skills.findIndex(s => s.id === skill.id);
    if (index !== -1) {
      skills[index] = { ...skill, updatedAt: new Date() };
    } else {
      skills.push({ ...skill, id: skill.id || uuidv4(), createdAt: new Date(), updatedAt: new Date() });
    }
    await this.writeData('skills', skills);
  }

  async deleteSkill(id: string): Promise<void> {
    let skills = await this.readData<Skill>('skills');
    skills = skills.filter(s => s.id !== id);
    await this.writeData('skills', skills);
  }

  async getSkillTemplates(): Promise<SkillTemplate[]> {
    return this.readData<SkillTemplate>('skillTemplates');
  }

  async updateSkillTemplate(template: SkillTemplate): Promise<void> {
    const templates = await this.readData<SkillTemplate>('skillTemplates');
    const index = templates.findIndex(t => t.id === template.id);
    if (index !== -1) {
      templates[index] = { ...template, updatedAt: new Date() };
    } else {
      templates.push({ ...template, id: template.id || uuidv4(), createdAt: new Date(), updatedAt: new Date() });
    }
    await this.writeData('skillTemplates', templates);
  }

  async deleteSkillTemplate(id: string): Promise<void> {
    let templates = await this.readData<SkillTemplate>('skillTemplates');
    templates = templates.filter(t => t.id !== id);
    await this.writeData('skillTemplates', templates);
  }
} 