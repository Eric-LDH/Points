import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Rule, RewardItem, PointsRecord, ExchangeRecord, Child, LuckyTask } from '@/types'
import { IconGenerator } from '@/utils/iconGenerator'
import { Storage } from '@/utils/storage'

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

  // 从 localStorage 加载数据
  function loadFromStorage() {
    rules.value = Storage.rules.getAll()
    rewardItems.value = Storage.rewardItems.getAll()
    pointsRecords.value = Storage.pointsRecords.getAll()
    exchangeRecords.value = Storage.exchangeRecords.getAll()
    children.value = Storage.children.getAll()
    currentChildId.value = Storage.children.getCurrentId()
    luckyTasks.value = Storage.luckyTasks.getAll()
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
    const today = new Date().toISOString().split('T')[0]
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
    const { icon, createdAt, ...safeUpdates } = updates
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
  function addPointsRecord(recordData: Omit<PointsRecord, 'id'>) {
    const newRecord: PointsRecord = {
      ...recordData,
      id: `points_${Date.now()}`
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

  function deletePointsRecord(id: string) {
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
    
    // 删除孩子
    Storage.children.delete(id)
    children.value = children.value.filter(c => c.id !== id)
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
        backupAt: new Date().toISOString(),
        version: '1.0.0'
      }
      
      // 转换为 JSON 字符串
      const jsonString = JSON.stringify(backupData, null, 2)
      const fileName = `积分备份_${new Date().toISOString().split('T')[0]}.json`
      
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
    deleteLuckyTask
  }
})
