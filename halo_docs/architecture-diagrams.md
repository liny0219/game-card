# 项目架构图和流程图

## 系统架构图

### 整体架构
```mermaid
graph TB
    subgraph "用户界面层 (UI)"
        UI1[抽卡界面]
        UI2[收藏界面]
        UI3[统计界面]
        UI4[历史界面]
        UI5[管理界面]
    end
    
    subgraph "业务逻辑层 (BL)"
        BL1[抽卡系统]
        BL2[用户系统]
        BL3[统计系统]
        BL4[管理系统]
        BL5[ECS系统]
    end
    
    subgraph "数据访问层 (DA)"
        DA1[DataAdapter<br/>适配器模式]
    end
    
    subgraph "数据存储层 (DS)"
        DS1[LocalStorage<br/>客户端存储]
    end
    
    UI1 --> BL1
    UI2 --> BL2
    UI3 --> BL3
    UI4 --> BL2
    UI5 --> BL4
    
    BL1 --> DA1
    BL2 --> DA1
    BL3 --> DA1
    BL4 --> DA1
    BL5 --> DA1
    
    DA1 --> DS1
```

### 双系统架构
```mermaid
graph TB
    subgraph "现有系统 (抽卡系统 - 已完成)"
        GACHA[抽卡]
        COLLECT[收藏]
        STATS[统计]
        HISTORY[历史]
        ADMIN[管理]
        USER[用户]
        PACK[卡包]
        
        subgraph "技术架构"
            TECH1[传统React + 数据驱动]
            TECH2[不依赖ECS架构]
        end
    end
    
    subgraph "未来系统 (ECS玩法系统 - 待开发)"
        COMBAT[战斗]
        MOVE[移动]
        AI[AI]
        SKILL[技能]
        EFFECT[效果]
        BAG[背包]
        STATUS[状态]
        
        subgraph "技术架构"
            TECH3[实体-组件-系统架构]
            TECH4[核心依赖ECS架构]
        end
    end
```

## ECS架构图

### ECS核心架构
```mermaid
graph TB
    subgraph "ECS系统架构"
        EM[EntityManager<br/>实体管理器]
        CM[ComponentManager<br/>组件管理器]
        SM[SystemManager<br/>系统管理器]
        GL[GameLoop<br/>游戏循环]
    end
    
    subgraph "核心概念"
        E[Entity<br/>实体]
        C[Component<br/>组件]
        S[System<br/>系统]
    end
    
    subgraph "具体实现"
        P[Player<br/>玩家]
        EN[Enemy<br/>敌人]
        I[Item<br/>物品]
        
        POS[Position<br/>位置]
        H[Health<br/>生命值]
        SK[Skill<br/>技能]
        
        MV[Movement<br/>移动]
        CB[Combat<br/>战斗]
        AI[AI<br/>人工智能]
    end
    
    EM --> E
    CM --> C
    SM --> S
    GL --> SM
    
    E --> P
    E --> EN
    E --> I
    
    C --> POS
    C --> H
    C --> SK
    
    S --> MV
    S --> CB
    S --> AI
```

### 组件关系图
```mermaid
graph LR
    subgraph "ECS核心"
        E[Entity<br/>实体]
        C[Component<br/>组件]
        S[System<br/>系统]
    end
    
    subgraph "实体示例"
        P[Player<br/>玩家]
        EN[Enemy<br/>敌人]
    end
    
    subgraph "组件示例"
        POS[Position<br/>位置]
        H[Health<br/>生命值]
        SK[Skill<br/>技能]
    end
    
    subgraph "系统示例"
        MS[Movement<br/>移动]
        CS[Combat<br/>战斗]
        SS[Skill<br/>技能]
    end
    
    E --> P
    E --> EN
    
    C --> POS
    C --> H
    C --> SK
    
    S --> MS
    S --> CS
    S --> SS
    
    P --> POS
    P --> H
    P --> SK
    
    EN --> POS
    EN --> H
    
    MS --> POS
    CS --> H
    SS --> SK
```

## 数据流图

### 抽卡系统数据流
```mermaid
flowchart LR
    A[用户操作] --> B[抽卡请求]
    B --> C[概率计算]
    C --> D[结果生成]
    D --> E[结果处理]
    E --> F[历史记录]
    F --> G[保底检查]
    G --> H[数据更新]
    H --> I[UI更新]
    
    style A fill:#e1f5fe
    style I fill:#e8f5e8
```

### ECS系统数据流
```mermaid
flowchart LR
    A[管理界面] --> B[模板配置]
    B --> C[实体工厂]
    C --> D[ECS系统]
    D --> E[游戏循环]
    E --> F[系统执行]
    F --> G[状态更新]
    G --> H[游戏界面]
    
    style A fill:#e1f5fe
    style H fill:#e8f5e8
```

### 模板驱动数据流
```mermaid
flowchart LR
    A[CardTemplate<br/>卡片模板] --> B[SkillBinding<br/>技能绑定]
    B --> C[EntityFactory<br/>实体工厂]
    C --> D[Entity<br/>实体]
    
    A1[Schema配置] --> A
    B1[Skill配置] --> B
    C1[Component生成] --> C
    D1[Component实例] --> D
    
    style A fill:#e1f5fe
    style D fill:#e8f5e8
```

## 时序图

### 抽卡流程时序图
```mermaid
sequenceDiagram
    participant U as 用户
    participant G as 抽卡页面
    participant D as 数据适配器
    participant L as LocalStorage
    
    U->>G: 点击抽卡
    G->>D: 抽卡请求
    D->>L: 读取数据
    L-->>D: 返回数据
    G->>D: 概率计算
    G->>D: 结果生成
    D->>L: 保存结果
    G-->>U: 更新UI
```

### ECS系统时序图
```mermaid
sequenceDiagram
    participant A as 管理界面
    participant F as 实体工厂
    participant E as EntityManager
    participant C as ComponentManager
    participant S as SystemManager
    
    A->>F: 配置模板
    F->>E: 创建实体
    E->>C: 生成组件
    C->>S: 注册系统
    S->>S: 开始游戏循环
    S-->>S: 系统执行
```

## ER图

### 抽卡系统ER图
```mermaid
erDiagram
    User {
        string id PK
        string username
        string email
        object currencies
        object statistics
        datetime createdAt
        datetime updatedAt
    }
    
    UserCard {
        string id PK
        string userId FK
        string cardId FK
        int quantity
        datetime obtainedAt
    }
    
    Card {
        string id PK
        string name
        string description
        string rarity
        string imageUrl
        string templateId
        object attributes
        datetime createdAt
        datetime updatedAt
    }
    
    GachaHistory {
        string id PK
        string userId FK
        string packId FK
        int quantity
        object result
        datetime createdAt
    }
    
    CardPack {
        string id PK
        string name
        string description
        int cost
        string currency
        object probabilities
        datetime createdAt
        datetime updatedAt
    }
    
    CardTemplate {
        string id PK
        string name
        string description
        object schema
        object skillBindings
        string gameplayType
        datetime createdAt
        datetime updatedAt
    }
    
    User ||--o{ UserCard : has
    User ||--o{ GachaHistory : creates
    Card ||--o{ UserCard : collected_by
    CardPack ||--o{ GachaHistory : used_in
    CardTemplate ||--o{ Card : defines
```

### ECS系统ER图
```mermaid
erDiagram
    Entity {
        string id PK
        string type
        datetime createdAt
        datetime updatedAt
    }
    
    Component {
        string id PK
        string entityId FK
        string type
        object data
        datetime createdAt
        datetime updatedAt
    }
    
    System {
        string id PK
        string name
        int priority
        boolean enabled
        datetime createdAt
        datetime updatedAt
    }
    
    SkillComponent {
        string entityId FK
        string skillId
        int level
        int cooldown
        int manaCost
        datetime lastUsedAt
        datetime createdAt
        datetime updatedAt
    }
    
    PositionComponent {
        string entityId FK
        float x
        float y
        float z
        float rotation
        float scale
        datetime createdAt
        datetime updatedAt
    }
    
    HealthComponent {
        string entityId FK
        int current
        int max
        boolean isAlive
        int regen
        datetime createdAt
        datetime updatedAt
    }
    
    Entity ||--o{ Component : has
    Entity ||--o{ SkillComponent : has
    Entity ||--o{ PositionComponent : has
    Entity ||--o{ HealthComponent : has
```

## 组件图

### 系统组件关系
```mermaid
graph TB
    subgraph "页面组件"
        AP[AdminPage<br/>管理页面]
        GP[GachaPage<br/>抽卡页面]
        CP[CollectionPage<br/>收藏页面]
        SP[StatisticsPage<br/>统计页面]
        HP[HistoryPage<br/>历史页面]
    end
    
    subgraph "Context组件"
        DC[DataContext<br/>数据上下文]
        UC[UserContext<br/>用户上下文]
        GC[GameplayContext<br/>玩法上下文]
    end
    
    subgraph "核心组件"
        LA[LocalStorage<br/>适配器]
        CS[Cache<br/>系统]
        TS[Types<br/>系统]
    end
    
    AP --> DC
    GP --> UC
    CP --> DC
    SP --> UC
    HP --> UC
    
    DC --> LA
    UC --> CS
    GC --> TS
    
    subgraph "管理页面功能"
        AP1[模板管理]
        AP2[技能配置]
        AP3[数据管理]
    end
    
    subgraph "抽卡页面功能"
        GP1[抽卡界面]
        GP2[概率计算]
        GP3[结果展示]
    end
    
    subgraph "收藏页面功能"
        CP1[收藏展示]
        CP2[卡片管理]
        CP3[筛选功能]
    end
    
    AP --> AP1
    AP --> AP2
    AP --> AP3
    
    GP --> GP1
    GP --> GP2
    GP --> GP3
    
    CP --> CP1
    CP --> CP2
    CP --> CP3
```

### ECS组件关系
```mermaid
graph TB
    subgraph "ECS核心组件"
        EM[EntityManager<br/>实体管理器]
        CM[ComponentManager<br/>组件管理器]
        SM[SystemManager<br/>系统管理器]
        GL[GameLoop<br/>游戏循环]
    end
    
    subgraph "工厂组件"
        EF[EntityFactory<br/>实体工厂]
        TS[Template<br/>系统]
    end
    
    subgraph "EntityManager功能"
        EM1[实体创建]
        EM2[实体销毁]
        EM3[实体查询]
        EM4[生命周期]
    end
    
    subgraph "ComponentManager功能"
        CM1[组件添加]
        CM2[组件移除]
        CM3[组件查询]
        CM4[数据缓存]
    end
    
    subgraph "SystemManager功能"
        SM1[系统注册]
        SM2[系统执行]
        SM3[优先级管理]
        SM4[依赖管理]
    end
    
    subgraph "GameLoop功能"
        GL1[主循环]
        GL2[时间管理]
        GL3[性能监控]
        GL4[调试支持]
    end
    
    subgraph "EntityFactory功能"
        EF1[模板创建]
        EF2[组件生成]
        EF3[状态初始化]
        EF4[热更新]
    end
    
    subgraph "Template系统功能"
        TS1[模板管理]
        TS2[配置验证]
        TS3[数据同步]
        TS4[版本控制]
    end
    
    EM --> EM1
    EM --> EM2
    EM --> EM3
    EM --> EM4
    
    CM --> CM1
    CM --> CM2
    CM --> CM3
    CM --> CM4
    
    SM --> SM1
    SM --> SM2
    SM --> SM3
    SM --> SM4
    
    GL --> GL1
    GL --> GL2
    GL --> GL3
    GL --> GL4
    
    EF --> EF1
    EF --> EF2
    EF --> EF3
    EF --> EF4
    
    TS --> TS1
    TS --> TS2
    TS --> TS3
    TS --> TS4
```

## 部署架构图

### 当前部署架构
```mermaid
graph TB
    subgraph "浏览器环境"
        CHROME[Chrome]
        FIREFOX[Firefox]
        SAFARI[Safari]
    end
    
    subgraph "React应用"
        PAGES[Pages<br/>页面组件]
        COMPONENTS[Components<br/>UI组件]
        CONTEXT[Context<br/>状态管理]
        ADAPTERS[Adapters<br/>数据适配器]
        TYPES[Types<br/>类型定义]
        UTILS[Utils<br/>工具函数]
    end
    
    subgraph "数据存储"
        LS[LocalStorage<br/>本地存储]
        LS_USER[用户数据]
        LS_CARD[卡片数据]
        LS_CONFIG[配置数据]
    end
    
    CHROME --> PAGES
    FIREFOX --> PAGES
    SAFARI --> PAGES
    
    PAGES --> COMPONENTS
    COMPONENTS --> CONTEXT
    CONTEXT --> ADAPTERS
    ADAPTERS --> TYPES
    TYPES --> UTILS
    
    ADAPTERS --> LS
    LS --> LS_USER
    LS --> LS_CARD
    LS --> LS_CONFIG
```

### 未来部署架构
```mermaid
graph TB
    subgraph "浏览器环境"
        CHROME[Chrome]
        FIREFOX[Firefox]
        SAFARI[Safari]
    end
    
    subgraph "React应用"
        GACHA_SYS[抽卡系统<br/>客户端]
        ECS_SYS[ECS系统<br/>客户端]
        ADMIN_UI[管理界面<br/>客户端]
    end
    
    subgraph "共享组件"
        LS_ADAPTER[LocalStorage<br/>适配器]
        CACHE_SYS[Cache<br/>系统]
        TYPES_SYS[Types<br/>系统]
    end
    
    subgraph "数据存储"
        LS[LocalStorage<br/>本地存储]
        LS_GACHA[抽卡数据]
        LS_USER[用户数据]
        LS_TEMPLATE[模板数据]
        LS_ECS[ECS数据]
    end
    
    CHROME --> GACHA_SYS
    FIREFOX --> ECS_SYS
    SAFARI --> ADMIN_UI
    
    GACHA_SYS --> LS_ADAPTER
    ECS_SYS --> CACHE_SYS
    ADMIN_UI --> TYPES_SYS
    
    LS_ADAPTER --> LS
    CACHE_SYS --> LS
    TYPES_SYS --> LS
    
    LS --> LS_GACHA
    LS --> LS_USER
    LS --> LS_TEMPLATE
    LS --> LS_ECS
```

## 状态图

### 抽卡系统状态图
```mermaid
stateDiagram-v2
    [*] --> 空闲状态
    空闲状态 --> 抽卡中: 点击抽卡
    抽卡中 --> 计算概率: 读取数据
    计算概率 --> 生成结果: 概率计算
    生成结果 --> 检查保底: 结果生成
    检查保底 --> 更新数据: 保底检查
    更新数据 --> 显示结果: 数据更新
    显示结果 --> 空闲状态: 完成
    
    抽卡中 --> 错误状态: 数据错误
    计算概率 --> 错误状态: 概率错误
    生成结果 --> 错误状态: 生成错误
    错误状态 --> 空闲状态: 重试
```

### ECS系统状态图
```mermaid
stateDiagram-v2
    [*] --> 初始化
    初始化 --> 模板加载: 加载配置
    模板加载 --> 实体创建: 配置验证
    实体创建 --> 组件生成: 实体创建
    组件生成 --> 系统注册: 组件生成
    系统注册 --> 游戏循环: 系统注册
    游戏循环 --> 系统执行: 开始循环
    系统执行 --> 状态更新: 执行逻辑
    状态更新 --> 游戏循环: 更新完成
    
    模板加载 --> 错误状态: 配置错误
    实体创建 --> 错误状态: 创建错误
    组件生成 --> 错误状态: 生成错误
    系统注册 --> 错误状态: 注册错误
    错误状态 --> 初始化: 重试
```

## 类图

### 核心类关系
```mermaid
classDiagram
    class Entity {
        +id: string
        +type: string
        +components: Component[]
        +create()
        +destroy()
        +addComponent()
        +removeComponent()
        +getComponent()
    }
    class Component {
        +entityId: string
        +type: string
        +data: object
        +update()
        +serialize()
        +deserialize()
    }
    class System {
        +name: string
        +priority: int
        +enabled: bool
        +update(deltaTime)
    }
    class EntityManager {
        +createEntity(type)
        +destroyEntity(id)
        +getEntity(id)
    }
    class ComponentManager {
        +addComponent(entityId, component)
        +removeComponent(entityId, componentType)
        +getComponent(entityId, componentType)
    }
    class SystemManager {
        +registerSystem(system)
        +unregisterSystem(system)
        +update(deltaTime)
    }
    class GameLoop {
        +start()
        +stop()
        +update()
    }
    Entity "1" o-- "*" Component : contains
    EntityManager "1" o-- "*" Entity : manages
    ComponentManager "1" o-- "*" Component : manages
    SystemManager "1" o-- "*" System : manages
    GameLoop --> SystemManager : updates
    System --> Component : processes
``` 