<template>
  <div class="auto-rule-list-page">
    <!-- 头部导航 -->
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="$router.back()">
        ←
      </button>
      <h1 class="page-title">自动奖励</h1>
      <button class="btn btn--primary btn--sm" @click="addNewRule">
        ✚ 新增
      </button>
    </div>

    <!-- 说明条 -->
    <div class="intro-banner">
      <span class="intro-banner__icon">✨</span>
      <div class="intro-banner__text">
        <div class="intro-banner__title">共 {{ rules.length }} 条规则 · {{ enabledCount }} 条已开启</div>
        <div class="intro-banner__desc">
          满足条件后系统自动为当前孩子记上一笔积分，撤销记录会同步撤销奖励
        </div>
      </div>
    </div>

    <!-- 规则列表 -->
    <div class="section">
      <div v-if="rules.length === 0" class="empty-state">
        <span class="empty-state__emoji">✨</span>
        <p>还没有自动奖励规则</p>
        <p class="empty-state__hint">点击右上角「新增」创建第一条规则</p>
      </div>

      <div v-else class="rule-list">
        <div
          v-for="rule in rules"
          :key="rule.id"
          class="rule-card glass-card"
          :class="{ 'rule-card--off': !rule.enabled }"
        >
          <div class="rule-card__main">
            <div class="rule-card__badge" :class="`rule-card__badge--${rule.type}`">
              {{ rule.type === 'streak' ? '🔥' : '⏰' }}
            </div>
            <div class="rule-card__info">
              <div class="rule-card__name">{{ rule.name }}</div>
              <div class="rule-card__tags">
                <span class="tag tag--type">{{ rule.type === 'streak' ? '连续达标' : '定时发放' }}</span>
                <span class="tag tag--cycle">{{ getCycleLabel(rule.cycleType) }}</span>
              </div>
              <div class="rule-card__desc">{{ describeRule(rule) }}</div>
              <div class="rule-card__target" :class="{ 'rule-card__target--missing': !targetOf(rule) }">
                <template v-if="targetOf(rule)">
                  目标：{{ targetOf(rule)!.icon }} {{ targetOf(rule)!.name }}
                  {{ targetOf(rule)!.points > 0 ? '+' : '' }}{{ targetOf(rule)!.points }}分
                </template>
                <template v-else>⚠️ 目标得分项已被删除，规则不会生效</template>
              </div>
            </div>
            <div class="rule-card__status">
              <span class="status-badge" :class="`status-badge--${statusOf(rule).tone}`">
                {{ statusOf(rule).text }}
              </span>
              <span class="rule-card__child">{{ currentChildName }}</span>
            </div>
          </div>

          <div class="rule-card__actions">
            <label class="switch-toggle" :class="{ active: rule.enabled }" @click.prevent="toggleRule(rule)">
              <div class="switch-toggle__knob" />
            </label>
            <div class="rule-card__buttons">
              <button class="icon-btn" @click="editRule(rule)">✎</button>
              <button class="icon-btn danger" @click="confirmDelete(rule)">🗑</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="tips-card glass-card">
      <div class="tips-card__title">💡 使用提示</div>
      <ul class="tips-card__list">
        <li>「连续达标」：周期内每天净得分（奖励分减去惩罚分）都不低于阈值，且连续够天数即发放</li>
        <li>「定时发放」：周期内到达设定日期自动发放，错过打开 App 也会自动补发</li>
        <li>每条规则在同一个周期内最多发放一次，跨周期重新计数</li>
        <li>条件不再满足（例如取消了某天的记录）时，已发放的奖励会同步撤销</li>
        <li>规则对所有孩子通用，每个孩子按各自的积分记录独立结算</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import type { AutoRewardRule } from '@/types'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'
import { buildDailyScores, formatDateOnly, getCycleLabel, getWeekdayLabel, getScheduleTriggerDay } from '@/utils/autoReward'

const router = useRouter()
const store = useAppStore()

const rules = computed(() => store.sortedAutoRewardRules)
const enabledCount = computed(() => rules.value.filter(r => r.enabled).length)
const currentChildName = computed(() => store.currentChild?.name || '未选择孩子')

// 当前孩子的单日净得分表（一次聚合，供所有规则复用）
const dailyScores = computed(() =>
  buildDailyScores(store.pointsRecords.filter(r => r.childId === store.currentChildId))
)

onMounted(() => {
  window.scrollTo(0, 0)
})

const targetOf = (rule: AutoRewardRule) => store.rules.find(r => r.id === rule.targetRuleId)

const cycleScopeLabel = (cycleType: AutoRewardRule['cycleType']): string => {
  if (cycleType === 'weekly') return '本周'
  if (cycleType === 'monthly') return '本月'
  return '今年'
}

const describeRule = (rule: AutoRewardRule): string => {
  if (rule.type === 'streak') {
    return `${cycleScopeLabel(rule.cycleType)}每天净得分 ≥ ${rule.dailyThreshold ?? 0} 分，且连续 ${rule.streakDays ?? 0} 天`
  }
  if (rule.cycleType === 'weekly') {
    return `${cycleScopeLabel(rule.cycleType)}${getWeekdayLabel(rule.triggerWeekday ?? 1)}自动发放`
  }
  if (rule.cycleType === 'monthly') {
    return `${cycleScopeLabel(rule.cycleType)}${rule.triggerDayOfMonth ?? 1} 号自动发放`
  }
  return `每年 ${rule.triggerMonth ?? 1} 月 ${rule.triggerDayOfMonth ?? 1} 号自动发放`
}

interface RuleStatus {
  text: string
  tone: 'on' | 'wait' | 'skip'
}

const computeStatus = (rule: AutoRewardRule): RuleStatus => {
  const status = store.getAutoRewardStatus(rule, dailyScores.value)
  if (status.suppressed) return { text: '本期已跳过', tone: 'skip' }
  if (status.granted) return { text: '本期已发放', tone: 'on' }

  if (rule.type === 'streak') {
    return { text: `连续 ${status.progress}/${rule.streakDays ?? 0} 天`, tone: 'wait' }
  }

  const today = formatDateOnly(new Date())
  const trigger = status.triggerDate ?? getScheduleTriggerDay(rule, today)
  if (trigger && trigger > today) return { text: `待 ${trigger.slice(5)} 发放`, tone: 'wait' }
  return { text: '待结算', tone: 'wait' }
}

const statusMap = computed(() => {
  const map = new Map<string, RuleStatus>()
  for (const rule of rules.value) {
    map.set(rule.id, computeStatus(rule))
  }
  return map
})

const statusOf = (rule: AutoRewardRule): RuleStatus =>
  statusMap.value.get(rule.id) ?? { text: '—', tone: 'wait' }

const addNewRule = () => router.push('/auto-reward/edit')

const editRule = (rule: AutoRewardRule) => router.push(`/auto-reward/edit?id=${rule.id}`)

const toggleRule = (rule: AutoRewardRule) => {
  store.toggleAutoRewardRule(rule.id)
  showToast({ message: rule.enabled ? `已开启「${rule.name}」` : `已关闭「${rule.name}」`, type: 'info' })
}

const confirmDelete = async (rule: AutoRewardRule) => {
  const confirmed = await showConfirm({
    title: '确认删除',
    message: `确认删除自动奖励规则「${rule.name}」？\n\n已发放的积分会保留，但不会再自动结算。`,
    type: 'danger'
  })
  if (!confirmed) return

  store.deleteAutoRewardRule(rule.id)
  showToast({ message: '删除成功', type: 'success' })
}
</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.auto-rule-list-page {
  max-width: 480px;
  margin: 0 auto;
  animation: fade-in 0.5s ease;

  > *:not(.header) {
    padding-left: var(--spacing-lg);
    padding-right: var(--spacing-lg);
  }
}

.header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: calc(var(--spacing-md) + env(safe-area-inset-top, 0px)) var(--spacing-lg) var(--spacing-md);
  @include glass(0.85, 10px, 0.08);
  z-index: 1000;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: var(--spacing-lg);
    right: var(--spacing-lg);
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--primary-light), transparent);
    opacity: 0.3;
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
  }
}

// ===== 说明条 =====
.intro-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-top: calc(72px + env(safe-area-inset-top, 0px));
  margin-bottom: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.12));
  border: 1px solid rgba(99, 102, 241, 0.18);

  &__icon {
    font-size: 22px;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
  }

  &__desc {
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-secondary);
  }
}

.section {
  margin-bottom: var(--spacing-xl);
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.rule-card {
  padding: var(--spacing-lg);
  transition: opacity 0.25s ease, transform 0.2s ease;

  &:active {
    transform: scale(0.99);
  }

  &--off {
    opacity: 0.55;
  }

  &__main {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  &__badge {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;

    &--streak {
      background: rgba(99, 102, 241, 0.1);
    }

    &--schedule {
      background: rgba(139, 92, 246, 0.12);
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
    word-break: break-word;
  }

  &__tags {
    display: flex;
    gap: 6px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  &__desc {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-secondary);
    margin-bottom: 6px;
    word-break: break-word;
  }

  &__target {
    font-size: 12px;
    color: var(--primary-color);
    word-break: break-word;

    &--missing {
      color: var(--danger-color);
    }
  }

  &__status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
  }

  &__child {
    font-size: 11px;
    color: var(--text-muted);
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--border-color);
  }

  &__buttons {
    display: flex;
    gap: var(--spacing-sm);
  }
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;

  &--type {
    background: rgba(99, 102, 241, 0.08);
    color: var(--primary-color);
  }

  &--cycle {
    background: rgba(139, 92, 246, 0.1);
    color: #7C3AED;
  }
}

.status-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;

  &--on {
    background: rgba(16, 185, 129, 0.12);
    color: var(--success-color);
  }

  &--wait {
    background: rgba(148, 163, 184, 0.16);
    color: var(--text-secondary);
  }

  &--skip {
    background: rgba(245, 158, 11, 0.14);
    color: #B45309;
  }
}

.icon-btn {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

  &:active {
    transform: scale(0.92);
  }

  &.danger {
    color: var(--danger-color);
    border-color: rgba(239, 68, 68, 0.25);
  }
}

.switch-toggle {
  width: 46px;
  height: 26px;
  background: var(--border-color);
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;
  flex-shrink: 0;

  &.active {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  }

  &__knob {
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  &.active &__knob {
    left: 22px;
  }
}

// ===== 空状态 =====
.empty-state {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);

  &__emoji {
    font-size: 48px;
    display: block;
    margin-bottom: var(--spacing-md);
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }

  &__hint {
    font-size: 12px !important;
    color: var(--text-muted) !important;
  }
}

// ===== 底部提示 =====
.tips-card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);

  &__title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
  }

  &__list {
    margin: 0;
    padding-left: 18px;

    li {
      font-size: 12px;
      line-height: 1.8;
      color: var(--text-secondary);
    }
  }
}

.glass-card {
  @include glass-card;
}

// ===== 深色模式 =====
.dark {
  .header .page-title {
    color: var(--dark-text-primary);
  }

  .intro-banner {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
    border-color: rgba(129, 140, 248, 0.25);

    &__title { color: var(--dark-text-primary); }
    &__desc { color: var(--dark-text-secondary); }
  }

  .rule-card {
    &__name { color: var(--dark-text-primary); }
    &__desc { color: var(--dark-text-secondary); }
    &__child { color: var(--dark-text-muted); }

    &__actions {
      border-top-color: var(--dark-border);
    }
  }

  .tag--cycle {
    color: var(--primary-light);
  }

  .status-badge--wait {
    background: rgba(100, 116, 139, 0.25);
    color: var(--dark-text-secondary);
  }

  .icon-btn {
    border-color: var(--dark-border);
    color: var(--dark-text-secondary);
  }

  .switch-toggle {
    background: var(--dark-border);
  }

  .empty-state {
    p { color: var(--dark-text-secondary); }

    &__hint { color: var(--dark-text-muted) !important; }
  }

  .tips-card__list li {
    color: var(--dark-text-secondary);
  }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
