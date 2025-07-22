import { Room, Client } from "@colyseus/core";
import { AdminRoomState, CardSchema, CardPackSchema, CardTemplateSchema, SkillSchema, SkillTemplateSchema } from "./schema/AdminRoomState.js";
import { FileSystemAdapter } from "../adapters/FileSystemAdapter.js";
import { Card, CardPack, CardTemplate, Skill, SkillTemplate } from "../types/index.js";

export class AdminRoom extends Room<AdminRoomState> {
  private dataAdapter!: FileSystemAdapter;

  async onCreate(options: any) {
    this.setState(new AdminRoomState());
    this.dataAdapter = new FileSystemAdapter();

    await this.loadInitialData();

    // Register message handlers for admin operations
    this.onMessage("updateCard", this.handleUpdateCard.bind(this));
    this.onMessage("deleteCard", this.handleDeleteCard.bind(this));
    this.onMessage("updateCardPack", this.handleUpdateCardPack.bind(this));
    this.onMessage("deleteCardPack", this.handleDeleteCardPack.bind(this));
    this.onMessage("updateCardTemplate", this.handleUpdateCardTemplate.bind(this));
    this.onMessage("updateSkill", this.handleUpdateSkill.bind(this));
    this.onMessage("deleteSkill", this.handleDeleteSkill.bind(this));
    this.onMessage("updateSkillTemplate", this.handleUpdateSkillTemplate.bind(this));
    this.onMessage("deleteSkillTemplate", this.handleDeleteSkillTemplate.bind(this));
  }

  async onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined admin room!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left admin room!");
  }

  onDispose() {
    console.log("Disposing admin room...");
  }

  private async loadInitialData() {
    console.log("Loading initial data from file system...");
    // Load all data and populate the state
    await this.loadAndPopulateCards();
    await this.loadAndPopulateCardPacks();
    await this.loadAndPopulateCardTemplates();
    await this.loadAndPopulateSkills();
    await this.loadAndPopulateSkillTemplates();
    console.log("Initial data loaded.");
  }

  // Helper to convert plain object to Schema instance
  private copyToSchema<T extends object, S extends T>(data: T, schemaInstance: S): S {
      for (const key in schemaInstance) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
              const value = (data as any)[key];
              if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
                  // For simplicity, nested objects (like attributes, etc.) are converted to JSON strings or handled as Maps
                  if (schemaInstance[key] instanceof Map) {
                    Object.entries(value).forEach(([k, v]) => {
                        (schemaInstance[key] as any).set(k, v);
                    });
                  } else if (key === 'schema' || key === 'effects' || key === 'unlockConditions') {
                    (schemaInstance as any)[key] = JSON.stringify(value);
                  }
              } else if (value instanceof Date) {
                  (schemaInstance as any)[key] = value.getTime();
              }
              else {
                  (schemaInstance as any)[key] = value;
              }
          }
      }
      return schemaInstance;
  }


  // Card Handlers
  private async loadAndPopulateCards() {
    const cards = await this.dataAdapter.getCards();
    this.state.cards.clear();
    cards.forEach(cardData => {
      const cardSchema = this.copyToSchema(cardData, new CardSchema());
      this.state.cards.push(cardSchema);
    });
  }

  private async handleUpdateCard(client: Client, cardData: Card) {
    try {
      await this.dataAdapter.updateCard(cardData);
      await this.loadAndPopulateCards();
    } catch (e) {
      console.error("Failed to update card:", e);
    }
  }

  private async handleDeleteCard(client: Client, cardId: string) {
    try {
        await this.dataAdapter.deleteCard(cardId);
        await this.loadAndPopulateCards();
    } catch (e) {
        console.error("Failed to delete card:", e);
    }
  }

  // CardPack Handlers
  private async loadAndPopulateCardPacks() {
      const packs = await this.dataAdapter.getCardPacks();
      this.state.cardPacks.clear();
      packs.forEach(packData => {
        const packSchema = this.copyToSchema(packData, new CardPackSchema());
        this.state.cardPacks.push(packSchema);
      });
  }

  private async handleUpdateCardPack(client: Client, packData: CardPack) {
      try {
          await this.dataAdapter.updateCardPack(packData);
          await this.loadAndPopulateCardPacks();
      } catch (e) {
          console.error("Failed to update card pack:", e);
      }
  }

  private async handleDeleteCardPack(client: Client, packId: string) {
      try {
          await this.dataAdapter.deleteCardPack(packId);
          await this.loadAndPopulateCardPacks();
      } catch (e) {
          console.error("Failed to delete card pack:", e);
      }
  }

  // CardTemplate Handlers
    private async loadAndPopulateCardTemplates() {
        const templates = await this.dataAdapter.getCardTemplates();
        this.state.cardTemplates.clear();
        templates.forEach(templateData => {
            const templateSchema = this.copyToSchema(templateData, new CardTemplateSchema());
            this.state.cardTemplates.push(templateSchema);
        });
    }

    private async handleUpdateCardTemplate(client: Client, templateData: CardTemplate) {
        try {
            await this.dataAdapter.updateCardTemplate(templateData);
            await this.loadAndPopulateCardTemplates();
        } catch (e) {
            console.error("Failed to update card template:", e);
        }
    }

    // Skill Handlers
    private async loadAndPopulateSkills() {
        const skills = await this.dataAdapter.getSkills();
        this.state.skills.clear();
        skills.forEach(skillData => {
            const skillSchema = this.copyToSchema(skillData, new SkillSchema());
            this.state.skills.push(skillSchema);
        });
    }

    private async handleUpdateSkill(client: Client, skillData: Skill) {
        try {
            await this.dataAdapter.updateSkill(skillData);
            await this.loadAndPopulateSkills();
        } catch (e) {
            console.error("Failed to update skill:", e);
        }
    }

    private async handleDeleteSkill(client: Client, skillId: string) {
        try {
            await this.dataAdapter.deleteSkill(skillId);
            await this.loadAndPopulateSkills();
        } catch (e) {
            console.error("Failed to delete skill:", e);
        }
    }
    
    // SkillTemplate Handlers
    private async loadAndPopulateSkillTemplates() {
        const templates = await this.dataAdapter.getSkillTemplates();
        this.state.skillTemplates.clear();
        templates.forEach(templateData => {
            const templateSchema = this.copyToSchema(templateData, new SkillTemplateSchema());
            this.state.skillTemplates.push(templateSchema);
        });
    }

    private async handleUpdateSkillTemplate(client: Client, templateData: SkillTemplate) {
        try {
            await this.dataAdapter.updateSkillTemplate(templateData);
            await this.loadAndPopulateSkillTemplates();
        } catch (e) {
            console.error("Failed to update skill template:", e);
        }
    }

    private async handleDeleteSkillTemplate(client: Client, templateId: string) {
        try {
            await this.dataAdapter.deleteSkillTemplate(templateId);
            await this.loadAndPopulateSkillTemplates();
        } catch (e) {
            console.error("Failed to delete skill template:", e);
        }
    }
} 