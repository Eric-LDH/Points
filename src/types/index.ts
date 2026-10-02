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

// 积分记录来源：manual=家长手工勾选/补录，auto=自动奖励引擎发放
export type PointsSource = 'manual' | 'auto'

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
  source?: PointsSource // 可选：旧数据未标记时一律视为 manual
  autoRuleId?: string // 自动奖励规则 id（source=auto 时存在）
  autoGrantId?: string // 发放台账 id（source=auto 时存在）
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

// 幸运任务模型
export interface LuckyTask {
  id: string
  description: string // 任务描述文本
  createdAt: string
  updatedAt: string
}

// 定时提醒模型
export interface Reminder {
  id: string
  notifyId: number // 系统通知 ID（Android 为 32 位整数），用于排期与取消
  title: string // 通知标题
  body: string // 通知内容
  hour: number // 0-23
  minute: number // 0-59
  enabled: boolean
  createdAt: string
  updatedAt: string
}

// 通知权限与排期状态
export interface ReminderNotificationState {
  supported: boolean // 是否运行在支持系统通知的环境（原生 App）
  permission: 'granted' | 'denied' | 'unsupported'
  exactAlarmGranted: boolean // 是否拥有精确闹钟权限（Android 12+）
  scheduled: number // 当前已排期的提醒条数
  lastSyncAt: string | null
  lastError: string | null
}

// 自动奖励规则类型：streak=周期内连续N天每日净得分达标；schedule=周期内到点发放
export type AutoRewardType = 'streak' | 'schedule'

// 自动奖励的周期类型（周一起点 / 每月1号 / 每年1月1号）
export type AutoRewardCycle = 'weekly' | 'monthly' | 'yearly'

// 自动奖励规则模型（一套规则对所有孩子生效，各自独立结算）
export interface AutoRewardRule {
  id: string
  name: string
  type: AutoRewardType
  cycleType: AutoRewardCycle
  targetRuleId: string // 预设的得分项（Rule.id）
  streakDays?: number // streak 专用：连续 N 天
  dailyThreshold?: number // streak 专用：每日净得分阈值
  triggerWeekday?: number // schedule 专用：1-7（周一=1），cycleType=weekly 时生效
  triggerDayOfMonth?: number // schedule 专用：1-31，cycleType=monthly / yearly 时生效
  triggerMonth?: number // schedule 专用：1-12，cycleType=yearly 时生效
  enabled: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// 自动奖励发放台账：每个（规则 × 孩子 × 周期）最多一条
export interface AutoRewardGrant {
  id: string
  autoRuleId: string
  childId: string
  cycleKey: string // 'weekly:2026-09-28' | 'monthly:2026-10' | 'yearly:2026'
  grantDate: string // YYYY-MM-DD，实际落在哪一天
  points: number
  recordId: string // 对应的积分记录 id
  revoked: boolean // 是否已被撤销（记录已删除，视为本周期未发放）
  suppressed: boolean // 家长声明本周期不再发放
  createdAt: string
}

// 备份数据模型
export interface BackupData {
  rules: Rule[]
  rewardItems: RewardItem[]
  pointsRecords: PointsRecord[]
  exchangeRecords: ExchangeRecord[]
  children: Child[]
  luckyTasks?: LuckyTask[] // 可选，兼容旧版本
  reminders?: Reminder[] // 可选，兼容旧版本
  autoRewardRules?: AutoRewardRule[] // 可选，兼容旧版本
  autoRewardGrants?: AutoRewardGrant[] // 可选，兼容旧版本
  backupAt: string
  version: string
}
