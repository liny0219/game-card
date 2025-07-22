import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import {
  CardRarity,
  CurrencyType,
  GameplayType,
  SkillRarity,
  SkillType,
  SkillTargetType,
} from "../../types/index.js";


// Since records and nested objects need to be Schemas themselves,
// we redefine the interfaces as Schema classes.

class PitySystemSchema extends Schema {
  @type("number") maxPity!: number;
  @type(["string"]) guaranteedCards = new ArraySchema<string>();
  @type("number") softPityStart!: number;
  @type("boolean") resetOnTrigger!: boolean;
}

export class CardSchema extends Schema {
  @type("string") id!: string;
  @type("string") name!: string;
  @type("string") description!: string;
  @type("string") rarity!: CardRarity;
  @type("string") imageUrl!: string;
  @type({ map: "string" }) attributes = new MapSchema<any>();
  @type("string") templateId!: string;
  @type("string") gameplayType!: GameplayType;
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
  @type({ map: "number" }) cardProbabilities = new MapSchema<number>();
  @type(["string"]) availableCards = new ArraySchema<string>();
  @type(PitySystemSchema) pitySystem?: PitySystemSchema;
  @type("number") createdAt!: number;
  @type("number") updatedAt!: number;
}

export class CardTemplateSchema extends Schema {
  @type("string") id!: string;
  @type("string") name!: string;
  @type("string") description!: string;
  @type("string") schema!: string; // JSON schema as a string
  @type("string") gameplayType!: GameplayType;
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
    @type({ map: "string" }) attributes = new MapSchema<any>();
    @type("number") maxLevel!: number;
    @type({ map: "number" }) levelScaling = new MapSchema<number>();
    // unlockConditions is complex, sending as JSON string for simplicity
    @type("string") unlockConditions!: string;
    @type("string") gameplayType!: GameplayType;
    @type("number") createdAt!: number;
    @type("number") updatedAt!: number;
}

export class SkillTemplateSchema extends Schema {
    @type("string") id!: string;
    @type("string") name!: string;
    @type("string") description!: string;
    @type("string") skillType!: SkillType;
    // For simplicity, complex fields are stored as JSON strings
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