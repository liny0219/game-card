# 抽卡系统 Card Gacha System

一个基于React+TypeScript的前端抽卡系统，使用localStorage进行数据存储，设计了适配层架构便于后续对接服务端。

## 🎮 功能特点

### 🎯 核心功能
- **六级稀有度系统**：N、R、SR、SSR、UR、LR 完整稀有度等级
- **智能保底机制**：软保底 + 硬保底确保用户体验
- **货币系统**：支持金币、抽卡券、高级货币三种货币类型
- **单抽/十连抽**：支持单次抽卡和十连抽卡
- **用户账户系统**：完整的用户数据管理
- **抽卡历史记录**：详细的抽卡记录追踪
- **统计分析功能**：个人和全局数据统计
- **卡牌收藏系统**：完整的卡牌收集和管理

### 🛠️ 技术特点
- **纯前端实现**：无需后端服务器，开箱即用
- **适配层设计**：统一的数据访问接口，便于后续服务端对接
- **响应式设计**：适配桌面端和移动端
- **现代化UI**：基于Tailwind CSS的美观界面
- **动画效果**：流畅的抽卡动画和过渡效果

## 🚀 技术栈

### 前端技术
- **React 18** - 现代化React开发
- **TypeScript 5.0+** - 类型安全的JavaScript
- **Vite** - 快速的构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **React Router** - 客户端路由
- **React Query** - 服务端状态管理
- **Framer Motion** - 动画库
- **React Hook Form** - 表单处理
- **React Toastify** - 通知提示

### 数据存储
- **localStorage** - 主要数据存储
- **sessionStorage** - 临时数据存储
- **适配层架构** - 便于后续扩展

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **TypeScript** - 类型检查
- **Git** - 版本控制

## 📦 安装和使用

### 环境要求
- Node.js 18+
- npm 9+

### 1. 克隆项目
```bash
git clone <repository-url>
cd card-gacha-system
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 构建生产版本
```bash
npm run build
```

### 5. 预览生产版本
```bash
npm run preview
```

## 📝 项目结构

```
src/
├── components/          # React组件
│   ├── Navbar.tsx      # 导航栏
│   └── ...
├── pages/              # 页面组件
│   ├── HomePage.tsx    # 首页
│   ├── GachaPage.tsx   # 抽卡页面
│   ├── CollectionPage.tsx  # 收藏页面
│   ├── StatisticsPage.tsx  # 统计页面
│   └── HistoryPage.tsx     # 历史页面
├── context/            # React上下文
│   ├── DataContext.tsx # 数据上下文
│   └── UserContext.tsx # 用户上下文
├── adapters/           # 数据适配层
│   └── LocalStorageAdapter.ts  # localStorage适配器
├── types/              # TypeScript类型定义
│   └── index.ts        # 类型定义文件
├── utils/              # 工具函数
├── assets/             # 静态资源
├── styles/             # 样式文件
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 🎨 界面预览

### 首页
- 欢迎界面和功能导航
- 用户统计概览
- 稀有度等级展示

### 抽卡页面
- 卡包选择界面
- 抽卡动画效果
- 结果展示弹窗

### 收藏页面
- 卡牌网格展示
- 稀有度筛选
- 详细卡牌信息

### 统计页面
- 个人数据统计
- 全局数据分析
- 图表可视化

### 历史页面
- 抽卡记录列表
- 详细结果展示
- 时间排序

## 🔧 配置说明

### 卡牌配置
系统内置了完整的卡牌数据，包括：
- 30张N卡（普通卡片）
- 20张R卡（稀有卡片）
- 10张SR卡（超级稀有卡片）
- 5张SSR卡（史诗卡片）
- 3张UR卡（终极稀有卡片）
- 1张LR卡（传说卡片）

### 卡包配置
- **基础卡包**：使用金币购买，标准概率分布
- **高级卡包**：使用抽卡券购买，提高稀有卡牌概率

### 保底机制
- 硬保底：90抽必出SSR
- 软保底：75抽后概率逐渐增加
- 保底重置：获得保底后重新计算

## 🧩 适配层架构

### 数据适配层接口
```typescript
interface DataAdapter {
  // 用户相关
  getUser(id: string): Promise<User | null>;
  updateUser(user: User): Promise<void>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  
  // 卡牌相关
  getCards(): Promise<Card[]>;
  getUserCards(userId: string): Promise<UserCard[]>;
  
  // 抽卡相关
  performGacha(request: GachaRequest): Promise<GachaResult>;
  getGachaHistory(userId: string): Promise<GachaHistory[]>;
  
  // 统计相关
  getStatistics(): Promise<Statistics>;
  getUserStatistics(userId: string): Promise<UserStatistics>;
}
```

### 当前实现
- **LocalStorageAdapter**：基于localStorage的本地存储实现

### 未来扩展
- **ApiAdapter**：基于HTTP API的服务端实现
- **IndexedDBAdapter**：基于IndexedDB的本地数据库实现

## 🎯 抽卡算法

### 概率计算
- 使用伪随机数生成器确保公平性
- 支持自定义概率分布
- 实时保底加成计算

### 保底系统
- 软保底：接近最大保底时概率逐渐增加
- 硬保底：达到最大次数必出指定稀有度
- 保底计数器：独立管理每个卡包的保底状态

## 🔮 未来计划

### 短期目标
- [ ] 添加更多卡牌和卡包
- [ ] 优化动画效果
- [ ] 增加音效支持
- [ ] 完善移动端适配

### 长期目标
- [ ] 服务端API对接
- [ ] 多用户支持
- [ ] 实时数据同步
- [ ] 社交功能
- [ ] 运营后台管理

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 联系方式

如有问题，请通过以下方式联系：
- GitHub Issues
- Email: [your-email@example.com]

---

**享受抽卡的乐趣！🎴✨** 