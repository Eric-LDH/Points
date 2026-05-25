<template>
  <div class="index-page">
    <!-- 渐变问候头部 -->
    <div class="hero-header">
      <div class="hero-header__bg">
        <div class="hero-header__glow glow-1" />
        <div class="hero-header__glow glow-2" />
      </div>
      <div class="hero-header__content">
        <div class="hero-header__greeting">
          <div class="hero-header__avatar">{{ currentChild?.avatar || '👦' }}</div>
          <div>
            <h1 class="hero-header__title">你好，{{ currentChild?.name || '宝贝' }}</h1>
            <p class="hero-header__date">{{ currentDate }} {{ weekDay }}</p>
          </div>
        </div>
        <div class="hero-header__stats">
          <div class="hero-stat">
            <div class="hero-stat__label">今日积分</div>
            <div class="hero-stat__value hero-stat__value--primary">
              {{ todayPoints > 0 ? '+' : '' }}{{ todayPoints }}
            </div>
          </div>
          <div class="hero-stat-divider" />
          <div class="hero-stat">
            <div class="hero-stat__label">累计积分</div>
            <div class="hero-stat__value hero-stat__value--success">{{ totalPoints }}</div>
          </div>
        </div>
        <div class="hero-header__streak">
          <span class="streak-icon">🔥</span>
          <span>连续打卡 <strong>{{ streakDays }}</strong> 天</span>
        </div>
      </div>
    </div>

    <!-- 快捷记录 -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-title__dot" />
        快捷记录
      </h2>
      <div class="quick-actions">
        <div 
          v-for="cat in categories" 
          :key="cat.name"
          class="quick-action-btn"
          :class="`quick-action-btn--${cat.category}`"
          @click="showQuickRecord(cat)"
        >
          <div class="quick-action-btn__icon-wrap">
            <span class="quick-action-btn__emoji">{{ cat.icon }}</span>
          </div>
          <span class="quick-action-btn__label">{{ cat.name }}</span>
        </div>
      </div>
    </div>

    <!-- 待完成奖励 -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-title__dot" />
        待完成奖励
        <span class="section-title__badge">{{ pendingRules.length }}</span>
      </h2>
      <div v-if="pendingRules.length === 0" class="empty-state glass-card">
        <div class="empty-state__icon">🎉</div>
        <p class="empty-state__text">所有任务都已完成！</p>
      </div>
      <div v-else class="tasks-list">
        <div 
          v-for="rule in pendingRules" 
          :key="rule.id"
          class="task-card glass-card"
        >
          <div class="task-card__left">
            <div class="task-card__icon">{{ rule.icon }}</div>
            <div>
              <div class="task-card__name">{{ rule.name }}</div>
              <div class="task-card__meta">
                <span class="task-card__category">{{ rule.category }}</span>
                <span class="task-card__points">+{{ rule.points }}分</span>
              </div>
            </div>
          </div>
          <button
            v-if="!isRuleCompletedToday(rule.id)"
            class="btn-complete"
            @click="completeRule(rule)"
          >
            <IconFont name="check" :size="18" color="#fff" />
          </button>
          <div v-else class="task-card__done">
            <span class="done-badge">已完成</span>
            <button class="btn-undo" @click="cancelRuleCompletion(rule)">
              <IconFont name="close" :size="14" color="var(--text-muted)" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷记录弹窗 -->
    <div v-if="showQuickModal" class="modal-overlay" @click="showQuickModal = false">
      <div class="modal glass-modal" @click.stop>
        <div class="modal__header">
          <h3 class="modal__title">{{ selectedCategory?.name }}</h3>
          <button class="modal__close" @click="showQuickModal = false">
            <IconFont name="close" :size="20" />
          </button>
        </div>
        <div class="modal__body">
          <div 
            v-for="rule in filteredRules" 
            :key="rule.id"
            class="rule-option"
            :class="{ 'rule-option--done': isRuleCompletedToday(rule.id) }"
            @click="selectRule(rule)"
          >
            <div class="rule-option__left">
              <span class="rule-option__icon">{{ rule.icon }}</span>
              <div>
                <div class="rule-option__name">{{ rule.name }}</div>
                <div class="rule-option__points">{{ rule.points > 0 ? '+' : '' }}{{ rule.points }}分</div>
              </div>
            </div>
            <div v-if="isRuleCompletedToday(rule.id)" class="rule-option__done">
              <span class="done-badge">已完成</span>
              <button class="btn-undo" @click.stop="cancelRuleCompletion(rule)">
                <IconFont name="close" :size="14" color="var(--text-muted)" />
              </button>
            </div>
          </div>
        </div>
        <div class="modal__footer">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores'
import type { Rule, PointsRecord } from '@/types'
import { showToast } from '@/utils/toast'
import IconFont from '@/components/IconFont.vue'

const store = useAppStore()

const currentChild = computed(() => store.currentChild)
const todayRecords = computed(() => store.todayRecords)
const todayPoints = computed(() => store.todayPoints)
const totalPoints = computed(() => store.totalPoints)
const enabledRules = computed(() => store.enabledRules)
const pointsRecords = computed(() => store.pointsRecords)

const currentDate = ref('')
const weekDay = ref('')

const streakDays = computed(() => {
  const childRecords = pointsRecords.value.filter(r => r.childId === store.currentChildId)
  if (childRecords.length === 0) return 0
  const dates = [...new Set(childRecords.map(r => r.date))]
  dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  if (dates.length === 0) return 0
  // 使用本地时间格式化，避免时区问题
  const today = formatDateOnly(new Date())
  let startIndex = 0
  if (dates[0] !== today) {
    const yesterday = new Date(Date.now() - 86400000)
    const yesterdayStr = formatDateOnly(yesterday)
    if (dates[0] !== yesterdayStr) return 0
    startIndex = 0
  }
  let streak = 1
  for (let i = startIndex; i < dates.length - 1; i++) {
    const diffDays = Math.floor((new Date(dates[i]).getTime() - new Date(dates[i + 1]).getTime()) / 86400000)
    if (diffDays === 1) streak++
    else break
  }
  return streak
})

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
  return enabledRules.value.filter(r => r.type === 'reward' && r.category !== '惩罚')
})

const isRuleCompletedToday = (ruleId: string) => {
  return todayRecords.value.some(r => r.ruleId === ruleId)
}

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
  if (isRuleCompletedToday(rule.id)) {
    cancelRuleCompletion(rule)
    return
  }
  const now = new Date()
  const record: Omit<PointsRecord, 'id'> = {
    ruleId: rule.id,
    ruleName: rule.name,
    ruleIcon: rule.icon,
    points: rule.points,
    date: formatDateOnly(now),
    completedAt: now.toISOString(),
    isMakeup: false,
    childId: store.currentChildId!
  }
  store.addPointsRecord(record)
  if (navigator.vibrate) navigator.vibrate(50)
  showToast({ message: `完成「${rule.name}」+${rule.points}分`, type: 'success' })
}

const cancelRuleCompletion = (rule: Rule) => {
  const record = todayRecords.value.find(r => r.ruleId === rule.id)
  if (record) {
    store.deletePointsRecord(record.id)
    if (navigator.vibrate) navigator.vibrate(30)
    showToast({ message: `已取消「${rule.name}」的完成状态`, type: 'info' })
  }
}

const completeRule = (rule: Rule) => {
  if (isRuleCompletedToday(rule.id)) {
    showToast({ message: '该任务今天已经完成过了！', type: 'warning' })
    return
  }
  selectRule(rule)
}

watch(showQuickModal, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})

// 将 Date 对象格式化为 YYYY-MM-DD 格式的本地日期字符串（避免时区问题）
const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(() => {
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
@use '@/assets/main.scss' as *;

.index-page {
  padding: var(--spacing-lg);
  padding-top: calc(var(--spacing-lg) + env(safe-area-inset-top, 0px));
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  animation: fade-in 0.5s ease;
}

// ===== 渐变问候头部 =====
.hero-header {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);

  &__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%);
  }

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.4;

    &.glow-1 {
      width: 200px;
      height: 200px;
      background: #818CF8;
      top: -80px;
      right: -60px;
    }

    &.glow-2 {
      width: 150px;
      height: 150px;
      background: #C4B5FD;
      bottom: -40px;
      left: -40px;
    }
  }

  &__content {
    position: relative;
    padding: var(--spacing-xl) var(--spacing-lg);
    backdrop-filter: blur(4px);
    z-index: 1;
  }

  &__greeting {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  &__avatar {
    font-size: 52px;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 2px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  &__date {
    font-size: 13px;
    color: rgba(255,255,255,0.8);
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: var(--spacing-lg);
  }

  &__streak {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: var(--radius-xl);
    font-size: 13px;
    color: #fff;
    width: fit-content;

    strong {
      font-size: 15px;
    }
  }
}

.hero-stat {
  flex: 1;
  padding: var(--spacing-sm);

  &__label {
    font-size: 12px;
    color: rgba(255,255,255,0.7);
    margin-bottom: 2px;
  }

  &__value {
    font-size: 28px;
    font-weight: 700;
    color: #fff;

    &--primary { color: #fff; }
    &--success { color: #6EE7B7; }
  }
}

.hero-stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255,255,255,0.2);
  flex-shrink: 0;
}

.streak-icon {
  font-size: 18px;
}

// ===== 通用区块 =====
.section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  .dark &, html.dark & {
    color: var(--dark-text-primary);
  }

  @media (prefers-color-scheme: dark) {
    color: var(--dark-text-primary);
  }

  &__dot {
    width: 4px;
    height: 18px;
    background: linear-gradient(180deg, var(--primary-color), var(--primary-light));
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__badge {
    margin-left: auto;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 12px;
  }
}

// ===== 快捷分类按钮 =====
.quick-actions {
  display: flex;
  gap: var(--spacing-md);
  overflow-x: auto;
  background: none;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar { display: none; }
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-md) var(--spacing-lg);
  min-width: 76px;
  @include glass(0.5, 12px);
  border: none;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
  flex-shrink: 0;
  border-radius: var(--radius-xl);

  &:active {
    transform: scale(0.93);
  }

  &__icon-wrap {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.08);
    border-radius: 50%;
    transition: background 0.3s ease;
  }

  &__emoji {
    font-size: 22px;
  }

  &__label {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
    white-space: nowrap;
  }
}

// ===== 任务卡片列表 =====
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.task-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  content-visibility: auto;
  contain: paint layout style;
  contain-intrinsic-size: 72px;

  &:active {
    transform: scale(0.98);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
  }

  &__icon {
    font-size: 32px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__name {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 2px;
    color: var(--text-primary);

    .dark &, html.dark & {
      color: var(--dark-text-primary);
    }

    @media (prefers-color-scheme: dark) {
      color: var(--dark-text-primary);
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__category {
    font-size: 12px;
    color: var(--text-muted);
    padding: 2px 8px;
    background: rgba(99, 102, 241, 0.06);
    border-radius: 8px;
  }

  &__points {
    font-size: 13px;
    color: var(--primary-color);
    font-weight: 600;
  }

  &__done {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.btn-complete {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--success-color), #059669);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  flex-shrink: 0;

  &:active {
    transform: scale(0.9);
  }
}

.done-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  border-radius: var(--radius-lg);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.btn-undo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease;
  flex-shrink: 0;

}

// ===== 玻璃弹窗 =====
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2000;
  padding: var(--spacing-lg);
  animation: fade-in 0.2s ease;

  .dark &, html.dark & {
    background: rgba(0, 0, 0, 0.6);
  }
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slide-up-modal 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: 1px solid rgba(99, 102, 241, 0.08);
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
  }

  &__close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: rgba(99, 102, 241, 0.08);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: background 0.2s, transform 0.2s;

  }

  &__body {
    padding: var(--spacing-md) var(--spacing-lg);
    max-height: calc(85vh - 110px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    flex: 1;
  }

  &__footer {
    padding: var(--spacing-sm) var(--spacing-lg) calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid rgba(99, 102, 241, 0.08);
    display: flex;
    justify-content: center;
  }
}

.glass-modal {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);

  .dark &, html.dark &, .app-container.dark & {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.05);
  }
}

// ===== 弹窗规则选项 =====
.rule-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  @include glass(0.3, 8px, 0.06);

  &--done {
    opacity: 0.55;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
  }

  &__icon {
    font-size: 28px;
  }

  &__name {
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 2px;
    color: var(--text-primary);
  }

  &__points {
    font-size: 13px;
    color: var(--primary-color);
    font-weight: 600;
  }

  &__check {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__done {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

// ===== 空状态 =====
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);

  &__icon {
    font-size: 48px;
    margin-bottom: var(--spacing-md);
  }

  &__text {
    font-size: 15px;
    color: var(--text-secondary);
  }
}

// ===== 玻璃卡片工具类 =====
.glass-card {
  @include glass-card;
}

// ===== 关键帧 =====
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up-modal {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.8));
  }
}
</style>
