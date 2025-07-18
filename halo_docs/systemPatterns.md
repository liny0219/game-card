# 系统架构模式

## 总体架构

### 🎯 游戏玩法优先架构（Gameplay-First Architecture）
**核心思想**：以游戏玩法类型作为系统的第一维度，所有功能模块都围绕当前选择的玩法展开。

**架构特点**：
- **URL驱动**：通过路由参数(/:gameplayType/page)确定当前玩法上下文
- **上下文隔离**：每种玩法拥有独立的数据空间和功能逻辑
- **一致的用户体验**：统一的页面结构和导航模式
- **简化的管理**：移除复杂的过滤器，使用URL参数直接定位

**实现模式**：
```typescript
// GameplayContext: 路径解析式上下文
const extractGameplayTypeFromPath = (pathname: string): GameplayType | null => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const potentialGameplayType = segments[0];
    const supportedTypes = Object.keys(GAMEPLAY_CONFIG) as GameplayType[];
    if (supportedTypes.includes(potentialGameplayType as GameplayType)) {
      return potentialGameplayType as GameplayType;
    }
  }
  return null;
};

// 页面组件: 玩法优先的数据加载
useEffect(() => {
  if (user && currentGameplayType) {
    loadGameplaySpecificData();
  }
}, [user, currentGameplayType]);
```

**路由结构**：
- `/` - 首页（玩法选择）
- `/:gameplayType/gacha` - 特定玩法的抽卡页面
- `/:gameplayType/collection` - 特定玩法的收藏页面
- `/:gameplayType/statistics` - 特定玩法的统计页面
- `/:gameplayType/history` - 特定玩法的历史页面
- `/admin/:gameplayType` - 特定玩法的管理页面

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

## UI样式冲突避免模式

### 1. 文字可见性保证模式
**问题**：全局深色主题与表单元素的文字颜色冲突，导致文字不可见

**原因分析**：
- 全局CSS设置了 `body { @apply text-white; }` 白色文字
- 表单元素（select、input、textarea）设置了白色背景但未明确指定文字颜色
- 浏览器继承了全局的白色文字样式，导致白色文字配白色背景不可见

**解决方案**：
```css
/* 1. 全局CSS强制规则 - src/index.css */
@layer components {
  /* 确保所有表单元素的文字颜色正确 */
  select, input, textarea {
    color: #1f2937 !important; /* 深灰色文字 */
  }
  
  select option {
    color: #1f2937 !important; /* 选项文字 */
    background-color: white !important; /* 选项背景 */
  }
  
  /* 确保按钮文字可见 */
  button {
    color: inherit !important; /* 继承按钮样式中定义的颜色 */
  }
  
  /* 确保链接文字可见 */
  a {
    color: #3b82f6 !important; /* 蓝色链接 */
  }
  
  /* 确保标签文字可见 */
  label {
    color: #374151 !important; /* 深灰色标签 */
  }
}
```

```typescript
// 2. React组件内联样式保险 - 适用于关键组件
<select
  className="w-full p-2 border rounded-md text-gray-900 bg-white"
  style={{ 
    color: '#1f2937',           // 文字颜色
    backgroundColor: 'white'     // 背景颜色
  }}
>
```

### 2. 对比度检查模式
**预防措施**：在开发时检查文字与背景的对比度

**实施方法**：
```typescript
// 开发时的对比度检查工具函数
const checkContrast = (textColor: string, backgroundColor: string) => {
  // WCAG 2.1 AA标准要求对比度至少为4.5:1
  const contrast = calculateContrast(textColor, backgroundColor);
  if (contrast < 4.5) {
    console.warn(`对比度不足: ${contrast}, 建议调整颜色`);
  }
  return contrast >= 4.5;
};

// 在开发环境中使用
if (process.env.NODE_ENV === 'development') {
  checkContrast('#ffffff', '#ffffff'); // 会警告
}
```

### 3. 样式优先级管理模式
**CSS优先级策略**：
1. **全局基础样式** - 最低优先级
2. **组件样式类** - 中等优先级  
3. **关键元素内联样式** - 最高优先级
4. **!important规则** - 紧急修复用

```css
/* 优先级管理示例 */
/* 1. 全局基础 */
body { color: white; }

/* 2. 组件类 */
.form-input { color: #1f2937; }

/* 3. 具体元素（最高优先级用于关键表单元素） */
select, input[type="text"], textarea {
  color: #1f2937 !important;
}
```

### 4. 主题一致性模式
**深色主题与浅色表单的协调**：

```typescript
// 主题配置
const theme = {
  // 页面主体使用深色主题
  page: {
    background: 'bg-gray-900',
    text: 'text-white',
  },
  // 表单元素使用浅色主题确保可读性
  form: {
    background: 'bg-white',
    text: 'text-gray-900',
    border: 'border-gray-300',
    focus: 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
  },
  // 卡片等内容区域使用中等色调
  card: {
    background: 'bg-gray-800',
    text: 'text-white',
    border: 'border-gray-700'
  }
};

// 标准化的表单组件样式
const FORM_INPUT_CLASSES = `
  w-full p-2 border rounded-md 
  text-gray-900 bg-white border-gray-300 
  focus:border-blue-500 focus:ring-1 focus:ring-blue-500
`;
```

### 5. 通用可访问性模式
**ARIA和语义化确保可访问性**：

```typescript
// 表单元素的完整可访问性实现
<div>
  <label 
    htmlFor="gameplayType"
    className="block text-sm font-medium text-gray-700 mb-2"
    style={{ color: '#374151' }} // 确保标签可见
  >
    玩法类型
  </label>
  <select
    id="gameplayType"
    value={selectedType}
    onChange={handleChange}
    className={FORM_INPUT_CLASSES}
    style={{ color: '#1f2937' }} // 确保文字可见
    aria-label="选择游戏玩法类型"
  >
    <option value="">请选择...</option>
    {options.map(option => (
      <option 
        key={option.value} 
        value={option.value}
        style={{ color: '#1f2937', backgroundColor: 'white' }}
      >
        {option.label}
      </option>
    ))}
  </select>
</div>
```

### 6. 样式测试模式
**自动化检测样式冲突**：

```typescript
// 样式冲突检测的单元测试
describe('UI Contrast Tests', () => {
  it('should have sufficient contrast for all form elements', () => {
    const formElements = screen.getAllByRole(/textbox|combobox|button/);
    formElements.forEach(element => {
      const styles = getComputedStyle(element);
      const textColor = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      expect(calculateContrast(textColor, backgroundColor))
        .toBeGreaterThanOrEqual(4.5);
    });
  });
  
  it('should not have invisible text', () => {
    const textElements = screen.getAllByText(/./);
    textElements.forEach(element => {
      const styles = getComputedStyle(element);
      expect(styles.color).not.toBe(styles.backgroundColor);
    });
  });
});
```

### 7. 浏览器兼容性模式
**跨浏览器的文字可见性保证**：

```css
/* 浏览器特定的修复 */
/* Chrome/Safari */
select::-webkit-appearance-none {
  color: #1f2937 !important;
}

/* Firefox */
select:-moz-appearance-none {
  color: #1f2937 !important;
}

/* IE/Edge */
select::-ms-expand {
  color: #1f2937 !important;
}

/* 统一的表单元素样式 */
input, select, textarea {
  color: #1f2937 !important;
  background-color: white !important;
  
  /* 确保placeholder可见 */
  &::placeholder {
    color: #9ca3af !important;
    opacity: 1 !important;
  }
}
```

### 8. 开发规范模式
**团队开发规范**：

```typescript
// 1. 禁止的模式（容易出问题）
❌ className="text-white bg-white"        // 白色文字配白色背景
❌ className="text-gray-900 bg-gray-900"  // 深色文字配深色背景

// 2. 推荐的模式（安全可见）
✅ className="text-gray-900 bg-white"     // 深色文字配浅色背景
✅ className="text-white bg-gray-900"     // 浅色文字配深色背景

// 3. 关键元素必须添加内联样式保险
✅ style={{ color: '#1f2937', backgroundColor: 'white' }}

// 4. 使用预定义的安全组合
const SAFE_FORM_STYLES = {
  input: "text-gray-900 bg-white border-gray-300",
  button: "text-white bg-blue-600 hover:bg-blue-700",
  label: "text-gray-700",
  error: "text-red-600",
  success: "text-green-600"
};
```

### 9. 渐进增强模式
**确保基本功能在任何情况下都可用**：

```css
/* 基础样式 - 即使CSS失效也能看见 */
html {
  color: black;
  background: white;
}

/* 增强样式 - 在CSS正常加载时应用 */
body {
  color: white;
  background: #111827;
}

/* 关键元素强制样式 - 确保表单始终可用 */
input, select, textarea, button {
  color: black !important;
  background: white !important;
  border: 1px solid #ccc !important;
}
```

**记忆要点**：
1. **永远确保表单元素的文字颜色明确指定**
2. **使用内联样式作为关键元素的保险**
3. **全局CSS规则用!important确保优先级**
4. **开发时检查对比度，测试时验证可见性**
5. **深色主题页面 + 浅色表单元素 = 最佳实践** 