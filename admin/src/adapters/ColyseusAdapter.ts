import { Client, Room } from "colyseus.js";
import {
  Card, CardPack, CardTemplate, Skill, SkillTemplate, DataAdapter, User, UserCard, GachaRequest, GachaResult, GachaHistory, Statistics, UserStatistics, GameplayType, SkillType, SkillBinding, CardSkillBinding, UserSkill, SkillComponent, SkillEffectComponent, SkillSlotComponent
} from "../types/index.js";

// This interface defines the structure of the data coming from the server's AdminRoomState
interface AdminRoomState {
  cards: Card[];
  cardPacks: CardPack[];
  cardTemplates: CardTemplate[];
  skills: Skill[];
  skillTemplates: SkillTemplate[];
}

export class ColyseusAdapter implements Partial<DataAdapter> {
  private client: Client;
  private room: Room<AdminRoomState> | null = null;
  private onStateChangeCallback: ((state: AdminRoomState) => void) | null = null;
  private state: AdminRoomState = {
    cards: [],
    cardPacks: [],
    cardTemplates: [],
    skills: [],
    skillTemplates: [],
  };

  constructor() {
    this.client = new Client("ws://localhost:2567");
  }

  public onStateChange(callback: (state: AdminRoomState) => void) {
    this.onStateChangeCallback = callback;
  }

  async connect(): Promise<void> {
    try {
      this.room = await this.client.joinOrCreate<AdminRoomState>("admin_room");
      console.log("Connected to admin room");

      this.room.onStateChange((newState) => {
        console.log("Raw newState from server:", newState);
        console.log("newState.cards:", newState.cards);
        console.log("newState.cards type:", typeof newState.cards);
        console.log("newState.cards length:", newState.cards?.length);
        
        // Enhanced conversion to handle Colyseus Schema objects properly
        const convertSchemaToPlainObject = (obj: any): any => {
          if (obj === null || obj === undefined) {
            return obj;
          }
          
          if (Array.isArray(obj)) {
            return obj.map(item => convertSchemaToPlainObject(item));
          }
          
          if (typeof obj === 'object') {
            const result: any = {};
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'string' && key.endsWith('skillBindings') || key.endsWith('attributes') || key.endsWith('cardProbabilities') || key.endsWith('pitySystem') || key.endsWith('schema') || key.endsWith('levelScaling') || key.endsWith('unlockConditions') || key.endsWith('effects')) {
                  // These fields are JSON strings, parse them
                  try {
                    result[key] = JSON.parse(value);
                  } catch (e) {
                    console.warn(`Failed to parse JSON for ${key}:`, value);
                    result[key] = value;
                  }
                } else if (typeof value === 'object' && value !== null) {
                  result[key] = convertSchemaToPlainObject(value);
                } else {
                  result[key] = value;
                }
              }
            }
            return result;
          }
          
          return obj;
        };

        // Convert Schema objects to plain JS objects for React state
        const plainState: AdminRoomState = {
          cards: newState.cards ? convertSchemaToPlainObject(Array.from(newState.cards)) : [],
          cardPacks: newState.cardPacks ? convertSchemaToPlainObject(Array.from(newState.cardPacks)) : [],
          cardTemplates: newState.cardTemplates ? convertSchemaToPlainObject(Array.from(newState.cardTemplates)) : [],
          skills: newState.skills ? convertSchemaToPlainObject(Array.from(newState.skills)) : [],
          skillTemplates: newState.skillTemplates ? convertSchemaToPlainObject(Array.from(newState.skillTemplates)) : [],
        };
        
        console.log("Converted plainState:", plainState);
        console.log("plainState.cards:", plainState.cards);
        console.log("plainState.cards length:", plainState.cards.length);
        
        this.state = plainState;
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback(this.state);
        }
      });

    } catch (e) {
      console.error("Join Error", e);
      throw e;
    }
  }

  disconnect(): void {
    if (this.room) {
      this.room.leave();
      this.room = null;
      console.log("Disconnected from admin room");
    }
  }

  // Data retrieval methods now simply return the cached state
  getCards(): Card[] { return this.state.cards || []; }
  getCardPacks(): CardPack[] { return this.state.cardPacks || []; }
  getCardTemplates(): CardTemplate[] { return this.state.cardTemplates || []; }
  getSkills(): Skill[] { return this.state.skills || []; }
  getSkillTemplates(): SkillTemplate[] { return this.state.skillTemplates || []; }

  // Send messages to server for CRUD operations
  sendMessage(type: string, data: any): void {
    if (this.room) {
      this.room.send("*", { type, data });
    }
  }

  // Placeholder implementations for DataAdapter interface methods
  async getUser(id: string): Promise<User | null> { return null; }
  async createUser(user: Partial<User>): Promise<User> { throw new Error("Not implemented"); }
  async updateUser(user: User): Promise<void> { throw new Error("Not implemented"); }
  async deleteUser(id: string): Promise<void> { throw new Error("Not implemented"); }
  async getCurrentUser(): Promise<User | null> { return null; }
  async setCurrentUser(userId: string): Promise<void> { throw new Error("Not implemented"); }
  async logout(): Promise<void> { throw new Error("Not implemented"); }

  async getUserCards(userId: string): Promise<UserCard[]> { return []; }

  async getCardsByPackId(packId: string): Promise<Card[]> { return []; }
  async getCardsByGameplayType(gameplayType: GameplayType): Promise<Card[]> { return this.state.cards.filter(c => c.gameplayType === gameplayType); }
  async getCardPacksByGameplayType(gameplayType: GameplayType): Promise<CardPack[]> { return this.state.cardPacks.filter(p => p.gameplayType === gameplayType); }
  async getCardTemplatesByGameplayType(gameplayType: GameplayType): Promise<CardTemplate[]> { return this.state.cardTemplates.filter(t => t.gameplayType === gameplayType); }
  async getSkillsByGameplayType(gameplayType: GameplayType): Promise<Skill[]> { return this.state.skills.filter(s => s.gameplayType === gameplayType); }
  async getSkillTemplatesByGameplayType(gameplayType: GameplayType): Promise<SkillTemplate[]> { return this.state.skillTemplates.filter(st => st.gameplayType === gameplayType); }

  async updateCard(card: Card): Promise<void> { this.sendMessage("UPDATE_CARD", card); }
  async deleteCard(id: string): Promise<void> { this.sendMessage("DELETE_CARD", { id }); }
  async updateCardPack(pack: CardPack): Promise<void> { this.sendMessage("UPDATE_CARD_PACK", pack); }
  async deleteCardPack(id: string): Promise<void> { this.sendMessage("DELETE_CARD_PACK", { id }); }
  async updateCardTemplate(template: CardTemplate): Promise<void> { this.sendMessage("UPDATE_CARD_TEMPLATE", template); }
  async deleteCardTemplate(id: string): Promise<void> { this.sendMessage("DELETE_CARD_TEMPLATE", { id }); }
  async updateSkill(skill: Skill): Promise<void> { this.sendMessage("UPDATE_SKILL", skill); }
  async deleteSkill(id: string): Promise<void> { this.sendMessage("DELETE_SKILL", { id }); }
  async updateSkillTemplate(template: SkillTemplate): Promise<void> { this.sendMessage("UPDATE_SKILL_TEMPLATE", template); }
  async deleteSkillTemplate(id: string): Promise<void> { this.sendMessage("DELETE_SKILL_TEMPLATE", { id }); }

  // Other placeholder methods
  async performGacha(request: GachaRequest): Promise<GachaResult> { throw new Error("Not implemented"); }
  async getGachaHistory(userId: string, limit?: number): Promise<GachaHistory[]> { return []; }
  async getStatistics(): Promise<Statistics> { throw new Error("Not implemented"); }
  async getUserStatistics(userId: string): Promise<UserStatistics> { throw new Error("Not implemented"); }
  async updateUserStatisticsFromHistory(user: User): Promise<void> { throw new Error("Not implemented"); }
} 