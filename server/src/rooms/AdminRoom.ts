import { Room, Client } from "@colyseus/core";
import { 
  AdminRoomState, CardSchema, CardPackSchema, CardTemplateSchema, SkillSchema, SkillTemplateSchema 
} from "./schema/AdminRoomState.js";
import { FileSystemAdapter } from "../adapters/FileSystemAdapter.js";
import { ArraySchema } from "@colyseus/schema";

export class AdminRoom extends Room<AdminRoomState> {
  private dataAdapter = new FileSystemAdapter();

  onCreate(options: any) {
    this.setState(new AdminRoomState());
    
    // 设置最大客户端数量
    this.maxClients = 10;
    
    // 加载初始数据
    this.loadInitialData();
    
    // 设置消息处理器
    this.onMessage("*", (client, type, message) => {
      this.handleMessage(client, { type, data: message });
    });
  }

  onJoin(client: Client, options: any) {
    console.log(`${client.sessionId} joined admin room!`);
  }

  private handleMessage(client: Client, message: any) {
    const { type, data } = message;
    
    switch (type) {
      case 'UPDATE_CARD':
        this.handleUpdate(this.dataAdapter.updateCard, this.loadAndPopulateCards, data);
        break;
      case 'DELETE_CARD':
        this.handleDelete(this.dataAdapter.deleteCard, this.loadAndPopulateCards, data.id);
        break;
      case 'UPDATE_CARD_PACK':
        this.handleUpdate(this.dataAdapter.updateCardPack, this.loadAndPopulateCardPacks, data);
        break;
      case 'DELETE_CARD_PACK':
        this.handleDelete(this.dataAdapter.deleteCardPack, this.loadAndPopulateCardPacks, data.id);
        break;
      case 'UPDATE_CARD_TEMPLATE':
        this.handleUpdate(this.dataAdapter.updateCardTemplate, this.loadAndPopulateCardTemplates, data);
        break;
      case 'DELETE_CARD_TEMPLATE':
        this.handleDelete(this.dataAdapter.deleteCardTemplate, this.loadAndPopulateCardTemplates, data.id);
        break;
      case 'UPDATE_SKILL':
        this.handleUpdate(this.dataAdapter.updateSkill, this.loadAndPopulateSkills, data);
        break;
      case 'DELETE_SKILL':
        this.handleDelete(this.dataAdapter.deleteSkill, this.loadAndPopulateSkills, data.id);
        break;
      case 'UPDATE_SKILL_TEMPLATE':
        this.handleUpdate(this.dataAdapter.updateSkillTemplate, this.loadAndPopulateSkillTemplates, data);
        break;
      case 'DELETE_SKILL_TEMPLATE':
        this.handleDelete(this.dataAdapter.deleteSkillTemplate, this.loadAndPopulateSkillTemplates, data.id);
        break;
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`${client.sessionId} left admin room!`);
  }

  onDispose() {
    console.log("Disposing admin room...");
  }

  private async loadInitialData() {
    console.log("Loading initial data from file system...");
    try {
      await this.loadAndPopulateCards();
      await this.loadAndPopulateCardPacks();
      await this.loadAndPopulateCardTemplates();
      await this.loadAndPopulateSkills();
      await this.loadAndPopulateSkillTemplates();
      console.log("Initial data loaded.");
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  }

  // --- Generic Handlers ---
  private async handleUpdate<T>(updateFunc: (data: T) => Promise<void>, reloadFunc: () => Promise<void>, data: T) {
    try {
      await updateFunc(data);
      await reloadFunc.call(this);
    } catch (e) { 
      console.error("Failed to update:", e); 
    }
  }

  private async handleDelete(deleteFunc: (id: string) => Promise<void>, reloadFunc: () => Promise<void>, id: string) {
    try {
      await deleteFunc(id);
      await reloadFunc.call(this);
    } catch (e) { 
      console.error("Failed to delete:", e); 
    }
  }

  private populateSchema<S extends object, T extends object>(schema: S, data: T): S {
    try {
      for (const key in schema) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = (data as any)[key];
          const schemaField = (schema as any)[key];
          
          // Handle different value types safely
          if (value === null || value === undefined) {
            // Skip undefined/null values to prevent serialization errors
            continue;
          } else if (schemaField instanceof ArraySchema) {
            // Clear and push new values for ArraySchema
            schemaField.clear();
            if (Array.isArray(value)) {
              value.forEach(item => schemaField.push(item));
            }
          } else if (key === 'createdAt' || key === 'updatedAt') {
            // Handle date fields specifically - convert to timestamp
            if (typeof value === 'string') {
              (schema as any)[key] = new Date(value).getTime();
            } else if (value instanceof Date) {
              (schema as any)[key] = value.getTime();
            } else if (typeof value === 'number') {
              (schema as any)[key] = value;
            }
          } else if (typeof value === 'object' && value !== null) {
            // Convert complex objects to JSON strings for Colyseus compatibility
            (schema as any)[key] = JSON.stringify(value);
          } else {
            (schema as any)[key] = value;
          }
        }
      }
      return schema;
    } catch (error) {
      console.error("Error populating schema:", error);
      throw error;
    }
  }
  
  // --- Data Population ---
  private async loadAndPopulate<S extends object, T extends object>(
    stateArray: ArraySchema<S>,
    schemaClass: new () => S,
    fetchFunc: () => Promise<T[]>
  ) {
    try {
      stateArray.clear();
      const data = await fetchFunc();
      
      if (!Array.isArray(data)) {
        console.warn("Fetch function returned non-array data:", data);
        return;
      }
      
      data.forEach(item => {
        try {
          const schemaItem = this.populateSchema(new schemaClass(), item);
          stateArray.push(schemaItem);
        } catch (error) {
          console.error("Error populating individual item:", item, error);
        }
      });
    } catch (error) {
      console.error("Error in loadAndPopulate:", error);
    }
  }

  private async loadAndPopulateCards() {
    await this.loadAndPopulate(this.state.cards, CardSchema, this.dataAdapter.getCards);
  }
  
  private async loadAndPopulateCardPacks() {
    await this.loadAndPopulate(this.state.cardPacks, CardPackSchema, this.dataAdapter.getCardPacks);
  }
  
  private async loadAndPopulateCardTemplates() {
    await this.loadAndPopulate(this.state.cardTemplates, CardTemplateSchema, this.dataAdapter.getCardTemplates);
  }
  
  private async loadAndPopulateSkills() {
    await this.loadAndPopulate(this.state.skills, SkillSchema, this.dataAdapter.getSkills);
  }
  
  private async loadAndPopulateSkillTemplates() {
    await this.loadAndPopulate(this.state.skillTemplates, SkillTemplateSchema, this.dataAdapter.getSkillTemplates);
  }
} 