// 规则模型
export interface Rule {
  id: string
  name: string
  category: '家务' | '生活习惯' | '学习习惯' | '加分项' | '惩罚'
  type: 'reward' | 'penalty'
  points: number
  icon: string // 新增时随机生成，编辑时不修改
  enabled: boolean
  sortOrder: number
  description?: string
  createdAt: string
  updatedAt: string
}

// 兑换商品模型（增加周期限制）
export interface RewardItem {
  id: string
  name: string
  points: number
  icon: string
  description: string
  cycleType: 'weekly' | 'monthly' | 'yearly' | 'none' // 周期类型
  cycleLimit: number // 周期内限制次数
  enabled: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// 兑换记录模型
export interface ExchangeRecord {
  id: string
  itemId: string
  itemName: string
  itemIcon: string
  points: number
  quantity: number
  totalPoints: number
  exchangeDate: string
  cycleType: string // 记录当时的周期类型
  cycleLimit: number // 记录当时的限制次数
  status: 'pending' | 'used' | 'expired'
  usedDate?: string
  note?: string
  childId: string
}

// 积分记录模型
export interface PointsRecord {
  id: string
  ruleId: string
  ruleName: string
  ruleIcon: string
  points: number
  date: string
  completedAt: string
  note?: string
  isMakeup: boolean // 是否为补录
  childId: string
}

// 孩子模型
export interface Child {
  id: string
  name: string
  avatar?: string
  birthday?: string
  currentPoints: number
  totalPoints: number
}

// 备份数据模型
export interface BackupData {
  rules: Rule[]
  rewardItems: RewardItem[]
  pointsRecords: PointsRecord[]
  exchangeRecords: ExchangeRecord[]
  children: Child[]
  backupAt: string
  version: string
}
