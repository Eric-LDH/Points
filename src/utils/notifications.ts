import { LocalNotifications } from '@capacitor/local-notifications'
import type { LocalNotificationSchema } from '@capacitor/local-notifications'
import type { Reminder } from '@/types'

/**
 * 系统本地通知调度封装
 *
 * 依赖 @capacitor/local-notifications，由 Android AlarmManager 承载排期，
 * 因此 App 进程被系统回收后，到点仍会弹出通知。
 *
 * 几条来自插件实现（v8.3.1）的关键行为，决定了下面代码的写法：
 * 1. `schedule.on` 是 cron 式触发器：插件只设置「下一次」的精确闹钟，并在
 *    触发时由 TimedNotificationPublisher 按相同的匹配串自动续排下一次，
 *    所以「每天重复」不需要 `repeats`（repeats 只对 `at` 有意义）。
 * 2. 首次排期会走 `setExactAndAllowWhileIdle`（精确闹钟 + Doze 可唤醒），
 *    但**自动续排时插件退回普通 `setExact`，不再带 allowWhileIdle**。
 *    因此这里每次同步都先 cancelAll 再重新 schedule，把「可唤醒」属性补回来。
 * 3. 通知权限未授予时 `schedule()` 会直接 reject（NOTIFICATIONS_DISABLED）。
 * 4. Android 12+ 若未授予「闹钟与提醒」权限，插件会降级为非精确闹钟，
 *    并在 ScheduleResult.warning 中回报。
 */

/** 通知渠道 ID，Android 8+ 的提示音/震动由渠道决定，创建后不可更改（除非卸载） */
export const REMINDER_CHANNEL_ID = 'points_reminder'
/** 测试通知使用固定 ID，与提醒的 notifyId（从 100 起自增）不会冲突 */
const TEST_NOTIFICATION_ID = 999999
/** 提醒 notifyId 起始值 */
export const REMINDER_NOTIFY_ID_BASE = 100

export type NotifyPermission = 'granted' | 'denied' | 'unsupported'

export interface SyncOutcome {
  supported: boolean
  permission: NotifyPermission
  /** 本次成功排期的提醒条数 */
  scheduled: number
  /** 是否拥有精确闹钟权限（无权限则提醒可能延迟几分钟） */
  exactAlarmGranted: boolean
  /** 非致命错误或降级说明，用于界面提示 */
  notice: string | null
}

/**
 * 是否运行在原生平台。
 * 浏览器（npm run dev）里没有 AlarmManager，插件也无法工作，需要降级处理。
 */
export function isNotificationSupported(): boolean {
  const capacitor = (window as any).Capacitor
  return !!(capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform())
}

/** 查询通知权限（不弹窗） */
export async function checkNotificationPermission(): Promise<NotifyPermission> {
  if (!isNotificationSupported()) return 'unsupported'
  try {
    const status = await LocalNotifications.checkPermissions()
    return status.display === 'granted' ? 'granted' : 'denied'
  } catch (error) {
    console.error('检查通知权限失败:', error)
    return 'unsupported'
  }
}

/** 申请通知权限（会弹系统授权框，Android 13+ 才有） */
export async function requestNotificationPermission(): Promise<NotifyPermission> {
  if (!isNotificationSupported()) return 'unsupported'
  try {
    let status = await LocalNotifications.checkPermissions()
    if (status.display !== 'granted') {
      status = await LocalNotifications.requestPermissions()
    }
    return status.display === 'granted' ? 'granted' : 'denied'
  } catch (error) {
    console.error('申请通知权限失败:', error)
    return 'denied'
  }
}

/** 查询「闹钟与提醒」精确闹钟权限。Android 12 以下恒为已授予 */
export async function checkExactAlarmPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return true
  try {
    const result = await LocalNotifications.checkExactNotificationSetting()
    return result.exact_alarm === 'granted'
  } catch (error) {
    // Android 12 以下或插件不支持该接口时，视为已授予，避免误报
    return true
  }
}

/** 跳转系统「闹钟与提醒」设置页，引导用户开启精确闹钟权限 */
export async function openExactAlarmSetting(): Promise<void> {
  if (!isNotificationSupported()) return
  try {
    await LocalNotifications.changeExactNotificationSetting()
  } catch (error) {
    console.error('打开精确闹钟设置失败:', error)
  }
}

/** 确保通知渠道存在（Android 8+ 必须） */
async function ensureChannel(): Promise<void> {
  try {
    const { channels } = await LocalNotifications.listChannels()
    if (channels.some(channel => channel.id === REMINDER_CHANNEL_ID)) return
  } catch (error) {
    // 查询失败时继续尝试创建
  }
  await LocalNotifications.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: '积分提醒',
    description: '家庭积分管理的定时提醒',
    importance: 4, // High：允许横幅弹出与提示音
    visibility: 1, // Public：锁屏可见
    vibration: true,
    lights: true
  })
}

/** 把业务提醒转换成插件需要的通知结构 */
function toLocalNotification(reminder: Reminder): LocalNotificationSchema {
  return {
    id: reminder.notifyId,
    title: reminder.title,
    body: reminder.body,
    channelId: REMINDER_CHANNEL_ID,
    iconColor: '#6366F1',
    autoCancel: true,
    extra: { reminderId: reminder.id },
    schedule: {
      // cron 式触发器：仅指定「时:分」，插件按天自动续排下一次
      on: { hour: reminder.hour, minute: reminder.minute },
      // Doze 打盹模式下仍能触发（系统限制每 App 每 9 分钟一次，日常提醒无影响）
      allowWhileIdle: true
    }
  }
}

/**
 * 全量对账：把系统里已排期的通知拉齐到当前提醒配置。
 *
 * 采用「先清空、再重排」而不是增量更新，原因有两个：
 * 1. 插件自动续排时会丢失 allowWhileIdle，全量重排可把它补回来；
 * 2. 历史遗留或被系统清掉的闹钟能被一次性修正。
 *
 * @param reminders 当前全部提醒
 * @param requestPermission 是否允许弹出系统授权框（页面内操作传 true，启动静默对账传 false）
 */
export async function syncReminders(
  reminders: Reminder[],
  requestPermission = false
): Promise<SyncOutcome> {
  if (!isNotificationSupported()) {
    return {
      supported: false,
      permission: 'unsupported',
      scheduled: 0,
      exactAlarmGranted: true,
      notice: '当前环境不支持系统通知，请在安装到手机后使用'
    }
  }

  const exactAlarmGranted = await checkExactAlarmPermission()
  const permission = requestPermission
    ? await requestNotificationPermission()
    : await checkNotificationPermission()

  if (permission !== 'granted') {
    return {
      supported: true,
      permission,
      scheduled: 0,
      exactAlarmGranted,
      notice: '未获得通知权限，提醒无法送达，请在系统设置中允许通知'
    }
  }

  try {
    await ensureChannel()
    // 清空后重建，保证排期与配置完全一致
    await LocalNotifications.cancelAll()

    const enabled = reminders.filter(reminder => reminder.enabled)
    if (enabled.length === 0) {
      return { supported: true, permission, scheduled: 0, exactAlarmGranted, notice: null }
    }

    const result = await LocalNotifications.schedule({
      notifications: enabled.map(toLocalNotification)
    })

    const warning = result?.warning
    return {
      supported: true,
      permission,
      scheduled: result?.notifications?.length ?? enabled.length,
      // 出现降级警告说明精确闹钟权限实际未生效
      exactAlarmGranted: exactAlarmGranted && !warning,
      notice: warning ? '未获得「闹钟与提醒」权限，提醒时间可能延迟几分钟' : null
    }
  } catch (error) {
    console.error('排期提醒失败:', error)
    return {
      supported: true,
      permission: 'granted',
      scheduled: 0,
      exactAlarmGranted,
      notice: `排期失败：${(error as Error)?.message ?? '未知错误'}`
    }
  }
}

/**
 * 立即发送一条测试通知，用于验证权限与展示效果。
 * @param delaySeconds 延迟秒数，留一点时间让用户切出 App 观察
 */
export async function sendTestNotification(
  title: string,
  body: string,
  delaySeconds = 3
): Promise<{ success: boolean; notice: string | null }> {
  if (!isNotificationSupported()) {
    return { success: false, notice: '当前环境不支持系统通知' }
  }

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') {
    return { success: false, notice: '未获得通知权限，请在系统设置中允许通知' }
  }

  try {
    await ensureChannel()
    await LocalNotifications.schedule({
      notifications: [
        {
          id: TEST_NOTIFICATION_ID,
          title,
          body,
          channelId: REMINDER_CHANNEL_ID,
          iconColor: '#6366F1',
          autoCancel: true,
          // 抬升优先级，便于以横幅形式验证
          foreground: true,
          schedule: { at: new Date(Date.now() + delaySeconds * 1000) }
        }
      ]
    })
    return { success: true, notice: null }
  } catch (error) {
    console.error('发送测试通知失败:', error)
    return { success: false, notice: `发送失败：${(error as Error)?.message ?? '未知错误'}` }
  }
}
