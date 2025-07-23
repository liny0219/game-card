import { Schema, ArraySchema, type } from "@colyseus/schema";
import { 
  CardRarity, CurrencyType, GameplayType, SkillRarity, SkillType 
} from "../../types/index.js";

export class CardSchema extends Schema {
  @type("string") id!: string;
  @type("string") name!: string;
  @type("string") description!: string;
  @type("string") rarity!: CardRarity;
  @type("string") imageUrl!: string;
  @type("string") attributes!: string; // JSON
  @type("string") templateId!: string;
  @type("string") gameplayType!: GameplayType;
  @type("string") skillBindings?: string; // JSON
  @type("number") createdAt!: number;
  @type("number") updatedAt!: number;
}

export class CardPackSchema extends Schema {
  @type("string") id!: string;
  @type("string") name!: string;
  @type("string") description!: string;
  @type("string") coverImageUrl!: string;
  @type("number") cost!: number;
  @type("string") currency!: CurrencyType;
  @type("boolean") isActive!: boolean;
  @type("string") gameplayType!: GameplayType;
  @type("string") cardProbabilities!: string; // JSON
  @type(["string"]) availableCards = new ArraySchema<string>();
  @type("string") pitySystem?: string; // JSON
  @type("number") createdAt!: number;
  @type("number") updatedAt!: number;
}

export class CardTemplateSchema extends Schema {
  @type("string") id!: string;
  @type("string") name!: string;
  @type("string") description!: string;
  @type("string") schema!: string; // JSON
  @type("string") gameplayType!: GameplayType;
  @type("string") skillBindings?: string; // JSON
  @type("number") createdAt!: number;
  @type("number") updatedAt!: number;
}

export class SkillSchema extends Schema {
    @type("string") id!: string;
    @type("string") name!: string;
    @type("string") description!: string;
    @type("string") rarity!: SkillRarity;
    @type("string") skillType!: SkillType;
    @type("string") iconUrl!: string;
    @type("string") templateId!: string;
    @type("string") attributes!: string; // JSON
    @type("number") maxLevel!: number;
    @type("string") levelScaling!: string; // JSON
    @type("string") unlockConditions!: string; // JSON
    @type("string") gameplayType!: GameplayType;
    @type("number") createdAt!: number;
    @type("number") updatedAt!: number;
}

export class SkillTemplateSchema extends Schema {
    @type("string") id!: string;
    @type("string") name!: string;
    @type("string") description!: string;
    @type("string") skillType!: SkillType;
    @type("string") targetType!: string;
    @type("string") effects!: string; 
    @type("string") schema!: string;
    @type("string") gameplayType!: GameplayType;
    @type("number") createdAt!: number;
    @type("number") updatedAt!: number;
}

export class AdminRoomState extends Schema {
  @type([CardSchema]) cards = new ArraySchema<CardSchema>();
  @type([CardPackSchema]) cardPacks = new ArraySchema<CardPackSchema>();
  @type([CardTemplateSchema]) cardTemplates = new ArraySchema<CardTemplateSchema>();
  @type([SkillSchema]) skills = new ArraySchema<SkillSchema>();
  @type([SkillTemplateSchema]) skillTemplates = new ArraySchema<SkillTemplateSchema>();
} 