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
            @change="clearSelection"
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

    <!-- 单日补录 -->
    <div class="single-mode">
      <div v-for="group in groupedRules" :key="group.category" class="section">
        <h2 class="section-title">{{ group.category }}</h2>
        <div class="rules-grid">
          <div 
            v-for="rule in group.rules" 
            :key="rule.id"
            class="rule-card"
            :class="{ 
              selected: selectedRules.includes(rule.id),
              disabled: isRuleCompletedOnDate(rule.id, selectedDate) && !cancelRuleIds.includes(rule.id),
              'cancel-marked': cancelRuleIds.includes(rule.id)
            }"
            @click="toggleRule(rule)"
          >
            <span class="rule-card__icon">{{ rule.icon }}</span>
            <div class="rule-card__info">
              <div class="rule-card__name">{{ rule.name }}</div>
              <div class="rule-card__points">{{ rule.points > 0 ? '+' : '' }}{{ rule.points }}分</div>
            </div>
            <div v-if="selectedRules.includes(rule.id)" class="checkmark">✓</div>
            <div v-if="cancelRuleIds.includes(rule.id)" class="cancel-mark">✕</div>
            <div v-else-if="isRuleCompletedOnDate(rule.id, selectedDate)" class="completed-flag">
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

// 按分类分组的规则
const groupedRules = computed(() => {
  const groups: { category: string; rules: Rule[] }[] = []
  const categoryOrder = ['学习习惯', '生活习惯', '家务', '加分项', '惩罚']
  
  for (const cat of categoryOrder) {
    const rulesInCat = enabledRules.value.filter(r => r.category === cat)
    if (rulesInCat.length > 0) {
      groups.push({ category: cat, rules: rulesInCat })
    }
  }
  return groups
})

const selectedDate = ref(formatDateOnly(new Date()))
const selectedRules = ref<string[]>([])
const cancelRuleIds = ref<string[]>([])
const note = ref('')

// 页面挂载时滚动到顶部
onMounted(() => {
  window.scrollTo(0, 0)
})

// 选中日期对应的积分记录（修复：基于 selectedDate 而非 today）
const recordsForSelectedDate = computed(() => {
  return store.pointsRecords.filter(
    r => r.date === selectedDate.value && r.childId === store.currentChildId
  )
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

const prevDay = () => {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() - 1)
  selectedDate.value = formatDateOnly(date)
  clearSelection()
}

const nextDay = () => {
  const date = new Date(selectedDate.value)
  date.setDate(date.getDate() + 1)
  selectedDate.value = formatDateOnly(date)
  clearSelection()
}

const clearSelection = () => {
  selectedRules.value = []
  cancelRuleIds.value = []
}

const toggleRule = (rule: Rule) => {
  const isCompleted = isRuleCompletedOnDate(rule.id, selectedDate.value)
  
  if (isCompleted) {
    // 已完成项：点击切换取消状态
    const idx = cancelRuleIds.value.indexOf(rule.id)
    if (idx === -1) {
      cancelRuleIds.value.push(rule.id)
    } else {
      cancelRuleIds.value.splice(idx, 1)
    }
    return
  }
  
  // 未完成项：正常切换选择状态
  const index = selectedRules.value.indexOf(rule.id)
  if (index === -1) {
    selectedRules.value.push(rule.id)
  } else {
    selectedRules.value.splice(index, 1)
  }
}

const submitSingle = () => {
  // 如果没有选择任何操作
  if (selectedRules.value.length === 0 && cancelRuleIds.value.length === 0) {
    showToast({ message: '请至少选择一个规则进行补录或取消', type: 'warning' })
    return
  }

  let cancelCount = 0
  let addCount = 0

  // 处理取消：删除已完成记录的积分
  cancelRuleIds.value.forEach(ruleId => {
    const record = recordsForSelectedDate.value.find(r => r.ruleId === ruleId)
    if (record) {
      store.deletePointsRecord(record.id)
      cancelCount++
    }
  })

  // 处理补录：添加新记录
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
      addCount++
    }
  })

  // 提示结果
  const msgs: string[] = []
  if (addCount > 0) msgs.push(`成功补录 ${addCount} 项积分`)
  if (cancelCount > 0) msgs.push(`已取消 ${cancelCount} 项积分`)
  showToast({ message: msgs.join('，'), type: 'success' })
  
  selectedRules.value = []
  cancelRuleIds.value = []
  note.value = ''
}

// 检查规则在指定日期是否已完成
const isRuleCompletedOnDate = (ruleId: string, date: string) => {
  return recordsForSelectedDate.value.some(r => r.ruleId === ruleId && r.date === date)
}

const goBack = () => {
  window.history.back()
}

</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.record-page {
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
    cursor: pointer;
    background: rgba(107, 114, 128, 0.05);
    
  }
  
  &.cancel-marked {
    border: 2px solid var(--danger-color, #ef4444);
    background: rgba(239, 68, 68, 0.08);
    opacity: 1;
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
  padding: 2px 8px;
  background: var(--text-muted);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.cancel-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: var(--danger-color, #ef4444);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
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
