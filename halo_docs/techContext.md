# 技术上下文

## 技术栈概览

### 前端框架
- **React 18**：现代化React开发，使用函数组件和Hooks
- **TypeScript 5.0+**：类型安全的JavaScript，提供完整的类型定义
- **JSX**：React组件的声明式语法

### 构建工具
- **Vite**：快速的现代构建工具
  - 热更新开发服务器
  - ES模块支持
  - 优化的生产构建
- **PostCSS**：CSS后处理器
- **Autoprefixer**：自动添加CSS前缀

### 样式系统
- **Tailwind CSS 3.3+**：实用优先的CSS框架
  - 响应式设计支持
  - 自定义主题和颜色
  - 稀有度颜色系统
  - 自定义动画和关键帧
- **CSS-in-JS**：组件级样式管理

### 状态管理
- **React Context**：全局状态管理
  - DataContext：数据适配层管理
  - UserContext：用户状态管理
- **React Hooks**：本地状态管理
  - useState：组件状态
  - useEffect：副作用处理
  - useContext：上下文访问

### 数据管理
- **适配层架构**：统一的数据访问接口
  - DataAdapter接口：抽象数据操作
  - LocalStorageAdapter：本地存储实现
  - 支持后续扩展其他适配器
- **localStorage**：主要数据持久化
- **sessionStorage**：临时数据存储
- **缓存系统**：内存缓存提升性能

### 路由管理
- **React Router DOM v6**：客户端路由
  - BrowserRouter：浏览器路由
  - Routes/Route：路由配置
  - Link：导航链接
  - useLocation：路由状态

### 数据获取
- **TanStack Query (React Query)**：服务端状态管理
  - 数据缓存和同步
  - 后台数据更新
  - 错误处理和重试
  - 查询失效和重新获取

### 动画效果
- **Framer Motion**：声明式动画库
  - 组件动画
  - 页面过渡
  - 手势支持
  - 抽卡动画效果

### 表单处理
- **React Hook Form**：高性能表单库
  - 最小重渲染
  - 内置验证
  - 易于集成
  - 管理界面表单

### 图表可视化
- **Chart.js**：图表库
- **React-Chartjs-2**：React集成
  - 统计数据可视化
  - 响应式图表
  - 多种图表类型

### UI组件
- **Lucide React**：图标库
- **React Toastify**：通知提示
- **自定义组件**：业务特定组件

### 工具库
- **UUID**：唯一标识符生成
- **date-fns**：日期处理
- **clsx**：条件CSS类名
- **Zod**：运行时类型验证

### 开发工具
- **ESLint**：代码质量检查
- **Prettier**：代码格式化
- **TypeScript编译器**：类型检查
- **Vite开发服务器**：热更新开发

### 测试工具（配置但未使用）
- **Jest**：JavaScript测试框架
- **Testing Library**：React组件测试
- **jsdom**：DOM环境模拟

### 文档工具（配置但未使用）
- **Storybook**：组件文档和开发

## 架构设计

### 项目结构
```
src/
├── components/          # 可复用组件
│   ├── Navbar.tsx      # 导航栏
│   └── GlobalModal.tsx # 全局模态框
├── pages/              # 页面组件
│   ├── HomePage.tsx    # 首页
│   ├── GachaPage.tsx   # 抽卡页面
│   ├── CollectionPage.tsx # 收藏页面
│   ├── StatisticsPage.tsx # 统计页面
│   ├── HistoryPage.tsx    # 历史页面
│   └── AdminPage.tsx      # 管理页面
├── context/            # React上下文
│   ├── DataContext.tsx # 数据上下文
│   └── UserContext.tsx # 用户上下文
├── adapters/           # 数据适配层
│   └── LocalStorageAdapter.ts # 本地存储适配器
├── types/              # TypeScript类型定义
│   └── index.ts        # 所有类型定义
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

### 数据流架构
1. **UI层**：React组件处理用户交互
2. **状态层**：Context提供全局状态管理
3. **适配层**：DataAdapter统一数据访问接口
4. **存储层**：localStorage进行数据持久化

### 组件设计原则
- **单一职责**：每个组件只负责一个功能
- **可复用性**：通用组件可在多处使用
- **类型安全**：完整的TypeScript类型定义
- **响应式**：适配不同屏幕尺寸

### 状态管理模式
- **本地状态**：组件内部使用useState
- **全局状态**：跨组件共享使用Context
- **服务端状态**：数据获取使用React Query
- **持久化状态**：重要数据存储到localStorage

## 配置文件

### Vite配置 (vite.config.ts)
- React插件支持
- 路径别名配置
- 开发服务器配置
- 构建输出配置

### TypeScript配置 (tsconfig.json)
- ES2020目标
- 严格类型检查
- 路径映射支持
- React JSX支持

### Tailwind配置 (tailwind.config.js)
- 内容扫描路径
- 自定义颜色主题
- 稀有度颜色系统
- 自定义动画配置

### 包管理 (package.json)
- 依赖管理
- 脚本命令
- 项目元信息
- 开发工具配置

## 开发环境

### 环境要求
- Node.js 18+
- npm 9+
- 现代浏览器支持

### 开发命令
- `npm run dev`：启动开发服务器
- `npm run build`：构建生产版本
- `npm run preview`：预览生产构建
- `npm run lint`：代码质量检查
- `npm run format`：代码格式化

### 构建输出
- **dist/**：生产构建输出
- **源码映射**：调试支持
- **资源优化**：压缩和缓存

## 部署和扩展

### 部署方式
- **静态网站托管**：GitHub Pages、Netlify、Vercel
- **CDN部署**：全球加速访问
- **容器化**：Docker部署支持

### 扩展可能性
- **后端集成**：通过新的DataAdapter对接API
- **数据库支持**：IndexedDB或远程数据库
- **移动应用**：React Native或Capacitor
- **PWA支持**：离线功能和应用安装

### 性能优化
- **代码分割**：按需加载
- **缓存策略**：智能缓存系统
- **图片优化**：本地生成的PNG图片
- **包体积优化**：Tree-shaking和压缩

## 开发最佳实践

### 代码规范
- **ESLint规则**：统一代码风格
- **Prettier格式化**：自动格式化
- **TypeScript严格模式**：类型安全
- **组件命名**：PascalCase命名

### 错误处理
- **全局错误边界**：React错误捕获
- **API错误处理**：统一错误处理机制
- **用户友好提示**：Toast通知系统
- **开发调试**：详细的错误日志

### 性能监控
- **React DevTools**：组件性能分析
- **浏览器DevTools**：网络和性能监控
- **缓存命中率**：数据访问优化
- **包大小分析**：构建优化 