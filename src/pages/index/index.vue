<template>
  <div class="index-page">
    <!-- 头部问候 -->
    <div class="header card">
      <div class="header__greeting">
        <span class="header__emoji">👋</span>
        <div>
          <h1 class="header__title">你好，{{ currentChild?.name || '宝贝' }}</h1>
          <p class="header__date">{{ currentDate }} {{ weekDay }}</p>
        </div>
      </div>
      
      <div class="header__stats">
        <div class="stat-item">
          <div class="stat-item__label">今日积分</div>
          <div class="stat-item__value text-primary">{{ todayPoints > 0 ? '+' : '' }}{{ todayPoints }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-item__label">累计积分</div>
          <div class="stat-item__value text-success">{{ totalPoints }}</div>
        </div>
      </div>
      
      <div class="header__streak">
        <span class="header__streak-icon">🔥</span>
        <span>连续打卡 {{ streakDays }} 天</span>
      </div>
    </div>

    <!-- 快捷记录 -->
    <div class="quick-actions">
      <h2 class="section-title">⚡ 快捷记录</h2>
      <div class="quick-actions__grid">
        <div 
          v-for="category in categories" 
          :key="category.name"
          class="quick-action-btn"
          @click="showQuickRecord(category)"
        >
          <span class="quick-action-btn__icon">{{ category.icon }}</span>
          <span>{{ category.name }}</span>
        </div>
      </div>
    </div>

    <!-- 待完成奖励 -->
    <div class="section">
      <h2 class="section-title">⭕ 待完成奖励 ({{ pendingRules.length }}项)</h2>
      <div v-if="pendingRules.length === 0" class="empty-state">
        <span class="empty-state__emoji">🎉</span>
        <p>所有任务都已完成！</p>
      </div>
      <div v-else class="rules-list">
        <div 
          v-for="rule in pendingRules" 
          :key="rule.id"
          class="rule-item"
        >
          <div class="rule-item__left">
            <span class="rule-item__icon">{{ rule.icon }}</span>
            <div>
              <div class="rule-item__name">{{ rule.name }}</div>
              <div class="rule-item__info">
                <span class="rule-item__category">{{ rule.category }}</span>
                <span v-if="isRuleCompletedToday(rule.id)" class="rule-item__points">
                  {{ rule.points > 0 ? '+' : '' }}{{ rule.points }}分
                </span>
              </div>
            </div>
          </div>
          <div class="rule-item__actions">
            <button 
              v-if="!isRuleCompletedToday(rule.id)"
              class="btn btn--success btn--sm"
              @click="completeRule(rule)"
            >
              ✓ 完成
            </button>
            <template v-else>
              <span class="completed-tag">
                ✓ 已完成
              </span>
              <button 
                class="btn btn--outline btn--sm danger"
                @click="cancelRuleCompletion(rule)"
              >
                ✕ 取消
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷记录弹窗 -->
    <div v-if="showQuickModal" class="modal-overlay" @click="showQuickModal = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">选择{{ selectedCategory?.name }}规则</h3>
        <div class="modal-content">
          <div 
            v-for="rule in filteredRules" 
            :key="rule.id"
            class="rule-option"
            :class="{ 'completed': isRuleCompletedToday(rule.id) }"
            @click="selectRule(rule)"
          >
            <span class="rule-option__icon">{{ rule.icon }}</span>
            <div class="rule-option__info">
              <div class="rule-option__name">
                {{ rule.name }}
                <span v-if="isRuleCompletedToday(rule.id)" class="completed-badge">✓</span>
              </div>
              <div class="rule-option__points">{{ rule.points > 0 ? '+' : '' }}{{ rule.points }}分</div>
            </div>
            <!-- 已完成的规则显示取消按钮 -->
            <button 
              v-if="isRuleCompletedToday(rule.id)"
              class="btn btn--outline btn--sm danger"
              @click.stop="cancelRuleCompletion(rule)"
            >
              ✕ 取消
            </button>
            <!-- 未完成的规则不显示任何标签 -->
          </div>
        </div>
        <button class="btn btn--outline modal-close" @click="showQuickModal = false">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores'
import type { Rule, PointsRecord } from '@/types'
import { showToast } from '@/utils/toast'

const store = useAppStore()

const currentChild = computed(() => store.currentChild)
const todayRecords = computed(() => store.todayRecords)
const todayPoints = computed(() => store.todayPoints)
const totalPoints = computed(() => store.totalPoints)
const enabledRules = computed(() => store.enabledRules)
const pointsRecords = computed(() => store.pointsRecords)

const currentDate = ref('')
const weekDay = ref('')

// 计算连续打卡天数
const streakDays = computed(() => {
  // 只统计当前孩子的记录
  const childRecords = pointsRecords.value.filter(r => r.childId === store.currentChildId)
  
  if (childRecords.length === 0) return 0
  
  // 获取所有有记录的日期（去重）
  const dates = [...new Set(childRecords.map(r => r.date))]
  
  // 按日期降序排序
  dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  if (dates.length === 0) return 0
  
  // 检查是否包含今天
  const today = new Date().toISOString().split('T')[0]
  let startIndex = 0
  
  if (dates[0] !== today) {
    // 如果最新记录不是今天，从昨天开始算
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dates[0] !== yesterday) {
      return 0 // 昨天和今天都没记录，中断了
    }
    startIndex = 0
  }
  
  // 计算连续天数
  let streak = 1
  for (let i = startIndex; i < dates.length - 1; i++) {
    const currentDate = new Date(dates[i])
    const previousDate = new Date(dates[i + 1])
    
    // 计算两个日期之间相差的天数
    const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / 86400000)
    
    if (diffDays === 1) {
      streak++
    } else {
      break // 中断了
    }
  }
  
  return streak
})

// 分类
const categories = [
  { name: '家务类', icon: '🧹', category: '家务' },
  { name: '习惯', icon: '😊', category: '生活习惯' },
  { name: '学习', icon: '📚', category: '学习习惯' },
  { name: '加分项', icon: '💎', category: '加分项' },
  { name: '惩罚', icon: '💀', category: '惩罚' }
]

const showQuickModal = ref(false)
const selectedCategory = ref<typeof categories[0] | null>(null)

const pendingRules = computed(() => {
  // 显示所有启用的奖励规则（排除惩罚类）
  return enabledRules.value.filter(r => r.type === 'reward' && r.category !== '惩罚')
})

const isRuleCompletedToday = (ruleId: string) => {
  return todayRecords.value.some(r => r.ruleId === ruleId)
}

// 过滤后的规则列表：保持原有顺序
const filteredRules = computed(() => {
  const category = selectedCategory.value
  if (!category) return []
  return enabledRules.value.filter(r => r.category === category.category)
})

const showQuickRecord = (category: typeof categories[0]) => {
  selectedCategory.value = category
  showQuickModal.value = true
}

const selectRule = (rule: Rule) => {
  // 检查是否今天已经完成过
  if (isRuleCompletedToday(rule.id)) {
    // 如果是已完成的规则，点击时不做任何操作（因为会显示取消按钮）
    return
  }
  
  const now = new Date()
  const record: Omit<PointsRecord, 'id'> = {
    ruleId: rule.id,
    ruleName: rule.name,
    ruleIcon: rule.icon,
    points: rule.points,
    date: now.toISOString().split('T')[0],
    completedAt: now.toISOString(),
    isMakeup: false,
    childId: store.currentChildId!
  }
  
  store.addPointsRecord(record)
  // 不关闭弹窗，用户可以继续选择其他规则
  
  // 震动反馈
  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
  
  // 显示成功提示
  showToast({ message: `完成「${rule.name}」+${rule.points}分`, type: 'success' })
}

// 取消规则的完成状态
const cancelRuleCompletion = (rule: Rule) => {
  // 找到今天该规则的记录
  const record = todayRecords.value.find(r => r.ruleId === rule.id)
  if (record) {
    store.deletePointsRecord(record.id)
    
    // 震动反馈
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
    
    // 显示提示
    showToast({ message: `已取消「${rule.name}」的完成状态`, type: 'info' })
  }
}

const completeRule = (rule: Rule) => {
  // 双重检查：确保今天没有完成过
  if (isRuleCompletedToday(rule.id)) {
    showToast({ message: '该任务今天已经完成过了！', type: 'warning' })
    return
  }
  selectRule(rule)
}

// 取消已完成的记录（不使用了，保留以防需要）
const cancelRecord = (record: PointsRecord) => {
  store.deletePointsRecord(record.id)
  
  // 震动反馈
  if (navigator.vibrate) {
    navigator.vibrate(30)
  }
}

// 监听弹窗状态，控制背景滚动
watch(showQuickModal, (newVal) => {
  if (newVal) {
    // 弹窗打开时，禁止背景滚动
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  } else {
    // 弹窗关闭时，恢复背景滚动
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})

onMounted(() => {
  // 滚动到页面顶部
  window.scrollTo(0, 0)
  
  const now = new Date()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  currentDate.value = `${now.getFullYear()}.${month}.${day}`
  
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  weekDay.value = weekDays[now.getDay()]
})
</script>

<style scoped lang="scss">
.index-page {
  padding: var(--spacing-lg);
  max-width: 480px;
  margin: 0 auto;
}

.header {
  margin-bottom: var(--spacing-xl);
  
  &__greeting {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }
  
  &__emoji {
    font-size: 48px;
  }
  
  &__title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
  }
  
  &__date {
    color: var(--text-secondary);
    font-size: 14px;
  }
  
  &__stats {
    display: flex;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }
  
  &__streak {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: linear-gradient(135deg, #F59E0B, #FBBF24);
    color: white;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-xl);
    font-size: 14px;
    font-weight: 500;
    width: fit-content;
    
    &-icon {
      font-size: 18px;
    }
  }
}

.stat-item {
  flex: 1;
  padding: var(--spacing-md);
  background: var(--bg-color);
  border-radius: var(--radius-md);
  
  &__label {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }
  
  &__value {
    font-size: 28px;
    font-weight: 700;
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.quick-actions {
  margin-bottom: var(--spacing-xl);
  
  &__grid {
    display: flex;
    gap: var(--spacing-md);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
    padding-bottom: var(--spacing-sm);
    
    &::-webkit-scrollbar {
      display: none; /* Chrome/Safari */
    }
  }
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  min-width: 80px;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &__icon {
    font-size: 32px;
    margin-bottom: var(--spacing-xs);
  }
  
  span {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
}

.section {
  margin-bottom: var(--spacing-xl);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
  
  &__emoji {
    font-size: 48px;
    display: block;
    margin-bottom: var(--spacing-md);
  }
}

.records-list, .rules-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: var(--shadow-lg);
  }
  
  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
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
  
  &__name {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
  }
  
  &__info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  &__category {
    font-size: 13px;
    color: var(--text-secondary);
  }
  
  &__points {
    font-size: 14px;
    color: var(--primary-color);
    font-weight: 600;
  }
  
  &__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
}

.completed-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
}

.btn--sm {
  padding: 8px 16px;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--spacing-lg);
}

.modal {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  
  @media (prefers-color-scheme: dark) {
    background: var(--dark-card-bg);
  }
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  text-align: center;
  color: var(--text-primary);
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.rule-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--primary-color);
    color: white;
    
    .rule-option__points {
      color: white;
    }
  }
  
  &.completed {
    opacity: 0.6;
    background: rgba(16, 185, 129, 0.05);
    cursor: default;
    
    &:hover {
      background: rgba(16, 185, 129, 0.1);
    }
  }
  
  &__icon {
    font-size: 32px;
  }
  
  &__info {
    flex: 1;
  }
  
  &__name {
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-primary);
  }
  
  &__points {
    font-size: 14px;
    color: var(--primary-color);
    font-weight: 600;
  }
}

.completed-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: var(--success-color);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.completed-flag {
  font-size: 12px;
  color: var(--success-color);
  font-weight: 500;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(16, 185, 129, 0.1);
  border-radius: var(--radius-sm);
}

.modal-close {
  width: 100%;
}
</style>
