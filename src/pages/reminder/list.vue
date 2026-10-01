<template>
  <div class="reminder-list-page">
    <!-- 头部导航 -->
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="$router.back()">
        ←
      </button>
      <h1 class="page-title">提醒通知</h1>
      <button class="btn btn--primary btn--sm" @click="addNewReminder">
        ✚ 新增
      </button>
    </div>

    <!-- 状态提示条 -->
    <div v-if="!notificationState.supported" class="status-banner status-banner--info">
      <span class="status-banner__icon">💻</span>
      <div class="status-banner__text">
        <div class="status-banner__title">当前环境不支持系统通知</div>
        <div class="status-banner__desc">系统级定时提醒需要在手机上安装 App 后才会生效</div>
      </div>
    </div>

    <div v-else-if="notificationState.permission === 'denied'" class="status-banner status-banner--danger">
      <span class="status-banner__icon">🔕</span>
      <div class="status-banner__text">
        <div class="status-banner__title">通知权限未开启</div>
        <div class="status-banner__desc">未授权时提醒不会显示，请在系统设置中允许本应用发送通知</div>
      </div>
      <button class="btn btn--outline btn--sm" @click="requestPermission">去开启</button>
    </div>

    <div v-else-if="!notificationState.exactAlarmGranted" class="status-banner status-banner--warning">
      <span class="status-banner__icon">⏰</span>
      <div class="status-banner__text">
        <div class="status-banner__title">「闹钟与提醒」权限未开启</div>
        <div class="status-banner__desc">未开启精确闹钟时，提醒时间可能延迟几分钟</div>
      </div>
      <button class="btn btn--outline btn--sm" @click="openExactAlarm">去开启</button>
    </div>

    <!-- 生效说明 -->
    <div v-if="notificationState.supported" class="sync-info">
      <span class="sync-info__dot" :class="{ 'sync-info__dot--on': activeCount > 0 }" />
      <span v-if="activeCount > 0">已开启 {{ activeCount }} 条提醒，每天按设定时间自动通知</span>
      <span v-else>暂无开启中的提醒</span>
    </div>

    <!-- 提醒列表 -->
    <div class="section">
      <div v-if="reminders.length === 0" class="empty-state">
        <span class="empty-state__emoji">🔔</span>
        <p>还没有提醒</p>
        <p class="empty-state__hint">点击右上角「新增」添加第一条定时提醒</p>
      </div>

      <div v-else class="reminder-list">
        <div
          v-for="reminder in reminders"
          :key="reminder.id"
          class="reminder-card glass-card"
          :class="{ 'reminder-card--off': !reminder.enabled }"
        >
          <div class="reminder-card__main">
            <div class="reminder-card__time">
              {{ formatTime(reminder) }}
            </div>
            <div class="reminder-card__info">
              <div class="reminder-card__title">{{ reminder.title }}</div>
              <div class="reminder-card__body">{{ reminder.body }}</div>
              <div class="reminder-card__meta">每天</div>
            </div>
          </div>
          <div class="reminder-card__actions">
            <button
              class="icon-btn"
              :class="{ active: reminder.enabled }"
              @click="toggleReminder(reminder)"
            >
              {{ reminder.enabled ? '✓' : '○' }}
            </button>
            <button class="icon-btn" @click="editReminder(reminder)">✎</button>
            <button class="icon-btn danger" @click="confirmDelete(reminder)">🗑</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="tips-card glass-card">
      <div class="tips-card__title">💡 使用提示</div>
      <ul class="tips-card__list">
        <li>App 关闭或从后台清理后，提醒仍会按时送达</li>
        <li>手机重启后提醒会自动恢复，无需重新设置</li>
        <li>若在系统里对 App 执行了「强行停止」，需重新打开一次 App 才会恢复提醒</li>
        <li>部分手机的省电策略会限制后台提醒，建议为 App 开启「自启动」并关闭电池优化</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import type { Reminder } from '@/types'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'
import { openExactAlarmSetting, requestNotificationPermission } from '@/utils/notifications'

const store = useAppStore()
const router = useRouter()

const reminders = computed(() => store.reminders)
const notificationState = computed(() => store.reminderState)
const activeCount = computed(() => reminders.value.filter(r => r.enabled).length)

onMounted(async () => {
  window.scrollTo(0, 0)
  // 进入页面时静默对账一次，刷新权限与排期状态
  await store.syncReminders(false)
})

const formatTime = (reminder: Reminder): string =>
  `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`

const addNewReminder = () => {
  router.push('/reminder/edit')
}

const editReminder = (reminder: Reminder) => {
  router.push(`/reminder/edit?id=${reminder.id}`)
}

const toggleReminder = async (reminder: Reminder) => {
  store.toggleReminder(reminder.id)
  const outcome = await store.syncReminders(true)
  if (reminder.enabled) {
    showToast({ message: `已开启 ${formatTime(reminder)} 的提醒`, type: 'success' })
  } else {
    showToast({ message: '已关闭该提醒', type: 'info' })
  }
  if (outcome.notice) {
    showToast({ message: outcome.notice, type: 'warning' })
  }
}

const confirmDelete = async (reminder: Reminder) => {
  const confirmed = await showConfirm({
    title: '确认删除',
    message: `确认删除「${reminder.title}」这条提醒？\n此操作不可恢复！`,
    type: 'danger'
  })
  if (!confirmed) return

  store.deleteReminder(reminder.id)
  await store.syncReminders(true)
  showToast({ message: '删除成功', type: 'success' })
}

const requestPermission = async () => {
  const permission = await requestNotificationPermission()
  if (permission === 'granted') {
    await store.syncReminders(false)
    showToast({ message: '通知权限已开启', type: 'success' })
  } else {
    showToast({ message: '请到「系统设置 → 应用 → 通知」中手动允许通知', type: 'warning', duration: 3500 })
  }
}

const openExactAlarm = async () => {
  await openExactAlarmSetting()
  showToast({ message: '请在「闹钟与提醒」中允许本应用使用精确闹钟', type: 'info', duration: 3500 })
  // 从设置页返回后重新对账（改动该权限会导致应用重启）
  setTimeout(() => store.syncReminders(false), 1500)
}
</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.reminder-list-page {
  max-width: 480px;
  margin: 0 auto;
  animation: fade-in 0.5s ease;

  > *:not(.header) {
    padding-left: var(--spacing-lg);
    padding-right: var(--spacing-lg);
  }
}

// ===== 状态提示条 =====
.status-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);

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
    margin-bottom: 2px;
  }

  &__desc {
    font-size: 12px;
    line-height: 1.5;
    opacity: 0.85;
  }

  &--info {
    background: rgba(99, 102, 241, 0.08);
    color: var(--primary-color);
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  &--warning {
    background: rgba(245, 158, 11, 0.1);
    color: #B45309;
    border: 1px solid rgba(245, 158, 11, 0.25);
  }

  &--danger {
    background: rgba(239, 68, 68, 0.08);
    color: var(--danger-color);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
}

// ===== 同步状态 =====
.sync-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border-color);
    flex-shrink: 0;

    &--on {
      background: var(--success-color);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }
  }
}

// ===== 列表 =====
.section {
  margin-bottom: var(--spacing-xl);
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.reminder-card {
  padding: var(--spacing-lg);
  transition: opacity 0.25s ease;

  &--off {
    opacity: 0.55;
  }

  &__main {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  &__time {
    font-size: 24px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--primary-color);
    line-height: 1.2;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 2px;
    word-break: break-word;
  }

  &__body {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
    word-break: break-word;
  }

  &__meta {
    display: inline-block;
    margin-top: 6px;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 8px;
    background: rgba(99, 102, 241, 0.08);
    color: var(--primary-color);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--border-color);
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

  &.active {
    border-color: var(--success-color);
    color: var(--success-color);
    background: rgba(16, 185, 129, 0.08);
  }

  &.danger {
    color: var(--danger-color);
    border-color: rgba(239, 68, 68, 0.25);
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

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
