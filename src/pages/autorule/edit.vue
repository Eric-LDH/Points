<template>
  <div class="auto-rule-edit-page">
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="$router.back()">
        ←
      </button>
      <h1 class="page-title">{{ isEdit ? '编辑' : '新增' }}自动奖励</h1>
      <button class="btn btn--primary btn--sm" @click="saveRule">
        ✓ 保存
      </button>
    </div>

    <div class="form">
      <!-- 规则名称 -->
      <div class="form-card glass-card">
        <div class="form-card__title">基本信息</div>
        <div class="form-group">
          <label class="form-label">规则名称 *</label>
          <input
            type="text"
            v-model="name"
            class="input"
            maxlength="20"
            placeholder="例如：每周全勤奖"
          />
          <div class="form-tip">{{ name.length }}/20</div>
        </div>

        <div class="form-group">
          <label class="form-label">触发方式 *</label>
          <div class="pill-group">
            <button
              class="pill"
              :class="{ active: type === 'streak' }"
              @click="type = 'streak'"
            >🔥 连续达标</button>
            <button
              class="pill"
              :class="{ active: type === 'schedule' }"
              @click="type = 'schedule'"
            >⏰ 定时发放</button>
          </div>
        </div>

        <div class="form-group form-group--last">
          <label class="form-label">统计周期 *</label>
          <div class="pill-group">
            <button
              v-for="option in cycleOptions"
              :key="option.value"
              class="pill"
              :class="{ active: cycleType === option.value }"
              @click="cycleType = option.value"
            >{{ option.label }}</button>
          </div>
          <div class="form-hint">周期内最多发放一次，跨周期重新计数</div>
        </div>
      </div>

      <!-- 触发条件 -->
      <div class="form-card glass-card">
        <div class="form-card__title">触发条件</div>

        <template v-if="type === 'streak'">
          <div class="stepper-group">
            <div class="stepper-row">
              <span class="stepper-row__label">连续天数</span>
              <div class="stepper">
                <button class="stepper__btn" @click="stepDays(-1)">−</button>
                <span class="stepper__value">{{ streakDays }}</span>
                <button class="stepper__btn" @click="stepDays(1)">+</button>
              </div>
            </div>
            <div class="stepper-row">
              <span class="stepper-row__label">每日净得分不小于</span>
              <div class="stepper">
                <button class="stepper__btn" @click="stepThreshold(-5)">−</button>
                <span class="stepper__value">{{ dailyThreshold }}</span>
                <button class="stepper__btn" @click="stepThreshold(5)">+</button>
              </div>
            </div>
          </div>
          <div class="form-hint">
            当天的净得分 = 当天所有奖励分 − 当天所有惩罚分；连续 {{ streakDays }} 天每天都达到 {{ dailyThreshold }} 分即发放
          </div>
        </template>

        <template v-else>
          <div v-if="cycleType === 'weekly'" class="form-group form-group--last">
            <label class="form-label">发放日 *</label>
            <div class="pill-group pill-group--wrap">
              <button
                v-for="weekday in weekdayOptions"
                :key="weekday.value"
                class="pill pill--sm"
                :class="{ active: triggerWeekday === weekday.value }"
                @click="triggerWeekday = weekday.value"
              >{{ weekday.label }}</button>
            </div>
          </div>

          <div v-else class="form-group form-group--last">
            <div v-if="cycleType === 'yearly'" class="form-group">
              <label class="form-label">月份 *</label>
              <select v-model.number="triggerMonth" class="input input--select">
                <option v-for="month in 12" :key="month" :value="month">{{ month }} 月</option>
              </select>
            </div>
            <label class="form-label">发放日期 *</label>
            <div class="stepper">
              <button class="stepper__btn" @click="stepDayOfMonth(-1)">−</button>
              <span class="stepper__value">{{ triggerDayOfMonth }}</span>
              <button class="stepper__btn" @click="stepDayOfMonth(1)">+</button>
            </div>
            <div class="form-hint">若当月没有该日期，将按当月最后一天发放</div>
          </div>
        </template>
      </div>

      <!-- 目标得分项 -->
      <div class="form-card glass-card">
        <div class="form-card__title">奖励内容</div>
        <div class="form-group form-group--last">
          <label class="form-label">自动选中的得分项 *</label>
          <div v-if="rewardRules.length === 0" class="empty-hint">
            还没有可用的奖励得分项，请先到「积分规则管理」里添加
          </div>
          <div v-else class="target-list">
            <div
              v-for="rule in rewardRules"
              :key="rule.id"
              class="target-item"
              :class="{ active: targetRuleId === rule.id }"
              @click="targetRuleId = rule.id"
            >
              <span class="target-item__icon">{{ rule.icon }}</span>
              <div class="target-item__info">
                <div class="target-item__name">{{ rule.name }}</div>
                <div class="target-item__meta">{{ rule.category }}</div>
              </div>
              <span class="target-item__points">{{ rule.points > 0 ? '+' : '' }}{{ rule.points }}分</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 启用 -->
      <div class="form-card glass-card">
        <label class="switch-label">
          <span>启用此规则</span>
          <div class="switch" :class="{ active: enabled }" @click="enabled = !enabled">
            <div class="switch__knob"></div>
          </div>
        </label>
      </div>

      <button class="btn btn--primary btn--large save-btn" @click="saveRule">
        ✓ 保存规则
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import type { AutoRewardCycle, AutoRewardType } from '@/types'
import { showToast } from '@/utils/toast'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const ruleId = computed(() => route.query.id as string | undefined)
const isEdit = computed(() => !!ruleId.value)
const editingRule = computed(() => {
  if (!ruleId.value) return null
  return store.autoRewardRules.find(r => r.id === ruleId.value) || null
})

const cycleOptions: { label: string; value: AutoRewardCycle }[] = [
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '每年', value: 'yearly' }
]

const weekdayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 }
]

const name = ref('')
const type = ref<AutoRewardType>('streak')
const cycleType = ref<AutoRewardCycle>('weekly')
const streakDays = ref(3)
const dailyThreshold = ref(40)
const triggerWeekday = ref(1)
const triggerDayOfMonth = ref(1)
const triggerMonth = ref(1)
const targetRuleId = ref('')
const enabled = ref(true)

const rewardRules = computed(() => store.rules.filter(r => r.type === 'reward'))

onMounted(() => {
  window.scrollTo(0, 0)

  if (isEdit.value && editingRule.value) {
    const rule = editingRule.value
    name.value = rule.name
    type.value = rule.type
    cycleType.value = rule.cycleType
    streakDays.value = rule.streakDays ?? 3
    dailyThreshold.value = rule.dailyThreshold ?? 40
    triggerWeekday.value = rule.triggerWeekday ?? 1
    triggerDayOfMonth.value = rule.triggerDayOfMonth ?? 1
    triggerMonth.value = rule.triggerMonth ?? 1
    targetRuleId.value = rule.targetRuleId
    enabled.value = rule.enabled
  } else if (isEdit.value && !editingRule.value) {
    showToast({ message: '未找到该规则，请确认是否已被删除', type: 'error' })
    router.back()
    return
  }

  // 新增时的默认目标：优先选择名为「每周奖励」的得分项
  if (!targetRuleId.value && rewardRules.value.length > 0) {
    const preferred = rewardRules.value.find(r => r.name.includes('每周') || r.name.includes('奖励'))
    targetRuleId.value = (preferred ?? rewardRules.value[0]).id
  }
})

const stepDays = (delta: number) => {
  streakDays.value = Math.min(31, Math.max(1, streakDays.value + delta))
}

const stepThreshold = (delta: number) => {
  dailyThreshold.value = Math.min(500, Math.max(1, dailyThreshold.value + delta))
}

const stepDayOfMonth = (delta: number) => {
  triggerDayOfMonth.value = Math.min(31, Math.max(1, triggerDayOfMonth.value + delta))
}

const saveRule = () => {
  if (!name.value.trim()) {
    showToast({ message: '请输入规则名称', type: 'warning' })
    return
  }
  if (rewardRules.value.length === 0) {
    showToast({ message: '请先到「积分规则管理」添加奖励得分项', type: 'warning' })
    return
  }
  if (!targetRuleId.value) {
    showToast({ message: '请选择要自动选中的得分项', type: 'warning' })
    return
  }
  if (type.value === 'streak' && (streakDays.value < 1 || dailyThreshold.value < 1)) {
    showToast({ message: '连续天数与每日阈值都必须大于 0', type: 'warning' })
    return
  }

  const payload = {
    name: name.value.trim(),
    type: type.value,
    cycleType: cycleType.value,
    targetRuleId: targetRuleId.value,
    streakDays: type.value === 'streak' ? streakDays.value : undefined,
    dailyThreshold: type.value === 'streak' ? dailyThreshold.value : undefined,
    triggerWeekday: type.value === 'schedule' && cycleType.value === 'weekly' ? triggerWeekday.value : undefined,
    triggerDayOfMonth: type.value === 'schedule' && cycleType.value !== 'weekly' ? triggerDayOfMonth.value : undefined,
    triggerMonth: type.value === 'schedule' && cycleType.value === 'yearly' ? triggerMonth.value : undefined,
    enabled: enabled.value
  }

  if (isEdit.value && editingRule.value) {
    store.updateAutoRewardRule(editingRule.value.id, payload)
  } else {
    const maxSortOrder = store.autoRewardRules.reduce((max, r) => Math.max(max, r.sortOrder), 0)
    store.addAutoRewardRule({ ...payload, sortOrder: maxSortOrder + 1 })
  }

  showToast({ message: '保存成功！', type: 'success' })
  setTimeout(() => router.back(), 600)
}
</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.auto-rule-edit-page {
  max-width: 480px;
  margin: 0 auto;
  animation: fade-in 0.5s ease;
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

.form {
  padding: 0 var(--spacing-lg);
  padding-top: calc(72px + env(safe-area-inset-top, 0px));
  padding-bottom: var(--spacing-xl);
}

.form-card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);

  &__title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: var(--spacing-lg);
    color: var(--text-primary);
  }
}

.form-group {
  margin-bottom: var(--spacing-lg);

  &--last {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: right;
}

.form-hint {
  margin-top: var(--spacing-sm);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
}

// 输入框沿用全局 .input 样式（已内建深色模式），这里只补充下拉框外观
.input--select {
  appearance: none;
  cursor: pointer;
}

// ===== 胶囊选择 =====
.pill-group {
  display: flex;
  gap: var(--spacing-sm);

  &--wrap {
    flex-wrap: wrap;
  }
}

.pill {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-color);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease, transform 0.2s ease;
  white-space: nowrap;

  &--sm {
    flex: 0 0 auto;
    min-width: 64px;
    text-align: center;
  }

  &:active {
    transform: scale(0.97);
  }

  &.active {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    border-color: transparent;
    color: #fff;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  }
}

// ===== 步进器 =====
.stepper-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.stepper-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &__label {
    font-size: 14px;
    color: var(--text-primary);
  }
}

.stepper {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);

  &__btn {
    width: 34px;
    height: 34px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: var(--bg-color);
    color: var(--primary-color);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;

    &:active {
      transform: scale(0.92);
    }
  }

  &__value {
    min-width: 52px;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--primary-color);
  }
}

// ===== 目标得分项 =====
.target-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 320px;
  overflow-y: auto;
}

.target-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-color);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  &.active {
    border-color: var(--primary-color);
    background: rgba(99, 102, 241, 0.08);
  }

  &__icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 2px;
  }

  &__meta {
    font-size: 12px;
    color: var(--text-muted);
  }

  &__points {
    font-size: 14px;
    font-weight: 600;
    color: var(--success-color);
    flex-shrink: 0;
  }
}

.empty-hint {
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  background: rgba(245, 158, 11, 0.08);
  border: 1px dashed rgba(245, 158, 11, 0.35);
  font-size: 13px;
  line-height: 1.6;
  color: #B45309;
}

// ===== 开关 =====
.switch-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  cursor: pointer;
  color: var(--text-primary);
}

.switch {
  width: 46px;
  height: 26px;
  background: var(--border-color);
  border-radius: 13px;
  position: relative;
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

.save-btn {
  width: 100%;
  margin-top: var(--spacing-md);
}

.glass-card {
  @include glass-card;
}

// ===== 深色模式 =====
.dark {
  .header .page-title {
    color: var(--dark-text-primary);
  }

  .form-card__title,
  .form-label,
  .switch-label,
  .stepper-row__label {
    color: var(--dark-text-primary);
  }

  .form-tip,
  .form-hint {
    color: var(--dark-text-muted);
  }

  .pill {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.08);
    color: var(--dark-text-secondary);

    &.active {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      border-color: transparent;
      color: #fff;
    }
  }

  .stepper__btn {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.08);
    color: var(--primary-light);
  }

  .target-item {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.08);

    &__name { color: var(--dark-text-primary); }
    &__meta { color: var(--dark-text-muted); }

    &.active {
      border-color: var(--primary-light);
      background: rgba(99, 102, 241, 0.16);
    }
  }

  .switch {
    background: var(--dark-border);
  }

  .empty-hint {
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.35);
    color: #FCD34D;
  }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
