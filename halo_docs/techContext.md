# 技术上下文

## 技术栈概览

### 前端技术栈
- **React 18**: 用于构建用户界面的JavaScript库
- **TypeScript 5**: 提供静态类型检查的JavaScript超集
- **Vite 5**: 现代化的前端构建工具
- **Tailwind CSS**: 实用优先的CSS框架
- **Framer Motion**: 用于React的动画库

### 状态管理
- **React Context API**: 用于全局状态管理
- **自定义Hooks**: 封装业务逻辑和状态管理
- **适配器模式**: 统一的数据访问接口

### 数据存储
- **localStorage**: 客户端数据持久化
- **内存缓存**: 智能缓存提升性能
- **数据验证**: 概率验证和数据完整性检查

### 开发工具
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查和智能提示
- **Vite HMR**: 热模块替换

## ECS系统技术架构

### 核心概念
**ECS (Entity-Component-System)** 是一种游戏开发架构模式，将游戏对象分解为三个核心概念：

1. **Entity (实体)**: 游戏中的对象，如角色、怪物、道具等
2. **Component (组件)**: 实体的数据和状态，如位置、生命值、技能等
3. **System (系统)**: 处理组件数据的逻辑，如移动系统、战斗系统等

### 技术实现架构

#### 1. 实体管理器 (EntityManager)
```typescript
class EntityManager {
  private entities = new Map<string, Entity>();
  private nextEntityId = 1;
  
  createEntity(): Entity {
    const entity = new Entity(this.nextEntityId++);
    this.entities.set(entity.id, entity);
    return entity;
  }
  
  destroyEntity(entityId: string): void {
    this.entities.delete(entityId);
  }
  
  getEntity(entityId: string): Entity | null {
    return this.entities.get(entityId) || null;
  }
  
  getEntitiesWithComponent(componentType: string): Entity[] {
    return Array.from(this.entities.values())
      .filter(entity => entity.hasComponent(componentType));
  }
}
```

#### 2. 组件管理器 (ComponentManager)
```typescript
class ComponentManager {
  private components = new Map<string, Map<string, Component>>();
  private componentTypes = new Set<string>();
  
  addComponent(entityId: string, component: Component): void {
    const componentType = component.constructor.name;
    this.componentTypes.add(componentType);
    
    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map());
    }
    this.components.get(componentType)!.set(entityId, component);
  }
  
  removeComponent(entityId: string, componentType: string): void {
    this.components.get(componentType)?.delete(entityId);
  }
  
  getComponent<T extends Component>(entityId: string, componentType: string): T | null {
    return this.components.get(componentType)?.get(entityId) as T || null;
  }
  
  getComponentsOfType<T extends Component>(componentType: string): T[] {
    return Array.from(this.components.get(componentType)?.values() || []) as T[];
  }
}
```

#### 3. 系统管理器 (SystemManager)
```typescript
interface System {
  requiredComponents: string[];
  priority: number;
  update(entities: Entity[], deltaTime: number): void;
  onEntityAdded?(entity: Entity): void;
  onEntityRemoved?(entityId: string): void;
}

class SystemManager {
  private systems: System[] = [];
  private entityManager: EntityManager;
  private componentManager: ComponentManager;
  
  constructor(entityManager: EntityManager, componentManager: ComponentManager) {
    this.entityManager = entityManager;
    this.componentManager = componentManager;
  }
  
  addSystem(system: System): void {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
  }
  
  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index > -1) {
      this.systems.splice(index, 1);
    }
  }
  
  update(deltaTime: number): void {
    this.systems.forEach(system => {
      const entities = this.getEntitiesForSystem(system);
      system.update(entities, deltaTime);
    });
  }
  
  private getEntitiesForSystem(system: System): Entity[] {
    return system.requiredComponents.reduce((entities, componentType) => {
      const componentEntities = this.entityManager.getEntitiesWithComponent(componentType);
      return entities.filter(entity => componentEntities.includes(entity));
    }, this.entityManager.getAllEntities());
  }
}
```

#### 4. 游戏循环 (GameLoop)
```typescript
class GameLoop {
  private systemManager: SystemManager;
  private isRunning = false;
  private lastTime = 0;
  private accumulator = 0;
  private timeStep = 1000 / 60; // 60 FPS
  
  constructor(systemManager: SystemManager) {
    this.systemManager = systemManager;
  }
  
  start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  stop(): void {
    this.isRunning = false;
  }
  
  private gameLoop(): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.accumulator += deltaTime;
    
    while (this.accumulator >= this.timeStep) {
      this.systemManager.update(this.timeStep);
      this.accumulator -= this.timeStep;
    }
    
    requestAnimationFrame(() => this.gameLoop());
  }
}
```

### 组件类型设计

#### 基础组件接口
```typescript
interface Component {
  entityId: string;
  type: string;
}

// 位置组件
class PositionComponent implements Component {
  entityId: string;
  type = 'Position';
  x: number;
  y: number;
  z?: number;
  
  constructor(entityId: string, x: number, y: number, z?: number) {
    this.entityId = entityId;
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

// 生命值组件
class HealthComponent implements Component {
  entityId: string;
  type = 'Health';
  currentHealth: number;
  maxHealth: number;
  isAlive: boolean;
  
  constructor(entityId: string, maxHealth: number) {
    this.entityId = entityId;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.isAlive = true;
  }
  
  takeDamage(damage: number): void {
    this.currentHealth = Math.max(0, this.currentHealth - damage);
    this.isAlive = this.currentHealth > 0;
  }
  
  heal(amount: number): void {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }
}

// 技能组件
class SkillComponent implements Component {
  entityId: string;
  type = 'Skill';
  skillId: string;
  level: number;
  cooldown: number;
  maxCooldown: number;
  manaCost: number;
  lastUsedAt?: Date;
  
  constructor(entityId: string, skillId: string, level: number, cooldown: number, manaCost: number) {
    this.entityId = entityId;
    this.skillId = skillId;
    this.level = level;
    this.cooldown = 0;
    this.maxCooldown = cooldown;
    this.manaCost = manaCost;
  }
  
  canUse(): boolean {
    return this.cooldown <= 0;
  }
  
  use(): void {
    if (this.canUse()) {
      this.cooldown = this.maxCooldown;
      this.lastUsedAt = new Date();
    }
  }
  
  updateCooldown(deltaTime: number): void {
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
      if (this.cooldown < 0) this.cooldown = 0;
    }
  }
}
```

### 系统实现

#### 技能系统
```typescript
class SkillSystem implements System {
  requiredComponents = ['Skill', 'Health'];
  priority = 1;
  
  update(entities: Entity[], deltaTime: number): void {
    entities.forEach(entity => {
      const skillComponent = entity.getComponent<SkillComponent>('Skill');
      const healthComponent = entity.getComponent<HealthComponent>('Health');
      
      if (skillComponent && healthComponent) {
        // 更新技能冷却
        skillComponent.updateCooldown(deltaTime);
        
        // 处理技能效果
        this.processSkillEffects(skillComponent, healthComponent);
      }
    });
  }
  
  private processSkillEffects(skill: SkillComponent, health: HealthComponent): void {
    // 根据技能类型应用效果
    if (skill.skillId === 'heal' && skill.canUse()) {
      const healAmount = 50 + (skill.level * 10);
      health.heal(healAmount);
      skill.use();
    }
  }
}
```

#### 移动系统
```typescript
class MovementSystem implements System {
  requiredComponents = ['Position', 'Movement'];
  priority = 2;
  
  update(entities: Entity[], deltaTime: number): void {
    entities.forEach(entity => {
      const position = entity.getComponent<PositionComponent>('Position');
      const movement = entity.getComponent<MovementComponent>('Movement');
      
      if (position && movement) {
        // 更新位置
        position.x += movement.velocityX * deltaTime;
        position.y += movement.velocityY * deltaTime;
        
        // 边界检查
        this.checkBounds(position, movement);
      }
    });
  }
  
  private checkBounds(position: PositionComponent, movement: MovementComponent): void {
    // 简单的边界检查
    if (position.x < 0) {
      position.x = 0;
      movement.velocityX = 0;
    }
    if (position.x > 800) {
      position.x = 800;
      movement.velocityX = 0;
    }
    // 类似地处理y轴
  }
}
```

#### 战斗系统
```typescript
class CombatSystem implements System {
  requiredComponents = ['Position', 'Health', 'Combat'];
  priority = 3;
  
  update(entities: Entity[], deltaTime: number): void {
    // 检测碰撞
    this.detectCollisions(entities);
    
    // 处理攻击
    this.processAttacks(entities);
  }
  
  private detectCollisions(entities: Entity[]): void {
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        if (this.checkCollision(entity1, entity2)) {
          this.handleCollision(entity1, entity2);
        }
      }
    }
  }
  
  private checkCollision(entity1: Entity, entity2: Entity): boolean {
    const pos1 = entity1.getComponent<PositionComponent>('Position');
    const pos2 = entity2.getComponent<PositionComponent>('Position');
    
    if (!pos1 || !pos2) return false;
    
    const distance = Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
    );
    
    return distance < 50; // 碰撞半径
  }
  
  private handleCollision(entity1: Entity, entity2: Entity): void {
    // 处理碰撞逻辑
    const combat1 = entity1.getComponent<CombatComponent>('Combat');
    const combat2 = entity2.getComponent<CombatComponent>('Combat');
    
    if (combat1 && combat2) {
      // 计算伤害
      const damage1 = combat1.attack - combat2.defense;
      const damage2 = combat2.attack - combat1.defense;
      
      // 应用伤害
      const health1 = entity1.getComponent<HealthComponent>('Health');
      const health2 = entity2.getComponent<HealthComponent>('Health');
      
      if (health1 && damage2 > 0) health1.takeDamage(damage2);
      if (health2 && damage1 > 0) health2.takeDamage(damage1);
    }
  }
}
```

### 实体工厂模式

#### 模板驱动的实体创建
```typescript
class EntityFactory {
  private entityManager: EntityManager;
  private componentManager: ComponentManager;
  
  constructor(entityManager: EntityManager, componentManager: ComponentManager) {
    this.entityManager = entityManager;
    this.componentManager = componentManager;
  }
  
  createFromTemplate(template: CardTemplate): Entity {
    const entity = this.entityManager.createEntity();
    
    // 根据模板schema创建属性组件
    if (template.schema) {
      const attributes = this.generateAttributes(template.schema);
      const attributeComponent = new AttributeComponent(entity.id, attributes);
      this.componentManager.addComponent(entity.id, attributeComponent);
    }
    
    // 根据技能绑定创建技能组件
    if (template.skillBindings) {
      template.skillBindings.forEach(binding => {
        const skillComponent = new SkillComponent(
          entity.id,
          binding.skillId,
          1, // 初始等级
          binding.skill?.cooldown || 1000,
          binding.skill?.manaCost || 10
        );
        this.componentManager.addComponent(entity.id, skillComponent);
      });
    }
    
    // 添加基础组件
    this.addBaseComponents(entity);
    
    return entity;
  }
  
  private generateAttributes(schema: Record<string, any>): Record<string, any> {
    const attributes: Record<string, any> = {};
    
    Object.entries(schema).forEach(([key, config]) => {
      if (config.default !== undefined) {
        attributes[key] = config.default;
      }
    });
    
    return attributes;
  }
  
  private addBaseComponents(entity: Entity): void {
    // 添加位置组件
    const positionComponent = new PositionComponent(entity.id, 0, 0);
    this.componentManager.addComponent(entity.id, positionComponent);
    
    // 添加生命值组件
    const healthComponent = new HealthComponent(entity.id, 100);
    this.componentManager.addComponent(entity.id, healthComponent);
  }
}
```

### 性能优化技术

#### 1. 组件缓存
```typescript
class ComponentCache {
  private cache = new Map<string, Component[]>();
  private cacheTimeout = 5000; // 5秒缓存
  private cacheTimestamps = new Map<string, number>();
  
  getComponents(type: string): Component[] {
    const now = Date.now();
    const timestamp = this.cacheTimestamps.get(type);
    
    if (timestamp && now - timestamp < this.cacheTimeout) {
      return this.cache.get(type) || [];
    }
    
    // 重新加载组件
    const components = this.loadComponents(type);
    this.cache.set(type, components);
    this.cacheTimestamps.set(type, now);
    
    return components;
  }
  
  invalidateCache(type?: string): void {
    if (type) {
      this.cache.delete(type);
      this.cacheTimestamps.delete(type);
    } else {
      this.cache.clear();
      this.cacheTimestamps.clear();
    }
  }
}
```

#### 2. 空间分区
```typescript
class SpatialPartition {
  private gridSize = 100;
  private grid = new Map<string, Entity[]>();
  
  updateEntity(entity: Entity): void {
    const position = entity.getComponent<PositionComponent>('Position');
    if (!position) return;
    
    const cell = this.getCell(position.x, position.y);
    this.addToCell(cell, entity);
  }
  
  getNearbyEntities(position: PositionComponent, radius: number): Entity[] {
    const nearbyEntities: Entity[] = [];
    const cells = this.getCellsInRadius(position.x, position.y, radius);
    
    cells.forEach(cell => {
      const entities = this.grid.get(cell) || [];
      nearbyEntities.push(...entities);
    });
    
    return nearbyEntities;
  }
  
  private getCell(x: number, y: number): string {
    const cellX = Math.floor(x / this.gridSize);
    const cellY = Math.floor(y / this.gridSize);
    return `${cellX},${cellY}`;
  }
  
  private getCellsInRadius(x: number, y: number, radius: number): string[] {
    const cells: string[] = [];
    const centerCell = this.getCell(x, y);
    const [centerX, centerY] = centerCell.split(',').map(Number);
    
    const cellRadius = Math.ceil(radius / this.gridSize);
    
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const cellX = centerX + dx;
        const cellY = centerY + dy;
        cells.push(`${cellX},${cellY}`);
      }
    }
    
    return cells;
  }
}
```

#### 3. 系统批处理
```typescript
class BatchSystem implements System {
  requiredComponents = ['Position', 'Movement'];
  priority = 2;
  private batchSize = 100;
  
  update(entities: Entity[], deltaTime: number): void {
    // 分批处理实体
    for (let i = 0; i < entities.length; i += this.batchSize) {
      const batch = entities.slice(i, i + this.batchSize);
      this.processBatch(batch, deltaTime);
    }
  }
  
  private processBatch(entities: Entity[], deltaTime: number): void {
    // 批量更新位置
    const updates: Array<{entityId: string, x: number, y: number}> = [];
    
    entities.forEach(entity => {
      const position = entity.getComponent<PositionComponent>('Position');
      const movement = entity.getComponent<MovementComponent>('Movement');
      
      if (position && movement) {
        const newX = position.x + movement.velocityX * deltaTime;
        const newY = position.y + movement.velocityY * deltaTime;
        
        updates.push({
          entityId: entity.id,
          x: newX,
          y: newY
        });
      }
    });
    
    // 批量应用更新
    updates.forEach(update => {
      const entity = this.entityManager.getEntity(update.entityId);
      const position = entity?.getComponent<PositionComponent>('Position');
      if (position) {
        position.x = update.x;
        position.y = update.y;
      }
    });
  }
}
```

### 数据同步机制

#### 管理界面与ECS同步
```typescript
class ECSDataSync {
  private entityManager: EntityManager;
  private componentManager: ComponentManager;
  private dataAdapter: DataAdapter;
  
  constructor(entityManager: EntityManager, componentManager: ComponentManager, dataAdapter: DataAdapter) {
    this.entityManager = entityManager;
    this.componentManager = componentManager;
    this.dataAdapter = dataAdapter;
  }
  
  // 模板变更时更新相关实体
  async onTemplateUpdate(template: CardTemplate): Promise<void> {
    // 找到使用该模板的所有实体
    const entities = this.findEntitiesByTemplate(template.id);
    
    // 更新实体的组件
    entities.forEach(entity => {
      this.updateEntityFromTemplate(entity, template);
    });
  }
  
  // 实体状态变更时同步到数据层
  async onEntityUpdate(entity: Entity): Promise<void> {
    // 将实体状态保存到数据层
    await this.dataAdapter.updateEntity(entity);
  }
  
  private findEntitiesByTemplate(templateId: string): Entity[] {
    // 根据模板ID查找实体
    return this.entityManager.getAllEntities().filter(entity => {
      const attributeComponent = entity.getComponent<AttributeComponent>('Attribute');
      return attributeComponent?.templateId === templateId;
    });
  }
  
  private updateEntityFromTemplate(entity: Entity, template: CardTemplate): void {
    // 更新属性组件
    if (template.schema) {
      const attributeComponent = entity.getComponent<AttributeComponent>('Attribute');
      if (attributeComponent) {
        const newAttributes = this.generateAttributes(template.schema);
        Object.assign(attributeComponent.attributes, newAttributes);
      }
    }
    
    // 更新技能组件
    if (template.skillBindings) {
      // 移除旧的技能组件
      const oldSkills = this.componentManager.getComponentsOfType<SkillComponent>('Skill')
        .filter(skill => skill.entityId === entity.id);
      
      oldSkills.forEach(skill => {
        this.componentManager.removeComponent(entity.id, 'Skill');
      });
      
      // 添加新的技能组件
      template.skillBindings.forEach(binding => {
        const skillComponent = new SkillComponent(
          entity.id,
          binding.skillId,
          1,
          binding.skill?.cooldown || 1000,
          binding.skill?.manaCost || 10
        );
        this.componentManager.addComponent(entity.id, skillComponent);
      });
    }
  }
}
```

## 开发环境配置

### 项目结构
```
src/
├── ecs/                    # ECS系统核心
│   ├── components/         # 组件定义
│   ├── entities/          # 实体管理
│   ├── systems/           # 系统实现
│   └── managers/          # 管理器类
├── context/               # React Context
├── pages/                 # 页面组件
├── components/            # UI组件
├── adapters/              # 数据适配器
└── types/                 # TypeScript类型定义
```

### 构建配置
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ecs: ['@/ecs'],
        },
      },
    },
  },
});
```

### 性能监控
```typescript
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(duration);
    };
  }
  
  getAverageTime(name: string): number {
    const times = this.metrics.get(name) || [];
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    this.metrics.forEach((times, name) => {
      result[name] = this.getAverageTime(name);
    });
    return result;
  }
}
```

## 技术约束和限制

### 浏览器兼容性
- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **移动端**: iOS Safari 14+, Chrome Mobile 90+
- **不支持**: IE 11及以下版本

### 性能限制
- **实体数量**: 建议不超过1000个活跃实体
- **组件类型**: 建议不超过50种组件类型
- **系统数量**: 建议不超过20个系统
- **内存使用**: 控制在100MB以内

### 数据存储限制
- **localStorage**: 5-10MB存储限制
- **数据同步**: 实时同步可能影响性能
- **缓存策略**: 需要平衡内存使用和性能

## 扩展性设计

### 插件系统
```typescript
interface Plugin {
  name: string;
  version: string;
  install(ecs: ECSManager): void;
  uninstall(ecs: ECSManager): void;
}

class PluginManager {
  private plugins = new Map<string, Plugin>();
  private ecs: ECSManager;
  
  constructor(ecs: ECSManager) {
    this.ecs = ecs;
  }
  
  registerPlugin(plugin: Plugin): void {
    plugin.install(this.ecs);
    this.plugins.set(plugin.name, plugin);
  }
  
  unregisterPlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.uninstall(this.ecs);
      this.plugins.delete(name);
    }
  }
}
```

### 模块化系统
```typescript
// 战斗模块
class CombatModule {
  static install(ecs: ECSManager): void {
    ecs.addSystem(new CombatSystem());
    ecs.addSystem(new DamageSystem());
    ecs.addSystem(new HealingSystem());
  }
}

// 移动模块
class MovementModule {
  static install(ecs: ECSManager): void {
    ecs.addSystem(new MovementSystem());
    ecs.addSystem(new CollisionSystem());
    ecs.addSystem(new PathfindingSystem());
  }
}
```

### 配置驱动
```typescript
interface GameConfig {
  systems: SystemConfig[];
  components: ComponentConfig[];
  entities: EntityConfig[];
}

interface SystemConfig {
  name: string;
  enabled: boolean;
  priority: number;
}

interface ComponentConfig {
  name: string;
  maxInstances: number;
}

class ConfigManager {
  private config: GameConfig;
  
  constructor(config: GameConfig) {
    this.config = config;
  }
  
  initializeECS(ecs: ECSManager): void {
    this.config.systems.forEach(systemConfig => {
      if (systemConfig.enabled) {
        const system = this.createSystem(systemConfig.name);
        system.priority = systemConfig.priority;
        ecs.addSystem(system);
      }
    });
  }
}
``` 