# UI样式冲突检查清单

## 开发前检查

### 1. 颜色对比度规划
- [ ] 确定页面主体配色方案（深色/浅色主题）
- [ ] 规划表单元素配色（建议浅色背景+深色文字）
- [ ] 检查文字与背景的对比度（WCAG AA标准：4.5:1）
- [ ] 避免相同颜色的文字和背景组合

### 2. CSS优先级规划
- [ ] 明确全局样式作用范围
- [ ] 为关键元素准备内联样式保险
- [ ] 使用!important时确保有明确原因
- [ ] 测试样式继承是否符合预期

## 开发中检查

### 3. 表单元素样式
```typescript
// ✅ 推荐的安全模式
<select
  className="text-gray-900 bg-white border-gray-300"
  style={{ color: '#1f2937' }} // 保险措施
>

// ❌ 避免的危险模式  
<select className="text-white bg-white"> // 白字白底
<select className="text-gray-900 bg-gray-900"> // 黑字黑底
```

### 4. 必须检查的元素
- [ ] select下拉选择器（包括option）
- [ ] input输入框（包括placeholder）
- [ ] textarea文本域
- [ ] button按钮文字
- [ ] label标签文字
- [ ] 链接文字
- [ ] 错误提示文字

### 5. 浏览器兼容性
- [ ] Chrome/Safari测试
- [ ] Firefox测试  
- [ ] Safari移动版测试
- [ ] 深色模式/浅色模式切换测试

## 开发后验证

### 6. 视觉验证
- [ ] 所有文字都清晰可见
- [ ] 焦点状态正常显示
- [ ] hover状态正常显示
- [ ] 禁用状态样式正确

### 7. 功能验证
- [ ] 表单可以正常输入
- [ ] 下拉选择器可以正常选择
- [ ] 所有交互功能正常工作
- [ ] 键盘导航正常

### 8. 响应式验证
- [ ] 移动端表单元素可见性
- [ ] 平板端表单元素可见性
- [ ] 不同屏幕尺寸下的显示效果

## 紧急修复模式

### 当发现样式冲突时的快速修复：

#### 1. 立即修复（临时方案）
```typescript
// 添加内联样式强制覆盖
style={{ 
  color: '#1f2937',
  backgroundColor: 'white'
}}
```

#### 2. 全局修复（长期方案）
```css
/* 在index.css中添加强制规则 */
select, input, textarea {
  color: #1f2937 !important;
  background-color: white !important;
}
```

#### 3. 系统性修复（最佳方案）
- 更新设计系统
- 建立统一的组件样式
- 创建样式变量和主题系统

## 预防措施

### 9. 代码规范
```typescript
// 使用预定义的安全样式常量
const SAFE_FORM_STYLES = {
  input: "text-gray-900 bg-white border-gray-300",
  select: "text-gray-900 bg-white border-gray-300", 
  textarea: "text-gray-900 bg-white border-gray-300",
  label: "text-gray-700",
  button: "text-white bg-blue-600",
  error: "text-red-600",
  success: "text-green-600"
};
```

### 10. 自动化检测
```typescript
// 开发环境的对比度检查
if (process.env.NODE_ENV === 'development') {
  const checkContrast = (element) => {
    const styles = getComputedStyle(element);
    const textColor = styles.color;
    const bgColor = styles.backgroundColor;
    // 检查对比度逻辑
  };
}
```

## 记忆要点

🔴 **永远不要**：
- 使用相同颜色的文字和背景
- 依赖单一的CSS类来控制关键元素颜色
- 忽略浏览器的默认样式继承

🟢 **始终要做**：
- 为表单元素明确指定文字和背景颜色
- 使用内联样式作为关键元素的保险
- 在不同设备和浏览器上测试可见性
- 遵循WCAG无障碍规范

🟡 **最佳实践**：
- 深色主题页面 + 浅色表单元素
- 使用CSS变量管理主题颜色
- 建立统一的设计系统
- 定期进行样式冲突审查 