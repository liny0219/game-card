# 系统架构模式

## 总体架构

### 分层架构
系统采用经典的分层架构模式，从上到下分为：
1. **表现层（UI Layer）**：React组件和页面
2. **业务逻辑层（Business Layer）**：Context和自定义Hooks
3. **数据访问层（Data Access Layer）**：适配器模式
4. **数据持久层（Persistence Layer）**：localStorage

### 核心设计原则
- **单一职责原则**：每个组件和模块只负责一个功能
- **依赖倒置原则**：高层模块不依赖低层模块，都依赖抽象
- **开闭原则**：对扩展开放，对修改关闭
- **接口隔离原则**：不应该依赖不需要的接口

## 设计模式

### 1. 适配器模式（Adapter Pattern）
**目的**：提供统一的数据访问接口，屏蔽底层存储细节

**实现**：
```typescript
// 抽象接口
interface DataAdapter {
  getUser(id: string): Promise<User | null>;
  updateUser(user: User): Promise<void>;
  performGacha(request: GachaRequest): Promise<GachaResult>;
  // ... 其他方法
}

// 具体实现
class LocalStorageAdapter implements DataAdapter {
  // localStorage具体实现
}

// 未来可扩展
class ApiAdapter implements DataAdapter {
  // HTTP API实现
}
```

**优势**：
- 业务逻辑与存储方式解耦
- 便于单元测试（可以mock适配器）
- 支持多种存储方式（localStorage、API、IndexedDB）
- 便于后续迁移到服务端

### 2. 上下文模式（Context Pattern）
**目的**：提供全局状态管理，避免prop drilling

**实现**：
```typescript
// 数据上下文
const DataContext = createContext<DataContextType>();

// 用户上下文
const UserContext = createContext<UserContextType>();

// 使用Context
const { user, refreshUser } = useUser();
const dataAdapter = useDataAdapter();
```

**优势**：
- 状态共享简单
- 避免层层传递props
- 统一的状态管理
- 便于状态更新和同步

### 3. 观察者模式（Observer Pattern）
**目的**：实现组件间的松耦合通信

**实现**：
- React的useEffect监听状态变化
- Context状态变化自动通知所有订阅组件
- 用户状态变化触发UI更新

### 4. 策略模式（Strategy Pattern）
**目的**：支持不同的抽卡策略和概率计算

**实现**：
```typescript
// 抽卡策略接口
interface GachaStrategy {
  calculateProbability(pity: number): number;
  shouldTriggerPity(pity: number): boolean;
}

// 不同保底策略
class StandardPityStrategy implements GachaStrategy { }
class SoftPityStrategy implements GachaStrategy { }
```

### 5. 工厂模式（Factory Pattern）
**目的**：创建不同类型的卡牌和用户对象

**实现**：
```typescript
// 用户工厂
async createDefaultUser(): Promise<User> {
  return {
    id: uuidv4(),
    username: 'Player',
    currencies: { GOLD: 10000, TICKET: 100, PREMIUM: 50 },
    // ... 其他默认值
  };
}
```

### 6. 单例模式（Singleton Pattern）
**目的**：确保适配器实例唯一性

**实现**：
```typescript
// DataContext确保适配器单例
export function DataContextProvider({ children }) {
  const dataAdapter = new LocalStorageAdapter(); // 单例
  return (
    <DataContext.Provider value={{ dataAdapter }}>
      {children}
    </DataContext.Provider>
  );
}
```

## 数据流模式

### 1. 单向数据流
遵循React的单向数据流原则：
```
用户操作 → 事件处理 → 状态更新 → UI重新渲染
```

### 2. 状态提升
将共享状态提升到最近的公共父组件：
- 用户状态 → UserContext
- 数据访问 → DataContext
- 页面状态 → 页面组件

### 3. 数据获取模式
使用React Query进行数据获取：
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => dataAdapter.getUser(userId),
  staleTime: 5 * 60 * 1000, // 5分钟
});
```

## 组件架构模式

### 1. 容器组件 vs 展示组件
- **容器组件**：负责数据获取和状态管理（如页面组件）
- **展示组件**：负责UI渲染（如卡牌组件）

### 2. 高阶组件（HOC）
虽然项目中未大量使用，但Context Provider本质上是HOC：
```typescript
export function withDataAdapter<P>(Component: React.ComponentType<P>) {
  return (props: P) => (
    <DataContextProvider>
      <Component {...props} />
    </DataContextProvider>
  );
}
```

### 3. 复合组件模式
导航栏组件展示了复合组件的设计：
```typescript
// 导航栏包含多个子组件
<Navbar>
  <Logo />
  <Navigation />
  <UserInfo />
</Navbar>
```

## 错误处理模式

### 1. 错误边界模式
使用React错误边界捕获组件错误：
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // 错误处理逻辑
  }
}
```

### 2. 统一错误处理
适配器层统一处理错误：
```typescript
async performGacha(request: GachaRequest): Promise<GachaResult> {
  try {
    // 业务逻辑
  } catch (error) {
    throw new GachaError(ErrorType.INSUFFICIENT_CURRENCY, '货币不足');
  }
}
```

### 3. 用户友好错误提示
使用Toast通知展示错误信息：
```typescript
try {
  await dataAdapter.performGacha(request);
} catch (error) {
  toast.error(error.message);
}
```

## 性能优化模式

### 1. 缓存模式
适配器层实现内存缓存：
```typescript
private cache = new Map<string, CacheItem>();

private getFromCache<T>(key: string): T | null {
  const item = this.cache.get(key);
  if (item && Date.now() < item.timestamp + item.ttl) {
    return item.data;
  }
  return null;
}
```

### 2. 懒加载模式
使用React.lazy进行组件懒加载：
```typescript
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
```

### 3. 防抖和节流
在搜索和输入组件中使用防抖：
```typescript
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  [handleSearch]
);
```

## 扩展模式

### 1. 插件模式
通过适配器模式支持插件化扩展：
```typescript
// 可以轻松添加新的存储适配器
class DatabaseAdapter implements DataAdapter { }
class RedisAdapter implements DataAdapter { }
```

### 2. 中间件模式
在适配器中可以添加中间件：
```typescript
class LoggingMiddleware {
  async execute(operation: () => Promise<any>) {
    console.log('Operation started');
    const result = await operation();
    console.log('Operation completed');
    return result;
  }
}
```

### 3. 配置模式
支持运行时配置：
```typescript
interface AppConfig {
  storage: 'localStorage' | 'api' | 'indexedDB';
  apiUrl?: string;
  cacheTimeout: number;
}
```

## 测试模式

### 1. 依赖注入
通过Context注入依赖，便于测试：
```typescript
// 测试时可以注入Mock适配器
const mockAdapter = new MockDataAdapter();
<DataContext.Provider value={{ dataAdapter: mockAdapter }}>
  <TestComponent />
</DataContext.Provider>
```

### 2. 快照测试
对组件进行快照测试：
```typescript
it('renders correctly', () => {
  const tree = renderer.create(<CardComponent />).toJSON();
  expect(tree).toMatchSnapshot();
});
```

## 安全模式

### 1. 输入验证
使用Zod进行运行时类型验证：
```typescript
const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
});
```

### 2. 数据sanitization
在存储前清理用户输入：
```typescript
const sanitizedInput = input.trim().replace(/[<>]/g, '');
```

## 国际化模式

### 1. 资源文件模式
虽然当前是中文，但架构支持国际化：
```typescript
const messages = {
  'zh-CN': { welcome: '欢迎' },
  'en-US': { welcome: 'Welcome' },
};
```

### 2. 上下文本地化
可以通过Context提供本地化支持：
```typescript
const LocaleContext = createContext<LocaleContextType>();
```

这些模式的组合使用，使得系统具有良好的可维护性、可扩展性和可测试性。 