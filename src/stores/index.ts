import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Rule, RewardItem, PointsRecord, ExchangeRecord, Child, LuckyTask, Reminder, ReminderNotificationState, AutoRewardRule, AutoRewardGrant, AutoRewardCycle } from '@/types'
import { IconGenerator } from '@/utils/iconGenerator'
import { Storage } from '@/utils/storage'
import { showToast } from '@/utils/toast'
import {
  buildDailyScores,
  cycleKeyOf,
  findScheduleGrantDay,
  findStreakGrantDay,
  getScheduleTriggerDay,
  getStreakProgress
} from '@/utils/autoReward'
import {
  REMINDER_NOTIFY_ID_BASE,
  sendTestNotification,
  syncReminders as syncSystemReminders
} from '@/utils/notifications'

export const useAppStore = defineStore('app', () => {
  // State - 初始化为空数组，避免 SSR 水合不匹配问题
  const rules = ref<Rule[]>([])
  const rewardItems = ref<RewardItem[]>([])
  const pointsRecords = ref<PointsRecord[]>([])
  const exchangeRecords = ref<ExchangeRecord[]>([])
  const children = ref<Child[]>([])
  const currentChildId = ref<string | null>(null)
  const darkMode = ref<boolean>(false)
  const luckyTasks = ref<LuckyTask[]>([])
  const reminders = ref<Reminder[]>([])
  const autoRewardRules = ref<AutoRewardRule[]>([])
  const autoRewardGrants = ref<AutoRewardGrant[]>([])
  const reminderState = ref<ReminderNotificationState>({
    supported: true,
    permission: 'granted',
    exactAlarmGranted: true,
    scheduled: 0,
    lastSyncAt: null,
    lastError: null
  })

  // 从 localStorage 加载数据
  function loadFromStorage() {
    rules.value = Storage.rules.getAll()
    rewardItems.value = Storage.rewardItems.getAll()
    pointsRecords.value = Storage.pointsRecords.getAll()
    exchangeRecords.value = Storage.exchangeRecords.getAll()
    children.value = Storage.children.getAll()
    currentChildId.value = Storage.children.getCurrentId()
    luckyTasks.value = Storage.luckyTasks.getAll()
    reminders.value = Storage.reminders.getAll()
    autoRewardRules.value = Storage.autoRewardRules.getAll()
    autoRewardGrants.value = Storage.autoRewardGrants.getAll()
    // 加载深色模式设置
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      darkMode.value = JSON.parse(savedDarkMode)
      // 应用深色模式类名
      if (darkMode.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  // 立即加载一次数据
  loadFromStorage()

  // Getters
  const currentChild = computed(() => {
    return children.value.find(c => c.id === currentChildId.value) || null
  })

  const enabledRules = computed(() => {
    return rules.value.filter(r => r.enabled).sort((a, b) => a.sortOrder - b.sortOrder)
  })

  const enabledRewardItems = computed(() => {
    return rewardItems.value.filter(r => r.enabled).sort((a, b) => a.sortOrder - b.sortOrder)
  })

  const todayRecords = computed(() => {
    // 使用本地时间格式化，避免时区问题
    const today = formatDateOnly(new Date())
    return pointsRecords.value.filter(r => r.date === today && r.childId === currentChildId.value)
  })

  const todayPoints = computed(() => {
    return todayRecords.value.reduce((sum, r) => sum + r.points, 0)
  })

  const totalPoints = computed(() => {
    if (!currentChild.value) return 0
    return currentChild.value.currentPoints
  })

  // Actions
  function initDefaultData() {
    // 如果没有孩子数据，创建默认孩子
    if (children.value.length === 0) {
      const defaultChild: Child = {
        id: 'child_1',
        name: '小明',
        avatar: '👦',
        currentPoints: 0,
        totalPoints: 0
      }
      Storage.children.add(defaultChild)
      children.value = [defaultChild]
      currentChildId.value = 'child_1'
    }

    // 如果没有规则数据，创建默认规则
    if (rules.value.length === 0) {
      const defaultRules: Rule[] = [
        {
          id: 'rule_1',
          name: '晾衣服',
          category: '家务',
          type: 'reward',
          points: 2,
          icon: IconGenerator.generate('家务'),
          enabled: true,
          sortOrder: 1,
          description: '帮助晾晒衣物',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rule_2',
          name: '早读 20 分钟',
          category: '学习习惯',
          type: 'reward',
          points: 3,
          icon: IconGenerator.generate('学习习惯'),
          enabled: true,
          sortOrder: 2,
          description: '早上读书 20 分钟',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      Storage.rules.save(defaultRules)
      rules.value = defaultRules
    }
  }

  // 规则管理
  function addRule(ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>) {
    const newRule: Rule = {
      ...ruleData,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    Storage.rules.add(newRule)
    rules.value.push(newRule)
    return newRule
  }

  function updateRule(id: string, updates: Partial<Rule>) {
    const { createdAt, ...safeUpdates } = updates
    Storage.rules.update(id, safeUpdates)
    const index = rules.value.findIndex(r => r.id === id)
    if (index !== -1) {
      rules.value[index] = { ...rules.value[index], ...safeUpdates }
    }
  }

  function deleteRule(id: string) {
    Storage.rules.delete(id)
    rules.value = rules.value.filter(r => r.id !== id)
  }

  // 兑换商品管理
  function addRewardItem(itemData: Omit<RewardItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const newItem: RewardItem = {
      ...itemData,
      id: `reward_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    Storage.rewardItems.add(newItem)
    rewardItems.value.push(newItem)
    return newItem
  }

  function updateRewardItem(id: string, updates: Partial<RewardItem>) {
    const { createdAt, ...safeUpdates } = updates
    Storage.rewardItems.update(id, safeUpdates)
    const index = rewardItems.value.findIndex(i => i.id === id)
    if (index !== -1) {
      rewardItems.value[index] = { ...rewardItems.value[index], ...safeUpdates }
    }
  }

  function deleteRewardItem(id: string) {
    Storage.rewardItems.delete(id)
    rewardItems.value = rewardItems.value.filter(i => i.id !== id)
  }

  // 积分记录管理
  // 记录 id 追加自增序号，避免同一毫秒内批量写入（自动奖励）导致 id 冲突
  let recordSeq = 0
  function nextRecordId(): string {
    recordSeq = (recordSeq + 1) % 10000
    return `points_${Date.now()}_${recordSeq}`
  }

  /** 写入一条积分记录并同步孩子分数（不触发自动奖励对账） */
  function writePointsRecord(recordData: Omit<PointsRecord, 'id'>): PointsRecord {
    const newRecord: PointsRecord = {
      ...recordData,
      id: nextRecordId()
    }
    Storage.pointsRecords.add(newRecord)
    pointsRecords.value.push(newRecord)

    // 更新孩子积分
    if (recordData.childId) {
      const child = children.value.find(c => c.id === recordData.childId)
      if (child) {
        child.currentPoints += recordData.points
        child.totalPoints += Math.max(0, recordData.points)
        Storage.children.update(child.id, child)
      }
    }

    return newRecord
  }

  /** 删除一条积分记录并同步孩子分数（不触发自动奖励对账） */
  function removePointsRecord(id: string): void {
    const record = pointsRecords.value.find(r => r.id === id)
    if (!record) return

    // 扣除相应积分
    if (record.childId) {
      const child = children.value.find(c => c.id === record.childId)
      if (child) {
        child.currentPoints -= record.points
        child.totalPoints -= Math.max(0, record.points)
        Storage.children.update(child.id, child)
      }
    }

    // 删除记录
    Storage.pointsRecords.delete(id)
    pointsRecords.value = pointsRecords.value.filter(r => r.id !== id)
  }

  function addPointsRecord(recordData: Omit<PointsRecord, 'id'>) {
    const newRecord = writePointsRecord(recordData)
    // 每次记录变化后重新判定条件型自动奖励
    reconcileAutoRewards()
    return newRecord
  }

  /**
   * 删除积分记录
   * @param options.suppressAutoReward 若删除的是自动奖励记录，是否声明"本周期不再发放"
   */
  function deletePointsRecord(id: string, options: { suppressAutoReward?: boolean } = {}) {
    const record = pointsRecords.value.find(r => r.id === id)
    if (!record) return

    removePointsRecord(id)

    if (options.suppressAutoReward && record.source === 'auto' && record.autoRuleId) {
      suppressAutoRewardForCycle(record.autoRuleId, record.childId, record.date)
    }

    reconcileAutoRewards()
  }

  // ==================== 自动奖励引擎 ====================

  let reconcilingAutoRewards = false
  let grantSeq = 0

  function nextGrantId(): string {
    grantSeq = (grantSeq + 1) % 10000
    return `autogrant_${Date.now()}_${grantSeq}`
  }

  function findGrant(autoRuleId: string, childId: string, cycleKey: string): AutoRewardGrant | undefined {
    return autoRewardGrants.value.find(
      g => g.autoRuleId === autoRuleId && g.childId === childId && g.cycleKey === cycleKey
    )
  }

  function saveGrants(grants: AutoRewardGrant[]): void {
    autoRewardGrants.value = grants
    Storage.autoRewardGrants.save(grants)
  }

  function updateGrant(id: string, updates: Partial<AutoRewardGrant>): void {
    const index = autoRewardGrants.value.findIndex(g => g.id === id)
    if (index === -1) return
    const next = [...autoRewardGrants.value]
    next[index] = { ...next[index], ...updates }
    saveGrants(next)
  }

  function addGrant(grant: AutoRewardGrant): void {
    Storage.autoRewardGrants.add(grant)
    autoRewardGrants.value.push(grant)
  }

  /** 声明某规则在本周期内不再自动发放（家长手动删除自动奖励记录并确认时） */
  function suppressAutoRewardForCycle(autoRuleId: string, childId: string, dateStr: string): void {
    const rule = autoRewardRules.value.find(r => r.id === autoRuleId)
    const cycleType: AutoRewardCycle = rule?.cycleType ?? 'weekly'
    const cycleKey = cycleKeyOf(dateStr, cycleType)
    const ledger = findGrant(autoRuleId, childId, cycleKey)

    if (ledger) {
      updateGrant(ledger.id, { suppressed: true, revoked: true, recordId: '' })
      return
    }

    addGrant({
      id: nextGrantId(),
      autoRuleId,
      childId,
      cycleKey,
      grantDate: dateStr,
      points: 0,
      recordId: '',
      revoked: true,
      suppressed: true,
      createdAt: new Date().toISOString()
    })
  }

  interface AutoRewardChange {
    type: 'grant' | 'revoke'
    targetName: string
    points: number
  }

  /** 清理非当前周期的台账，避免长期累积 */
  function pruneAutoRewardGrants(todayStr: string): void {
    const validKeys = new Set<string>()
    for (const rule of autoRewardRules.value) {
      for (const child of children.value) {
        validKeys.add(`${rule.id}|${child.id}|${cycleKeyOf(todayStr, rule.cycleType)}`)
      }
    }
    const kept = autoRewardGrants.value.filter(g =>
      validKeys.has(`${g.autoRuleId}|${g.childId}|${g.cycleKey}`)
    )
    if (kept.length !== autoRewardGrants.value.length) saveGrants(kept)
  }

  /** 合并提示，避免一次对账连弹多条 Toast */
  function notifyAutoRewardChanges(changes: AutoRewardChange[]): void {
    if (changes.length === 0) return
    const granted = changes.filter(c => c.type === 'grant')
    const revoked = changes.filter(c => c.type === 'revoke')
    const parts: string[] = []
    if (granted.length === 1) parts.push(`已自动发放「${granted[0].targetName}」+${granted[0].points}分`)
    else if (granted.length > 1) parts.push(`已自动发放 ${granted.length} 项奖励`)
    if (revoked.length === 1) parts.push(`已撤销自动奖励「${revoked[0].targetName}」`)
    else if (revoked.length > 1) parts.push(`已撤销 ${revoked.length} 项自动奖励`)
    if (parts.length === 0) return

    // 略微延迟，避免覆盖调用方（如首页签到）刚刚弹出的提示
    setTimeout(() => {
      showToast({
        message: parts.join('，'),
        type: granted.length > 0 ? 'success' : 'info',
        duration: 2600
      })
    }, 700)
  }

  /**
   * 自动奖励对账：把「规则 + 积分记录」推到一个稳定状态。
   * - 条件型规则在每次积分记录增删后调用；时间型规则在 App 启动 / 前台恢复时调用
   * - 自动奖励自身也计入当日净得分，规则间存在依赖闭环，因此用固定点迭代收敛
   */
  function reconcileAutoRewards(): AutoRewardChange[] {
    if (reconcilingAutoRewards) return []
    if (autoRewardRules.value.length === 0) return []

    reconcilingAutoRewards = true
    const changes: AutoRewardChange[] = []

    try {
      const todayStr = formatDateOnly(new Date())
      const MAX_ROUNDS = 10

      for (let round = 0; round < MAX_ROUNDS; round++) {
        let roundChanged = false

        // 每轮重算单日净得分（发放/撤销都会改变当日得分）
        const scoresByChild = new Map<string, Map<string, number>>()
        for (const child of children.value) {
          scoresByChild.set(
            child.id,
            buildDailyScores(pointsRecords.value.filter(r => r.childId === child.id))
          )
        }

        for (const rule of autoRewardRules.value) {
          if (!rule.enabled) continue
          const target = rules.value.find(r => r.id === rule.targetRuleId)
          if (!target) continue

          for (const child of children.value) {
            const cycleKey = cycleKeyOf(todayStr, rule.cycleType)
            let ledger = findGrant(rule.id, child.id, cycleKey)

            // 已被家长声明「本周期不再发放」
            if (ledger?.suppressed) continue

            // 台账与积分记录失联（被其它路径删除）时视为已撤销
            if (ledger && !ledger.revoked && !pointsRecords.value.some(r => r.id === ledger!.recordId)) {
              updateGrant(ledger.id, { revoked: true, recordId: '' })
              ledger = findGrant(rule.id, child.id, cycleKey)
            }

            const grantDay = rule.type === 'streak'
              ? findStreakGrantDay(rule, scoresByChild.get(child.id) ?? new Map(), todayStr)
              : findScheduleGrantDay(rule, todayStr)

            const active = !!ledger && !ledger.revoked

            if (!grantDay) {
              if (active && ledger) {
                // 条件不再满足 → 同步撤销
                removePointsRecord(ledger.recordId)
                updateGrant(ledger.id, { revoked: true, recordId: '' })
                changes.push({ type: 'revoke', targetName: target.name, points: target.points })
                roundChanged = true
              }
              continue
            }

            // 已发放且条件仍满足 → 保持不变
            if (active) continue

            const grantId = ledger?.id ?? nextGrantId()
            const record = writePointsRecord({
              ruleId: target.id,
              ruleName: target.name,
              ruleIcon: target.icon,
              points: target.points,
              date: grantDay,
              completedAt: new Date().toISOString(),
              isMakeup: false,
              childId: child.id,
              source: 'auto',
              autoRuleId: rule.id,
              autoGrantId: grantId
            })

            if (ledger) {
              updateGrant(ledger.id, {
                grantDate: grantDay,
                points: target.points,
                recordId: record.id,
                revoked: false,
                suppressed: false,
                createdAt: new Date().toISOString()
              })
            } else {
              addGrant({
                id: grantId,
                autoRuleId: rule.id,
                childId: child.id,
                cycleKey,
                grantDate: grantDay,
                points: target.points,
                recordId: record.id,
                revoked: false,
                suppressed: false,
                createdAt: new Date().toISOString()
              })
            }

            changes.push({ type: 'grant', targetName: target.name, points: target.points })
            roundChanged = true
          }
        }

        if (!roundChanged) break
      }

      pruneAutoRewardGrants(todayStr)
    } finally {
      reconcilingAutoRewards = false
    }

    notifyAutoRewardChanges(changes)
    return changes
  }

  // 自动奖励规则管理
  // 追加自增序号，避免同一毫秒内创建多条规则时 id 冲突
  let autoRuleSeq = 0
  function nextAutoRuleId(): string {
    autoRuleSeq = (autoRuleSeq + 1) % 10000
    return `autorule_${Date.now()}_${autoRuleSeq}`
  }

  function addAutoRewardRule(ruleData: Omit<AutoRewardRule, 'id' | 'createdAt' | 'updatedAt'>) {
    const newRule: AutoRewardRule = {
      ...ruleData,
      id: nextAutoRuleId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    Storage.autoRewardRules.add(newRule)
    autoRewardRules.value.push(newRule)
    reconcileAutoRewards()
    return newRule
  }

  function updateAutoRewardRule(id: string, updates: Partial<AutoRewardRule>) {
    const { createdAt, ...safeUpdates } = updates
    Storage.autoRewardRules.update(id, safeUpdates)
    const index = autoRewardRules.value.findIndex(r => r.id === id)
    if (index !== -1) {
      autoRewardRules.value[index] = { ...autoRewardRules.value[index], ...safeUpdates }
    }
    reconcileAutoRewards()
  }

  function toggleAutoRewardRule(id: string) {
    const rule = autoRewardRules.value.find(r => r.id === id)
    if (!rule) return
    updateAutoRewardRule(id, { enabled: !rule.enabled })
  }

  function deleteAutoRewardRule(id: string) {
    Storage.autoRewardRules.delete(id)
    autoRewardRules.value = autoRewardRules.value.filter(r => r.id !== id)
    // 已发放的积分保留（是真实获得的分数），仅清理台账
    const kept = autoRewardGrants.value.filter(g => g.autoRuleId !== id)
    if (kept.length !== autoRewardGrants.value.length) saveGrants(kept)
    reconcileAutoRewards()
  }

  /**
   * 查询某条自动奖励规则在当前孩子 / 当前周期的状态（供列表页展示）
   * @param scores 可选的预聚合单日得分表，列表页批量查询时传入可避免重复计算
   */
  function getAutoRewardStatus(rule: AutoRewardRule, scores?: Map<string, number>) {
    const childId = currentChildId.value
    const todayStr = formatDateOnly(new Date())
    const cycleKey = cycleKeyOf(todayStr, rule.cycleType)
    const ledger = childId ? findGrant(rule.id, childId, cycleKey) : undefined

    const dailyScores = scores ?? (childId
      ? buildDailyScores(pointsRecords.value.filter(r => r.childId === childId))
      : new Map<string, number>())

    return {
      granted: !!ledger && !ledger.revoked && !ledger.suppressed,
      suppressed: !!ledger?.suppressed,
      revoked: !!ledger?.revoked && !ledger?.suppressed,
      progress: rule.type === 'streak' ? getStreakProgress(rule, dailyScores, todayStr) : 0,
      triggerDate: rule.type === 'schedule' ? getScheduleTriggerDay(rule, todayStr) : null,
      cycleKey
    }
  }

  const sortedAutoRewardRules = computed(() => {
    return [...autoRewardRules.value].sort((a, b) => a.sortOrder - b.sortOrder)
  })

  // 兑换记录管理
  function addExchangeRecord(recordData: Omit<ExchangeRecord, 'id'>) {
    const newRecord: ExchangeRecord = {
      ...recordData,
      id: `exchange_${Date.now()}`
    }
    Storage.exchangeRecords.add(newRecord)
    exchangeRecords.value.push(newRecord)
    
    // 扣除积分
    if (recordData.childId) {
      const child = children.value.find(c => c.id === recordData.childId)
      if (child) {
        child.currentPoints -= recordData.totalPoints
        Storage.children.update(child.id, child)
      }
    }
    
    return newRecord
  }

  // 孩子管理
  function addChild(childData: Omit<Child, 'id'>) {
    const newChild: Child = {
      ...childData,
      id: `child_${Date.now()}`
    }
    Storage.children.add(newChild)
    children.value.push(newChild)
    return newChild
  }

  function updateChildName(id: string, newName: string) {
    const child = children.value.find(c => c.id === id)
    if (child) {
      child.name = newName
      Storage.children.update(id, child)
    }
  }

  function deleteChild(id: string) {
    // 删除孩子的所有积分记录
    const recordsToDelete = pointsRecords.value.filter(r => r.childId === id)
    recordsToDelete.forEach(record => {
      Storage.pointsRecords.delete(record.id)
    })
    pointsRecords.value = pointsRecords.value.filter(r => r.childId !== id)
    
    // 删除孩子的所有兑换记录
    const exchangesToDelete = exchangeRecords.value.filter(r => r.childId === id)
    exchangesToDelete.forEach(record => {
      Storage.exchangeRecords.delete(record.id)
    })
    exchangeRecords.value = exchangeRecords.value.filter(r => r.childId !== id)

    // 删除孩子的自动奖励台账
    const remainingGrants = autoRewardGrants.value.filter(g => g.childId !== id)
    if (remainingGrants.length !== autoRewardGrants.value.length) {
      saveGrants(remainingGrants)
    }

    // 删除孩子
    Storage.children.delete(id)
    children.value = children.value.filter(c => c.id !== id)

    // 保持与其他记录变更路径一致：删除孩子后重新对账一次
    reconcileAutoRewards()
  }

  function switchChild(id: string) {
    currentChildId.value = id
    Storage.children.setCurrentId(id)
  }

  // 刷新数据 - 从持久化存储重新加载所有数据
  function refreshData() {
    loadFromStorage()
  }

  // 备份恢复 - 使用 Share 插件分享文件
  async function exportBackup() {
    try {
      // 生成备份数据
      const backupData = {
        rules: rules.value,
        rewardItems: rewardItems.value,
        pointsRecords: pointsRecords.value,
        exchangeRecords: exchangeRecords.value,
        children: children.value,
        luckyTasks: luckyTasks.value,
        reminders: reminders.value,
        autoRewardRules: autoRewardRules.value,
        autoRewardGrants: autoRewardGrants.value,
        backupAt: new Date().toISOString(),
        version: '1.0.0'
      }
      
      // 转换为 JSON 字符串
      const jsonString = JSON.stringify(backupData, null, 2)
      // 使用本地时间格式化，避免时区问题
      const fileName = `积分备份_${formatDateOnly(new Date())}.json`
      
      // 创建 Blob 并转换为 Base64
      const blob = new Blob([jsonString], { type: 'application/json' })
      const base64 = await blobToBase64(blob)
      
      // 导入 Share 插件
      const { Share } = await import('@capacitor/share')
      
      // 使用 Share 插件分享文件
      await Share.share({
        title: '备份数据',
        text: jsonString,
        dialogTitle: '分享到'
      })
    } catch (error) {
      console.error('备份失败:', error)
      throw error
    }
  }
  
  // 辅助函数：将 Blob 转换为 Base64
  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async function importBackup(file: File) {
    const data = await Storage.importFromFile(file)
    Storage.restore(data)
    
    // 重新加载数据
    loadFromStorage()
    
    // 恢复后的提醒需要重新排期到系统
    await syncReminders(false)

    // 恢复的数据可能与自动奖励台账不一致，重新对账一次
    reconcileAutoRewards()
  }

  // 幸运任务管理
  function addLuckyTask(taskData: Omit<LuckyTask, 'id' | 'createdAt' | 'updatedAt'>) {
    const newTask: LuckyTask = {
      ...taskData,
      id: `lucky_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    Storage.luckyTasks.add(newTask)
    luckyTasks.value.push(newTask)
    return newTask
  }

  function updateLuckyTask(id: string, updates: Partial<LuckyTask>) {
    const { createdAt, ...safeUpdates } = updates
    Storage.luckyTasks.update(id, safeUpdates)
    const index = luckyTasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      luckyTasks.value[index] = { ...luckyTasks.value[index], ...safeUpdates }
    }
  }

  function deleteLuckyTask(id: string) {
    Storage.luckyTasks.delete(id)
    luckyTasks.value = luckyTasks.value.filter(t => t.id !== id)
  }

  // 定时提醒管理
  // 生成稳定的系统通知 ID：取现有最大值 +1，从 100 起，避免删除后下标错位
  function nextNotifyId(): number {
    const maxId = reminders.value.reduce(
      (max, reminder) => Math.max(max, reminder.notifyId || 0),
      REMINDER_NOTIFY_ID_BASE - 1
    )
    return maxId + 1
  }

  function addReminder(reminderData: Omit<Reminder, 'id' | 'notifyId' | 'createdAt' | 'updatedAt'>) {
    const newReminder: Reminder = {
      ...reminderData,
      id: `reminder_${Date.now()}`,
      notifyId: nextNotifyId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    Storage.reminders.add(newReminder)
    reminders.value.push(newReminder)
    return newReminder
  }

  function updateReminder(id: string, updates: Partial<Reminder>) {
    // notifyId 与 createdAt 不允许被外部覆盖
    const { createdAt, notifyId, id: _id, ...safeUpdates } = updates
    Storage.reminders.update(id, safeUpdates)
    const index = reminders.value.findIndex(r => r.id === id)
    if (index !== -1) {
      reminders.value[index] = { ...reminders.value[index], ...safeUpdates }
    }
  }

  function deleteReminder(id: string) {
    Storage.reminders.delete(id)
    reminders.value = reminders.value.filter(r => r.id !== id)
  }

  function toggleReminder(id: string) {
    const reminder = reminders.value.find(r => r.id === id)
    if (!reminder) return
    const enabled = !reminder.enabled
    Storage.reminders.update(id, { enabled })
    reminder.enabled = enabled
  }

  /**
   * 把系统里已排期的通知与当前提醒配置对齐。
   * 每次启动、从后台恢复、以及增删改提醒后都会调用。
   * @param requestPermission 是否允许弹出系统授权框
   */
  async function syncReminders(requestPermission = false) {
    const outcome = await syncSystemReminders(reminders.value, requestPermission)
    reminderState.value = {
      supported: outcome.supported,
      permission: outcome.permission,
      exactAlarmGranted: outcome.exactAlarmGranted,
      scheduled: outcome.scheduled,
      lastSyncAt: new Date().toISOString(),
      lastError: outcome.notice
    }
    return outcome
  }

  /** 发送一条立即触发的测试通知 */
  async function sendTestReminder(title: string, body: string) {
    return sendTestNotification(title, body)
  }

  // 切换深色模式
  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    if (darkMode.value) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.backgroundColor = 'var(--dark-bg)'
      document.body.style.backgroundColor = 'var(--dark-bg)'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.backgroundColor = 'var(--bg-color)'
      document.body.style.backgroundColor = 'var(--bg-color)'
    }
    // 保存到 localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode.value))
  }

  // 将 Date 对象格式化为 YYYY-MM-DD 格式的本地日期字符串（避免时区问题）
  function formatDateOnly(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    // State
    rules,
    rewardItems,
    pointsRecords,
    exchangeRecords,
    children,
    currentChildId,
    darkMode,
    // Getters
    currentChild,
    enabledRules,
    enabledRewardItems,
    todayRecords,
    todayPoints,
    totalPoints,
    // Actions
    initDefaultData,
    addRule,
    updateRule,
    deleteRule,
    addRewardItem,
    updateRewardItem,
    deleteRewardItem,
    addPointsRecord,
    deletePointsRecord,
    addExchangeRecord,
    addChild,
    updateChildName,
    deleteChild,
    switchChild,
    exportBackup,
    importBackup,
    toggleDarkMode,
    refreshData,
    // 幸运任务管理
    luckyTasks,
    addLuckyTask,
    updateLuckyTask,
    deleteLuckyTask,
    // 定时提醒管理
    reminders,
    reminderState,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    syncReminders,
    sendTestReminder,
    // 自动奖励管理
    autoRewardRules,
    autoRewardGrants,
    sortedAutoRewardRules,
    addAutoRewardRule,
    updateAutoRewardRule,
    deleteAutoRewardRule,
    toggleAutoRewardRule,
    getAutoRewardStatus,
    reconcileAutoRewards
  }
})
