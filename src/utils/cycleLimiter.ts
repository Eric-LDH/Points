import type { ExchangeRecord, RewardItem } from '@/types'

export interface CycleCheckResult {
  canExchange: boolean
  used: number
  limit: number
  remaining: number
  message: string
}

export const CycleLimiter = {
  /**
   * 检查是否可兑换
   */
  canExchange(
    item: RewardItem,
    records: ExchangeRecord[],
    childId: string,
    date: Date = new Date()
  ): CycleCheckResult {
    // 如果没有周期限制，直接允许兑换
    if (item.cycleType === 'none') {
      return {
        canExchange: true,
        used: 0,
        limit: 0,
        remaining: 0,
        message: '无限制'
      }
    }

    // 筛选当前周期的记录
    const periodRecords = this.filterByCycle(records, item.cycleType, childId, date)
    const used = periodRecords.length

    return {
      canExchange: used < item.cycleLimit,
      used,
      limit: item.cycleLimit,
      remaining: item.cycleLimit - used,
      message: this.getMessage(item.cycleType, used, item.cycleLimit)
    }
  },

  /**
   * 按周期筛选记录
   */
  filterByCycle(
    records: ExchangeRecord[],
    cycleType: string,
    childId: string,
    date: Date
  ): ExchangeRecord[] {
    const startDate = this.getCycleStartDate(cycleType, date)
    
    return records.filter(record => {
      const recordDate = new Date(record.exchangeDate)
      return (
        record.childId === childId &&
        recordDate >= startDate &&
        recordDate <= date
      )
    })
  },

  /**
   * 获取周期起始日期
   */
  getCycleStartDate(cycleType: string, date: Date): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)

    switch (cycleType) {
      case 'weekly':
        // 回到本周一
        const day = d.getDay() || 7 // 将周日转换为 7
        const diff = d.getDate() - day + 1
        return new Date(d.setDate(diff))
      case 'monthly':
        // 回到本月 1 号
        return new Date(d.getFullYear(), d.getMonth(), 1)
      case 'yearly':
        // 回到本年 1 月 1 号
        return new Date(d.getFullYear(), 0, 1)
      default:
        return new Date(0) // 无限制
    }
  },

  /**
   * 获取周期名称
   */
  getCycleName(cycleType: string): string {
    const names: Record<string, string> = {
      weekly: '本周',
      monthly: '本月',
      yearly: '今年',
      none: '无限制'
    }
    return names[cycleType] || '未知'
  },

  /**
   * 获取提示信息
   */
  getMessage(cycleType: string, used: number, limit: number): string {
    if (cycleType === 'none') {
      return '无限制'
    }
    
    const cycleName = this.getCycleName(cycleType)
    return `${cycleName}已兑换${used}/${limit}次`
  },

  /**
   * 获取下次可用时间
   */
  getNextAvailableTime(cycleType: string, date: Date): Date {
    const d = new Date(date)

    switch (cycleType) {
      case 'weekly':
        // 下周一
        const day = d.getDay() || 7
        const nextMonday = d.getDate() + (8 - day)
        return new Date(d.setDate(nextMonday))
      case 'monthly':
        // 下月 1 号
        return new Date(d.getFullYear(), d.getMonth() + 1, 1)
      case 'yearly':
        // 明年 1 月 1 号
        return new Date(d.getFullYear() + 1, 0, 1)
      default:
        return d
    }
  }
}
