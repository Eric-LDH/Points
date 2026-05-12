import type { Rule, RewardItem, PointsRecord, ExchangeRecord, Child, BackupData, LuckyTask } from '@/types'

const STORAGE_KEYS = {
  RULES: 'points_rules',
  REWARD_ITEMS: 'points_reward_items',
  POINTS_RECORDS: 'points_records',
  EXCHANGE_RECORDS: 'points_exchange_records',
  CHILDREN: 'points_children',
  CURRENT_CHILD_ID: 'points_current_child_id',
  LUCKY_TASKS: 'points_lucky_tasks' // 幸运任务配置列表
}

export const Storage = {
  /**
   * 规则管理
   */
  rules: {
    getAll(): Rule[] {
      const data = localStorage.getItem(STORAGE_KEYS.RULES)
      return data ? JSON.parse(data) : []
    },

    save(rules: Rule[]): void {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules))
    },

    add(rule: Rule): void {
      const rules = this.getAll()
      rules.push(rule)
      this.save(rules)
    },

    update(id: string, updates: Partial<Rule>): void {
      const rules = this.getAll()
      const index = rules.findIndex(r => r.id === id)
      if (index !== -1) {
        rules[index] = { ...rules[index], ...updates, updatedAt: new Date().toISOString() }
        this.save(rules)
      }
    },

    delete(id: string): void {
      const rules = this.getAll()
      const filtered = rules.filter(r => r.id !== id)
      this.save(filtered)
    }
  },

  /**
   * 兑换商品管理
   */
  rewardItems: {
    getAll(): RewardItem[] {
      const data = localStorage.getItem(STORAGE_KEYS.REWARD_ITEMS)
      return data ? JSON.parse(data) : []
    },

    save(items: RewardItem[]): void {
      localStorage.setItem(STORAGE_KEYS.REWARD_ITEMS, JSON.stringify(items))
    },

    add(item: RewardItem): void {
      const items = this.getAll()
      items.push(item)
      this.save(items)
    },

    update(id: string, updates: Partial<RewardItem>): void {
      const items = this.getAll()
      const index = items.findIndex(i => i.id === id)
      if (index !== -1) {
        items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() }
        this.save(items)
      }
    },

    delete(id: string): void {
      const items = this.getAll()
      const filtered = items.filter(i => i.id !== id)
      this.save(filtered)
    }
  },

  /**
   * 积分记录管理
   */
  pointsRecords: {
    getAll(): PointsRecord[] {
      const data = localStorage.getItem(STORAGE_KEYS.POINTS_RECORDS)
      return data ? JSON.parse(data) : []
    },

    save(records: PointsRecord[]): void {
      localStorage.setItem(STORAGE_KEYS.POINTS_RECORDS, JSON.stringify(records))
    },

    add(record: PointsRecord): void {
      const records = this.getAll()
      records.push(record)
      this.save(records)
    },

    getByDate(date: string, childId: string): PointsRecord[] {
      const records = this.getAll()
      return records.filter(r => r.date === date && r.childId === childId)
    },

    getByChild(childId: string): PointsRecord[] {
      const records = this.getAll()
      return records.filter(r => r.childId === childId)
    },

    delete(id: string): void {
      const records = this.getAll()
      const filtered = records.filter(r => r.id !== id)
      this.save(filtered)
    }
  },

  /**
   * 兑换记录管理
   */
  exchangeRecords: {
    getAll(): ExchangeRecord[] {
      const data = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RECORDS)
      return data ? JSON.parse(data) : []
    },

    save(records: ExchangeRecord[]): void {
      localStorage.setItem(STORAGE_KEYS.EXCHANGE_RECORDS, JSON.stringify(records))
    },

    add(record: ExchangeRecord): void {
      const records = this.getAll()
      records.push(record)
      this.save(records)
    },

    getByChild(childId: string): ExchangeRecord[] {
      const records = this.getAll()
      return records.filter(r => r.childId === childId)
    },

    getByCycle(cycleType: string, childId: string, startDate: Date): ExchangeRecord[] {
      const records = this.getByChild(childId)
      return records.filter(r => {
        const recordDate = new Date(r.exchangeDate)
        return r.cycleType === cycleType && recordDate >= startDate
      })
    },

    delete(id: string): void {
      const records = this.getAll()
      const filtered = records.filter(r => r.id !== id)
      this.save(filtered)
    }
  },

  /**
   * 孩子管理
   */
  children: {
    getAll(): Child[] {
      const data = localStorage.getItem(STORAGE_KEYS.CHILDREN)
      return data ? JSON.parse(data) : []
    },

    save(children: Child[]): void {
      localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children))
    },

    add(child: Child): void {
      const children = this.getAll()
      children.push(child)
      this.save(children)
    },

    update(id: string, updates: Partial<Child>): void {
      const children = this.getAll()
      const index = children.findIndex(c => c.id === id)
      if (index !== -1) {
        children[index] = { ...children[index], ...updates }
        this.save(children)
      }
    },

    getCurrentId(): string | null {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_CHILD_ID)
    },

    setCurrentId(id: string): void {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHILD_ID, id)
    },

    delete(id: string): void {
      const children = this.getAll()
      const filtered = children.filter(c => c.id !== id)
      this.save(filtered)
    }
  },

  /**
   * 幸运任务管理
   */
  luckyTasks: {
    getAll(): LuckyTask[] {
      const data = localStorage.getItem(STORAGE_KEYS.LUCKY_TASKS)
      return data ? JSON.parse(data) : []
    },

    save(tasks: LuckyTask[]): void {
      localStorage.setItem(STORAGE_KEYS.LUCKY_TASKS, JSON.stringify(tasks))
    },

    add(task: LuckyTask): void {
      const tasks = this.getAll()
      tasks.push(task)
      this.save(tasks)
    },

    update(id: string, updates: Partial<LuckyTask>): void {
      const tasks = this.getAll()
      const index = tasks.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() }
        this.save(tasks)
      }
    },

    delete(id: string): void {
      const tasks = this.getAll()
      const filtered = tasks.filter(t => t.id !== id)
      this.save(filtered)
    }
  },

  /**
   * 备份与恢复
   */
  backup(): BackupData {
    const data: BackupData = {
      rules: this.rules.getAll(),
      rewardItems: this.rewardItems.getAll(),
      pointsRecords: this.pointsRecords.getAll(),
      exchangeRecords: this.exchangeRecords.getAll(),
      children: this.children.getAll(),
      luckyTasks: this.luckyTasks.getAll(),
      backupAt: new Date().toISOString(),
      version: '1.0.0'
    }
    return data
  },

  restore(data: BackupData): void {
    if (data.rules) this.rules.save(data.rules)
    if (data.rewardItems) this.rewardItems.save(data.rewardItems)
    if (data.pointsRecords) this.pointsRecords.save(data.pointsRecords)
    if (data.exchangeRecords) this.exchangeRecords.save(data.exchangeRecords)
    if (data.children) this.children.save(data.children)
    if (data.luckyTasks) this.luckyTasks.save(data.luckyTasks)
  },

  exportToFile(): void {
    const data = this.backup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // 使用本地时间格式化，避免时区问题
    const dateStr = formatDateOnly(new Date())
    a.download = `积分备份_${dateStr}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  importFromFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as BackupData
          resolve(data)
        } catch (error) {
          reject(new Error('文件格式错误'))
        }
      }
      reader.onerror = () => reject(new Error('读取失败'))
      reader.readAsText(file)
    })
  }
}

// 将 Date 对象格式化为 YYYY-MM-DD 格式的本地日期字符串（避免时区问题）
function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}
