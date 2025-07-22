# 系统架构模式

## ECS驱动的游戏开发架构

### 核心架构模式

#### 1. ECS模式（Entity-Component-System Pattern）
**核心思想**: 将游戏对象分解为实体、组件和系统三个层次

```typescript
// 实体 - 游戏对象的唯一标识
interface Entity {
  id: string;
  components: Map<string, Component>;
}

// 组件 - 纯数据结构
interface Component {
  entityId: string;
  [key: string]: any;
}

// 系统 - 处理逻辑
interface System {
  requiredComponents: string[];
  update(entities: Entity[], deltaTime: number): void;
}
```

#### 2. 模板模式（Template Pattern）
**核心思想**: 通过模板定义实体结构，运行时实例化

```typescript
// 实体模板
interface EntityTemplate {
  id: string;
  components: ComponentTemplate[];
  attributes: Record<string, any>;
}

// 组件模板
interface ComponentTemplate {
  type: string;
  defaultValues: Record<string, any>;
}
```

#### 3. 适配器模式（Adapter Pattern）
**核心思想**: 统一数据访问接口，支持不同数据源

```typescript
interface DataAdapter {
  // 实体管理
  createEntity(template: EntityTemplate): Promise<Entity>;
  getEntity(id: string): Promise<Entity | null>;
  updateEntity(entity: Entity): Promise<void>;
  deleteEntity(id: string): Promise<void>;
  
  // 组件管理
  addComponent(entityId: string, component: Component): Promise<void>;
  removeComponent(entityId: string, componentType: string): Promise<void>;
  getComponents(entityId: string): Promise<Component[]>;
}
```

#### 4. 观察者模式（Observer Pattern）
**核心思想**: 事件驱动的系统通信

```typescript
interface EventEmitter {
  on(event: string, callback: Function): void;
  emit(event: string, data: any): void;
  off(event: string, callback: Function): void;
}
```

### 系统架构设计

#### 分层架构
```
┌─────────────────────────────────────┐
│           用户界面层 (UI)            │
├─────────────────────────────────────┤
│           业务逻辑层 (BL)            │
├─────────────────────────────────────┤
│           ECS系统层 (ECS)           │
├─────────────────────────────────────┤
│           数据访问层 (DA)            │
├─────────────────────────────────────┤
│           数据存储层 (DS)            │
└─────────────────────────────────────┘
```

#### 核心管理器

##### EntityManager - 实体管理器
```typescript
class EntityManager {
  private entities = new Map<string, Entity>();
  private nextId = 1;
  
  createEntity(): Entity {
    const id = `entity_${this.nextId++}`;
    const entity = { id, components: new Map() };
    this.entities.set(id, entity);
    return entity;
  }
  
  destroyEntity(id: string): void {
    this.entities.delete(id);
  }
  
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }
  
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }
}
```

##### ComponentManager - 组件管理器
```typescript
class ComponentManager {
  private components = new Map<string, Map<string, Component>>();
  
  addComponent(entityId: string, component: Component): void {
    const componentType = component.constructor.name;
    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map());
    }
    this.components.get(componentType)!.set(entityId, component);
  }
  
  getComponentsOfType<T extends Component>(type: string): T[] {
    return Array.from(this.components.get(type)?.values() || []) as T[];
  }
  
  getEntityComponents(entityId: string): Component[] {
    const result: Component[] = [];
    this.components.forEach(componentMap => {
      const component = componentMap.get(entityId);
      if (component) result.push(component);
    });
    return result;
  }
}
```

##### SystemManager - 系统管理器
```typescript
class SystemManager {
  private systems: System[] = [];
  private entityManager: EntityManager;
  private componentManager: ComponentManager;
  
  addSystem(system: System): void {
    this.systems.push(system);
  }
  
  update(deltaTime: number): void {
    this.systems.forEach(system => {
      const entities = this.getEntitiesForSystem(system);
      system.update(entities, deltaTime);
    });
  }
  
  private getEntitiesForSystem(system: System): Entity[] {
    return system.requiredComponents.reduce((entities, componentType) => {
      const componentEntities = this.componentManager.getComponentsOfType(componentType);
      return entities.filter(entity => 
        componentEntities.some(comp => comp.entityId === entity.id)
      );
    }, this.entityManager.getAllEntities());
  }
}
```

### 数据流设计

#### 管理界面到ECS的数据流
```
管理界面 → 模板配置 → 实体工厂 → ECS系统 → 游戏逻辑
    ↓         ↓         ↓         ↓         ↓
  模板编辑   数据验证   实体创建   组件初始化   系统执行
```

#### 实体创建流程
```
1. 选择模板 → 2. 验证数据 → 3. 创建实体 → 4. 添加组件 → 5. 初始化状态
```

#### 系统执行流程
```
1. 游戏循环 → 2. 系统调度 → 3. 实体查询 → 4. 逻辑处理 → 5. 状态更新
```

### 性能优化模式

#### 组件缓存
```typescript
class ComponentCache {
  private cache = new Map<string, Component[]>();
  
  getComponents(type: string): Component[] {
    if (!this.cache.has(type)) {
      this.cache.set(type, this.loadComponents(type));
    }
    return this.cache.get(type)!;
  }
  
  invalidate(type: string): void {
    this.cache.delete(type);
  }
}
```

#### 空间分区
```typescript
class SpatialPartition {
  private grid = new Map<string, Entity[]>();
  private cellSize: number;
  
  updateEntity(entity: Entity, position: PositionComponent): void {
    const cellKey = this.getCellKey(position.x, position.y);
    // 更新网格中的实体位置
  }
  
  getNearbyEntities(position: PositionComponent, radius: number): Entity[] {
    // 返回指定半径内的实体
  }
}
```

### 扩展性设计

#### 插件系统
```typescript
interface Plugin {
  name: string;
  install(ecs: ECSManager): void;
  uninstall(ecs: ECSManager): void;
}

class PluginManager {
  private plugins = new Map<string, Plugin>();
  
  registerPlugin(plugin: Plugin): void {
    plugin.install(this.ecs);
    this.plugins.set(plugin.name, plugin);
  }
}
```

#### 模块化系统
```typescript
// 战斗模块
class CombatModule {
  static install(ecs: ECSManager): void {
    ecs.addSystem(new CombatSystem());
    ecs.addSystem(new DamageSystem());
  }
}

// 移动模块
class MovementModule {
  static install(ecs: ECSManager): void {
    ecs.addSystem(new MovementSystem());
    ecs.addSystem(new CollisionSystem());
  }
}
```

### 配置驱动

#### 游戏配置
```typescript
interface GameConfig {
  systems: SystemConfig[];
  components: ComponentConfig[];
  templates: TemplateConfig[];
}

class ConfigManager {
  initializeECS(ecs: ECSManager, config: GameConfig): void {
    config.systems.forEach(systemConfig => {
      const system = this.createSystem(systemConfig);
      ecs.addSystem(system);
    });
  }
}
```

## 架构优势

### 1. 高性能
- **组件缓存**: 快速访问组件数据
- **系统批处理**: 批量处理实体逻辑
- **空间分区**: 优化空间查询性能

### 2. 高扩展性
- **插件系统**: 支持功能模块的即插即用
- **模板驱动**: 通过配置扩展游戏内容
- **组件化**: 灵活的组件组合和复用

### 3. 高维护性
- **关注点分离**: 数据、逻辑、表现分离
- **类型安全**: 完整的TypeScript类型定义
- **测试友好**: 组件和系统可独立测试

### 4. 开发效率
- **可视化配置**: 管理界面支持无代码配置
- **实时同步**: 配置变更即时生效
- **调试工具**: 完整的调试和监控功能 

## 目录结构模式

- **`common/`**: 存放跨项目模块共享的代码。
  - **`common/types/`**: 定义了整个系统的核心数据类型（如 `Card`, `User`, `CardPack` 等），是所有模块类型定义的唯一真实来源（Source of Truth）。
- **`demo/`**: 一个具体的应用实现，目前是前端的卡牌游戏演示。
  - **`demo/src/types/index.ts`**: 该文件通过 `export * from '../../../common/types'` 的方式，直接复用 `common` 目录下的类型定义。这使得 `demo` 应用内的代码可以从一个固定的本地路径导入类型，而无需关心共享目录的层级，保持了代码的整洁性。

这种结构将共享的核心逻辑与具体实现分离，是典型的 Monorepo 设计模式，有利于代码复用和长期维护。 