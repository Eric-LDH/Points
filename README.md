# 家庭积分管理系统 👨‍👩‍👧‍👦

一个现代化的手机端积分管理应用，采用 Vue3 + Vite + TypeScript 开发，具备清新卡片式界面和微交互动画。

## ✨ 核心功能

### 1. 🏠 首页 - 今日积分记录
- ✅ 显示今日完成的任务和待完成的任务
- ✅ 快捷记录入口（家务、习惯、学习、惩罚）
- ✅ 今日积分和累计积分统计
- ✅ 连续打卡天数展示

### 2. 📝 手工补录往期积分
- ✅ **单日补录**：选择任意历史日期补录积分
- ✅ **批量补录**：选择日期范围批量补录
- ✅ 补录标记：自动标注为"补录"状态
- ✅ 支持备注说明

### 3. ⭐ 积分规则自定义编辑（图标随机生成）
- ✅ 新增/编辑积分规则
- ✅ **图标自动生成**：根据分类智能随机生成 emoji 图标
- ✅ 规则分类：家务、生活习惯、学习习惯、加分项、惩罚
- ✅ 启用/禁用规则
- ✅ 删除规则（二次确认）

#### 图标库（40+ 个常用图标）
```javascript
家务类：🧹 🧺 🍽️ 🧼 🧽 🧴 🧻 🧤
生活习惯：😊 💪 🏃 🚿 😴 🍎 🥗 🚴
学习习惯：📚 ✏️ 📖 🎒 📝 🔍 💡 ⭐
加分项：🌟 🏆 🎉 🎨 🎵 🎯 🎪 🤹
惩罚：⏰ 📱 😤 ⚠️ ❌ 😠 🔇 🚫
```

### 4. 🎁 积分兑换功能（支持周期限制）
- ✅ **每周限制**：按自然周（周一至周日）统计次数
- ✅ **每月限制**：按自然月（1 日至月末）统计次数
- ✅ **每年限制**：按自然年（1 月 1 日至 12 月 31 日）统计次数
- ✅ 兑换前自动检查周期限额
- ✅ 显示剩余可兑换次数
- ✅ 兑换记录追溯

#### 周期限制示例
- 手机时间 30 分钟：50 积分，**每周 2 次**
- 饮料 1 杯：30 积分，**每月 5 次**
- 电影院 1 次：150 积分，**每年 1 次**

### 5. 📊 数据统计
- ✅ 积分概览（当前积分、累计获得、本月兑换）
- ✅ 本周表现柱状图
- ✅ 分类统计（按规则分类）
- ✅ 最近记录列表

### 6. 👤 我的页面
- ✅ 孩子管理（切换孩子、添加孩子）
- ✅ **积分规则管理**入口
- ✅ **兑换商品管理**入口
- ✅ **数据备份与恢复**
  - 📤 手动备份到本地 JSON 文件
  - 📥 从 JSON 文件恢复数据
- ✅ 系统设置（深色模式切换）

## 🎨 设计理念

### 配色方案
```css
主色：#6366F1 (Indigo)
辅色：#10B981 (翡翠绿)
点缀色：#F59E0B (琥珀色)
```

### 界面特点
- 🎴 清新卡片式设计
- ⭕ 大圆角（16px卡片，24px按钮）
- 💫 轻量阴影和微动画
- 🌙 深色模式支持
- 📱 移动端优先的响应式设计

### 交互体验
- ✨ 按钮点击涟漪效果
- 📳 勾选完成震动反馈
- 🔄 页面平滑切换动画
- 📊 数字滚动动画
- ✓ 成功操作弹窗反馈

## 🛠️ 技术栈

- **框架**: Vue 3.5.30
- **构建工具**: Vite 6.3.1
- **语言**: TypeScript 5.8.3
- **状态管理**: Pinia 3.0.2
- **路由**: Vue Router 4.5.1
- **样式**: SCSS
- **数据存储**: LocalStorage

## 📦 项目结构

```
Points/
├── src/
│   ├── assets/          # 全局样式
│   │   └── main.scss
│   ├── components/      # 公共组件
│   │   └── Tabbar.vue  # 底部导航
│   ├── pages/          # 页面组件
│   │   ├── index/      # 首页
│   │   ├── stats/      # 统计
│   │   ├── record/     # 补录
│   │   ├── exchange/   # 兑换
│   │   ├── mine/       # 我的
│   │   ├── rule/       # 规则管理
│   │   └── reward/     # 兑换商品
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia Store
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   │   ├── iconGenerator.ts    # 图标生成器
│   │   ├── cycleLimiter.ts     # 周期限制检查
│   │   └── storage.ts          # 本地存储管理
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000/

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 📱 底部导航

```
┌─────────────────────────────────┐
│ [🏠] [📊] [➕] [🎁] [👤]        │
│ 首页  统计  补录  兑换  我的     │
└─────────────────────────────────┘
```

- **首页** (🏠): 今日积分记录
- **统计** (📊): 数据统计报表
- **补录** (➕): 手工补录（突出按钮）
- **兑换** (🎁): 积分商城
- **我的** (👤): 个人中心

## 🧠 核心功能代码

### 图标随机生成器
```typescript
// src/utils/iconGenerator.ts
const IconGenerator = {
  icons: {
    家务: ['🧹', '🧺', '🍽️', '🧼', '🧽'],
    生活习惯: ['😊', '💪', '🏃', '🚿', '😴'],
    学习习惯: ['📚', '✏️', '📖', '💡', '⭐'],
    加分项: ['🌟', '🏆', '🎉', '🎨', '🎵'],
    惩罚: ['⏰', '📱', '😤', '⚠️', '❌']
  },
  
  generate(category: string): string {
    const categoryIcons = this.icons[category] || this.icons['生活习惯']
    return categoryIcons[Math.floor(Math.random() * categoryIcons.length)]
  }
}
```

### 周期限制检查器
```typescript
// src/utils/cycleLimiter.ts
const CycleLimiter = {
  canExchange(item, records, childId, date) {
    if (item.cycleType === 'none') {
      return { canExchange: true, used: 0, limit: 0 }
    }
    
    const periodRecords = this.filterByCycle(
      records, 
      item.cycleType, 
      childId, 
      date
    )
    const used = periodRecords.length
    
    return {
      canExchange: used < item.cycleLimit,
      used,
      limit: item.cycleLimit,
      remaining: item.cycleLimit - used
    }
  },
  
  getCycleStartDate(cycleType, date) {
    switch(cycleType) {
      case 'weekly':
        // 本周一
      case 'monthly':
        // 本月 1 号
      case 'yearly':
        // 今年 1 月 1 号
    }
  }
}
```

## 📋 数据模型

### Rule (积分规则)
```typescript
interface Rule {
  id: string
  name: string
  category: '家务' | '生活习惯' | '学习习惯' | '加分项' | '惩罚'
  type: 'reward' | 'penalty'
  points: number
  icon: string  // 自动生成
  enabled: boolean
  sortOrder: number
  description?: string
  createdAt: string
  updatedAt: string
}
```

### RewardItem (兑换商品)
```typescript
interface RewardItem {
  id: string
  name: string
  points: number
  icon: string
  description: string
  cycleType: 'weekly' | 'monthly' | 'yearly' | 'none'
  cycleLimit: number
  enabled: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}
```

### ExchangeRecord (兑换记录)
```typescript
interface ExchangeRecord {
  id: string
  itemId: string
  itemName: string
  itemIcon: string
  points: number
  quantity: number
  totalPoints: number
  exchangeDate: string
  cycleType: string
  cycleLimit: number
  status: 'pending' | 'used' | 'expired'
  childId: string
}
```

## 🎯 使用场景

1. **家长记录孩子日常表现**
   - 完成家务获得积分
   - 养成好习惯获得奖励
   - 学习进步得到加分

2. **孩子兑换奖励**
   - 使用积分兑换娱乐时间
   - 兑换小礼品或零食
   - 兑换特殊活动（如旅行）

3. **周期性控制**
   - 限制每天屏幕时间
   - 控制每周消费频率
   - 规划年度奖励

## 💾 数据备份

### 导出备份
1. 进入【我的】页面
2. 点击【📤 手动备份】
3. 下载 JSON 格式备份文件

### 导入恢复
1. 进入【我的】页面
2. 点击【📥 从文件恢复】
3. 选择之前导出的 JSON 文件
4. 确认恢复

## 🌙 深色模式

- 自动跟随系统设置
- 手动在【我的】→【深色模式】切换
- 深色配色：背景#1F2937，卡片#374151

## 📝 开发计划

- [ ] 规则编辑页面完整功能
- [ ] 兑换商品管理完整功能
- [ ] 拖拽排序功能
- [ ] 批量操作功能
- [ ] 更多统计图表
- [ ] 通知提醒功能
- [ ] 多孩子支持优化
- [ ] 数据导出 Excel

## ⚠️ 注意事项

1. **图标生成**
   - 新增规则时自动生成图标
   - 编辑规则时不修改图标
   - 备份恢复时保留原图标

2. **周期限制**
   - 按自然周/月/年计算
   - 兑换前检查剩余次数
   - 达到限制时禁用按钮

3. **数据安全**
   - 所有数据存储在本地
   - 定期备份防止丢失
   - 删除操作需二次确认

## 📄 License

MIT

---

**开发完成时间**: 2026 年 3 月  
**开发工具**: VS Code  
**技术支持**: Vue 3 + Vite + TypeScript
