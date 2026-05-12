<template>
  <div class="record-page">
    <!-- 头部导航 -->
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="goBack">
        ←
      </button>
      <h1 class="page-title">📝 手工补录</h1>
    </div>
    
    <!-- 日期选择 -->
    <div class="date-selector glass-card">
      <div class="date-selector__header">
        <button class="btn btn--primary btn--sm" @click="prevDay">◀</button>
        <div class="date-selector__current">
          <input 
            type="date" 
            v-model="selectedDate"
            class="date-input"
          />
        </div>
        <button class="btn btn--primary btn--sm" @click="nextDay">▶</button>
      </div>
      <div class="date-selector__info">
        <span>{{ weekDay }}</span>
        <span v-if="isToday" class="today-badge">今天</span>
        <span v-else-if="isYesterday" class="yesterday-badge">昨天</span>
      </div>
    </div>

    <!-- 补录模式切换 -->
    <div class="mode-switch">
      <div 
        class="mode-option"
        :class="{ active: mode === 'single' }"
        @click="mode = 'single'"
      >
        <span>单日补录</span>
      </div>
      <div 
        class="mode-option"
        :class="{ active: mode === 'batch' }"
        @click="mode = 'batch'"
      >
        <span>批量补录</span>
      </div>
    </div>

    <!-- 单日补录 -->
    <div v-if="mode === 'single'" class="single-mode">
      <div class="section">
        <h2 class="section-title">选择规则</h2>
        <div class="rules-grid">
          <div 
            v-for="rule in enabledRules" 
            :key="rule.id"
            class="rule-card"
            :class="{ 
              selected: selectedRules.includes(rule.id),
              disabled: isRuleCompletedOnDate(rule.id, selectedDate)
            }"
            @click="toggleRule(rule)"
          >
            <span class="rule-card__icon">{{ rule.icon }}</span>
            <div class="rule-card__info">
              <div class="rule-card__name">{{ rule.name }}</div>
              <div class="rule-card__points">{{ rule.points > 0 ? '+' : '' }}{{ rule.points }}分</div>
            </div>
            <div v-if="selectedRules.includes(rule.id)" class="checkmark">✓</div>
            <div v-if="isRuleCompletedOnDate(rule.id, selectedDate)" class="completed-flag">
              已完成
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">备注（选填）</h2>
        <textarea 
          v-model="note"
          class="note-input"
          placeholder="记录具体情况..."
          rows="3"
        ></textarea>
      </div>

      <button class="btn btn--primary btn--large" @click="submitSingle">
        ✓ 确认补录
      </button>
    </div>

    <!-- 批量补录 -->
    <div v-else class="batch-mode">
      <div class="section">
        <h2 class="section-title">日期范围</h2>
        <div class="date-range">
          <div class="date-field">
            <label>开始日期</label>
            <input type="date" v-model="batchStartDate" class="input" />
          </div>
          <div class="date-field">
            <label>结束日期</label>
            <input type="date" v-model="batchEndDate" class="input" />
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">选择规则</h2>
        <div class="rules-list">
          <div 
            v-for="rule in enabledRules" 
            :key="rule.id"
            class="rule-item"
            :class="{ selected: batchSelectedRules.includes(rule.id) }"
            @click="toggleBatchRule(rule)"
          >
            <span class="rule-item__icon">{{ rule.icon }}</span>
            <div class="rule-item__info">
              <div class="rule-item__name">{{ rule.name }}</div>
              <div class="rule-item__category">{{ rule.category }}</div>
            </div>
            <div class="rule-item__points">{{ rule.points > 0 ? '+' : '' }}{{ rule.points }}分</div>
          </div>
        </div>
      </div>

      <button class="btn btn--primary btn--large" @click="submitBatch">
        📋 批量补录 ({{ dayCount }}天)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import type { Rule, PointsRecord } from '@/types'
import { showToast } from '@/utils/toast'

// 将 Date 对象格式化为 YYYY-MM-DD 格式的本地日期字符串（避免时区问题）
const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

const store = useAppStore()

const enabledRules = computed(() => store.enabledRules)

const selectedDate = ref(formatDateOnly(new Date()))
const mode = ref<'single' | 'batch'>('single')
const selectedRules = ref<string[]>([])
const note = ref('')

const batchStartDate = ref('')
const batchEndDate = ref('')
const batchSelectedRules = ref<string[]>([])

// 页面挂载时滚动到顶部
onMounted(() => {
  window.scrollTo(0, 0)
})

const isToday = computed(() => {
  const today = formatDateOnly(new Date())
  return selectedDate.value === today
})

const isYesterday = computed(() => {
  const yesterday = new Date(Date.now() - 86400000)
  const yesterdayStr = formatDateOnly(yesterday)
  return selectedDate.value === yesterdayStr
})

const weekDay = computed(() => {
  const date = new Date(selectedDate.value)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekDays[date.getDay()]
})

const dayCount = computed(() => {
  if (!batchStartDate.value || !batchEndDate.value) return 0
  const start = new Date(batchStartDate.value)
  const end = new Date(batchEndDate.value)
  const diff = end.getTime() - start.getTime()
  return Math.floor(diff / 86400000) + 1
})

const prevDay = () => {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() - 1)
  selectedDate.value = formatDateOnly(date)
}

const nextDay = () => {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() + 1)
  selectedDate.value = formatDateOnly(date)
}

const toggleRule = (rule: Rule) => {
  // 如果该规则在今天已经完成，不允许选择
  if (isRuleCompletedOnDate(rule.id, selectedDate.value)) {
    showToast({ message: '该规则在选定的日期已经完成过了，无法重复补录！', type: 'warning' })
    return
  }
  
  const index = selectedRules.value.indexOf(rule.id)
  if (index === -1) {
    selectedRules.value.push(rule.id)
  } else {
    selectedRules.value.splice(index, 1)
  }
}

const toggleBatchRule = (rule: Rule) => {
  const index = batchSelectedRules.value.indexOf(rule.id)
  if (index === -1) {
    batchSelectedRules.value.push(rule.id)
  } else {
    batchSelectedRules.value.splice(index, 1)
  }
}

const submitSingle = () => {
  if (selectedRules.value.length === 0) {
    showToast({ message: '请至少选择一个规则', type: 'warning' })
    return
  }

  // 再次检查是否有规则已经存在
  const existingRules = selectedRules.value.filter(ruleId => 
    isRuleCompletedOnDate(ruleId, selectedDate.value)
  )
  
  if (existingRules.length > 0) {
    const ruleNames = existingRules.map(id => {
      const rule = enabledRules.value.find(r => r.id === id)
      return rule ? rule.name : ''
    }).filter(name => name).join(', ')
    showToast({ message: `以下规则在 ${selectedDate.value} 已经完成，无法重复补录：${ruleNames}`, type: 'warning' })
    return
  }

  selectedRules.value.forEach(ruleId => {
    const rule = enabledRules.value.find(r => r.id === ruleId)
    if (rule) {
      const record: Omit<PointsRecord, 'id'> = {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleIcon: rule.icon,
        points: rule.points,
        date: selectedDate.value,
        completedAt: new Date().toISOString(),
        isMakeup: true,
        childId: store.currentChildId!,
        note: note.value
      }
      store.addPointsRecord(record)
    }
  })

  showToast({ message: `成功补录 ${selectedRules.value.length} 项积分！`, type: 'success' })
  selectedRules.value = []
  note.value = ''
}

const submitBatch = () => {
  if (batchSelectedRules.value.length === 0) {
    showToast({ message: '请至少选择一个规则', type: 'warning' })
    return
  }

  if (!batchStartDate.value || !batchEndDate.value) {
    showToast({ message: '请选择日期范围', type: 'warning' })
    return
  }

  const start = new Date(batchStartDate.value)
  const end = new Date(batchEndDate.value)
  let count = 0

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateOnly(d)
    
    batchSelectedRules.value.forEach(ruleId => {
      const rule = enabledRules.value.find(r => r.id === ruleId)
      if (rule) {
        const record: Omit<PointsRecord, 'id'> = {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleIcon: rule.icon,
          points: rule.points,
          date: dateStr,
          completedAt: new Date().toISOString(),
          isMakeup: true,
          childId: store.currentChildId!
        }
        store.addPointsRecord(record)
        count++
      }
    })
  }

  showToast({ message: `成功批量补录 ${count} 条记录！`, type: 'success' })
  batchSelectedRules.value = []
  batchStartDate.value = ''
  batchEndDate.value = ''
}

// 检查规则在指定日期是否已完成
const isRuleCompletedOnDate = (ruleId: string, date: string) => {
  return store.todayRecords.some(r => r.ruleId === ruleId && r.date === date)
}

const goBack = () => {
  window.history.back()
}

</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.record-page {
  // 添加顶部安全区域，避免内容被状态栏遮挡
  padding-top: calc(var(--spacing-lg) + env(safe-area-inset-top, 0px));
  max-width: 480px;
  margin: 0 auto;
  background: transparent;
  min-height: 100vh;
  animation: fade-in 0.5s ease;
  
  > *:not(.header) {
    padding-left: var(--spacing-lg);
    padding-right: var(--spacing-lg);
  }
}

.date-selector {
  margin-bottom: var(--spacing-xl);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow);
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }
  
  &__current {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  &__info {
    text-align: center;
    color: var(--text-secondary);
    font-size: 14px;
  }
}

.date-input {
  border: none;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  background: transparent;
  color: var(--text-primary);
}

.mode-switch {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  background: var(--card-bg);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

.mode-option {
  flex: 1;
  padding: var(--spacing-md);
  text-align: center;
  background: var(--bg-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  color: var(--text-primary);
  
  &.active {
    background: var(--primary-color);
    color: white !important;
  }
  
  @media (prefers-color-scheme: dark) {
    background: var(--dark-bg);
    color: var(--dark-text-primary);
    
    &.active {
      background: var(--primary-color);
      color: white !important;
    }
  }
}

.section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  &__dot {
    width: 4px;
    height: 18px;
    background: linear-gradient(180deg, var(--primary-color), var(--primary-light));
    border-radius: 2px;
    flex-shrink: 0;
  }
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.rule-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  
  &.selected {
    border: 2px solid var(--primary-color);
    background: rgba(99, 102, 241, 0.05);
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(107, 114, 128, 0.05);
    
  }
  
  &__icon {
    font-size: 32px;
  }
  
  &__info {
    flex: 1;
  }
  
  &__name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
    color: var(--text-primary);
  }
  
  &__points {
    font-size: 12px;
    color: var(--success-color);
    font-weight: 600;
  }
}

.checkmark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.completed-flag {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 40px;
  height: 20px;
  background: var(--text-muted);
  color: white;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.note-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  resize: vertical;
  background: var(--card-bg);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
}

.date-range {
  display: flex;
  gap: var(--spacing-md);
}

.date-field {
  flex: 1;
  
  label {
    display: block;
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  .input {
    width: 100%;
    padding: var(--spacing-md);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 14px;
    background: var(--card-bg);
    color: var(--text-primary);
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.rule-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: border-color 0.2s ease;
  
  &.selected {
    border: 2px solid var(--primary-color);
  }
  
  &__icon {
    font-size: 32px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  &__info {
    flex: 1;
  }
  
  &__name {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
    color: var(--text-primary);
  }
  
  &__category {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  &__points {
    font-size: 16px;
    font-weight: 600;
    color: var(--success-color);
  }
}

.btn--large {
  width: 100%;
  padding: 16px;
  font-size: 18px;
}

.today-badge, .yesterday-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  margin-left: var(--spacing-sm);
}

.today-badge {
  background: var(--primary-color);
  color: white;
}

.yesterday-badge {
  background: var(--text-muted);
  color: white;
}

.glass-card {
  @include glass-card;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
