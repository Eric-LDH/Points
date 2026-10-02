import type { AutoRewardCycle, AutoRewardRule, PointsRecord } from '@/types'
import { CycleLimiter } from './cycleLimiter'

/**
 * 自动奖励核心判定引擎（纯函数，不依赖 Vue 响应式）。
 *
 * 判定口径：
 * - 单日净得分 = 该孩子当日全部积分记录 points 之和（惩罚记录为负数，天然相抵）
 * - 连续 N 天采用滚动窗口，且**不跨周期**：以周期起点（周一 / 每月1号 / 每年1月1号）为边界，
 *   逐日滑动，找出最早的"以某天结尾且连续 N 天每日净得分 ≥ 阈值"的候选日
 * - 时间型规则：按周期内的触发日发放，本周期内已过触发日即视为到期（支持错过补发）
 */

/** 将 Date 格式化为 YYYY-MM-DD（本地时间，避免时区偏移） */
export function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 将 YYYY-MM-DD 解析为本地时间当日 0 点 */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** 日期加减天数 */
export function addDays(value: string, days: number): string {
  const date = parseDateOnly(value)
  date.setDate(date.getDate() + days)
  return formatDateOnly(date)
}

/** 某月最后一天 */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

/**
 * 周期起止日期（含端点）
 */
export function cycleRange(dateStr: string, cycleType: AutoRewardCycle): { start: string; end: string } {
  const date = parseDateOnly(dateStr)
  const start = CycleLimiter.getCycleStartDate(cycleType, date)
  const startStr = formatDateOnly(start)

  if (cycleType === 'weekly') {
    return { start: startStr, end: addDays(startStr, 6) }
  }
  if (cycleType === 'monthly') {
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    return { start: startStr, end: formatDateOnly(end) }
  }
  return { start: startStr, end: `${start.getFullYear()}-12-31` }
}

/**
 * 周期键：同一周期内该规则最多发放一次
 */
export function cycleKeyOf(dateStr: string, cycleType: AutoRewardCycle): string {
  const { start } = cycleRange(dateStr, cycleType)
  return `${cycleType}:${start}`
}

/**
 * 构建单日净得分表：date -> 当日净得分
 */
export function buildDailyScores(records: PointsRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const record of records) {
    map.set(record.date, (map.get(record.date) || 0) + record.points)
  }
  return map
}

/**
 * 连续达标型：返回本周期内最早的达标日（候选发放日），无则 null
 */
export function findStreakGrantDay(
  rule: AutoRewardRule,
  dailyScores: Map<string, number>,
  todayStr: string
): string | null {
  const days = rule.streakDays ?? 0
  const threshold = rule.dailyThreshold ?? 0
  if (days <= 0 || threshold <= 0) return null

  const { start } = cycleRange(todayStr, rule.cycleType)

  let cursor = start
  let streak = 0
  while (cursor <= todayStr) {
    const score = dailyScores.get(cursor) ?? 0
    streak = score >= threshold ? streak + 1 : 0
    if (streak >= days) return cursor
    cursor = addDays(cursor, 1)
  }
  return null
}

/**
 * 连续达标型：截至今天已连续达标的天数（用于列表页展示进度）
 */
export function getStreakProgress(
  rule: AutoRewardRule,
  dailyScores: Map<string, number>,
  todayStr: string
): number {
  const threshold = rule.dailyThreshold ?? 0
  if (threshold <= 0) return 0

  const { start } = cycleRange(todayStr, rule.cycleType)
  let count = 0
  let cursor = todayStr
  while (cursor >= start) {
    if ((dailyScores.get(cursor) ?? 0) >= threshold) {
      count++
      cursor = addDays(cursor, -1)
    } else {
      break
    }
  }
  return count
}

/**
 * 定时型：本周期内的触发日（无论是否已到），无则 null
 */
export function getScheduleTriggerDay(rule: AutoRewardRule, todayStr: string): string | null {
  const { start } = cycleRange(todayStr, rule.cycleType)
  const startDate = parseDateOnly(start)

  if (rule.cycleType === 'weekly') {
    const weekday = clamp(rule.triggerWeekday ?? 1, 1, 7)
    return addDays(start, weekday - 1)
  }

  if (rule.cycleType === 'monthly') {
    const maxDay = lastDayOfMonth(startDate.getFullYear(), startDate.getMonth() + 1)
    const day = clamp(rule.triggerDayOfMonth ?? 1, 1, maxDay)
    return `${start.slice(0, 7)}-${pad(day)}`
  }

  const month = clamp(rule.triggerMonth ?? 1, 1, 12)
  const maxDay = lastDayOfMonth(startDate.getFullYear(), month)
  const day = clamp(rule.triggerDayOfMonth ?? 1, 1, maxDay)
  return `${start.slice(0, 4)}-${pad(month)}-${pad(day)}`
}

/**
 * 定时型：本周期内已到期的发放日（未到则 null）
 */
export function findScheduleGrantDay(rule: AutoRewardRule, todayStr: string): string | null {
  const trigger = getScheduleTriggerDay(rule, todayStr)
  if (!trigger) return null
  return trigger <= todayStr ? trigger : null
}

/** 周期展示名 */
export function getCycleLabel(cycleType: AutoRewardCycle): string {
  const labels: Record<AutoRewardCycle, string> = {
    weekly: '每周',
    monthly: '每月',
    yearly: '每年'
  }
  return labels[cycleType] || '每周'
}

/** 星期展示名（1=周一 ... 7=周日） */
export function getWeekdayLabel(weekday: number): string {
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return labels[clamp(weekday, 1, 7) - 1]
}
