<template>
  <div class="reminder-edit-page">
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="$router.back()">
        ←
      </button>
      <h1 class="page-title">{{ isEdit ? '编辑' : '新增' }}提醒</h1>
      <button class="btn btn--primary btn--sm" @click="saveReminder">
        ✓ 保存
      </button>
    </div>

    <div class="form">
      <!-- 时间 -->
      <div class="form-group">
        <label class="form-label">提醒时间 *</label>
        <div class="time-field">
          <input type="time" v-model="timeValue" class="input input--time" />
          <span class="time-field__suffix">每天</span>
        </div>
        <div class="quick-times">
          <span
            v-for="preset in timePresets"
            :key="preset"
            class="quick-time"
            :class="{ active: timeValue === preset }"
            @click="timeValue = preset"
          >
            {{ preset }}
          </span>
        </div>
      </div>

      <!-- 标题 -->
      <div class="form-group">
        <label class="form-label">通知标题 *</label>
        <input
          type="text"
          v-model="title"
          class="input"
          maxlength="30"
          placeholder="例如：积分提醒"
        />
        <div class="form-tip">{{ title.length }}/30</div>
      </div>

      <!-- 内容 -->
      <div class="form-group">
        <label class="form-label">通知内容 *</label>
        <textarea
          v-model="body"
          class="input"
          rows="3"
          maxlength="120"
          placeholder="例如：记得给小宝记录今天的表现哦～"
        ></textarea>
        <div class="form-tip">{{ body.length }}/120</div>
      </div>

      <!-- 通知预览 -->
      <div class="form-group">
        <label class="form-label">通知预览</label>
        <div class="preview-card">
          <div class="preview-card__head">
            <span class="preview-card__icon">🔔</span>
            <span class="preview-card__name">{{ title || '积分提醒' }}</span>
            <span class="preview-card__time">现在</span>
          </div>
          <div class="preview-card__body">{{ body || '记得记录今天的表现哦～' }}</div>
        </div>
      </div>

      <!-- 启用开关 -->
      <div class="form-group">
        <label class="switch-label">
          <span>启用此提醒</span>
          <div class="switch" :class="{ active: enabled }" @click="enabled = !enabled">
            <div class="switch__knob"></div>
          </div>
        </label>
      </div>

      <!-- 测试 -->
      <button class="btn btn--outline test-btn" @click="sendTest">
        🔔 发送测试通知
      </button>
      <div class="test-hint">
        点击后约 3 秒会收到一条通知，用于确认权限与展示效果。若未收到，请检查系统通知权限。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { showToast } from '@/utils/toast'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const reminderId = computed(() => route.query.id as string | undefined)
const isEdit = computed(() => !!reminderId.value)

const editingReminder = computed(() => {
  if (!reminderId.value) return null
  return store.reminders.find(r => r.id === reminderId.value) || null
})

const timeValue = ref('20:00')
const title = ref('积分提醒')
const body = ref('记得给小宝记录今天的表现哦～')
const enabled = ref(true)

// 常用时间快捷选项
const timePresets = ['07:00', '12:00', '19:00', '20:00', '21:00']

onMounted(() => {
  window.scrollTo(0, 0)

  if (isEdit.value && editingReminder.value) {
    const reminder = editingReminder.value
    timeValue.value = `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`
    title.value = reminder.title
    body.value = reminder.body
    enabled.value = reminder.enabled
  } else if (isEdit.value && !editingReminder.value) {
    showToast({ message: '未找到该提醒，请确认是否已被删除', type: 'error' })
    router.back()
  }
})

const parseTime = (value: string): { hour: number; minute: number } | null => {
  const matched = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!matched) return null
  const hour = Number(matched[1])
  const minute = Number(matched[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

const saveReminder = async () => {
  const parsed = parseTime(timeValue.value)
  if (!parsed) {
    showToast({ message: '请选择有效的提醒时间', type: 'warning' })
    return
  }
  if (!title.value.trim()) {
    showToast({ message: '请输入通知标题', type: 'warning' })
    return
  }
  if (!body.value.trim()) {
    showToast({ message: '请输入通知内容', type: 'warning' })
    return
  }

  const payload = {
    title: title.value.trim(),
    body: body.value.trim(),
    hour: parsed.hour,
    minute: parsed.minute,
    enabled: enabled.value
  }

  try {
    if (isEdit.value && editingReminder.value) {
      store.updateReminder(editingReminder.value.id, payload)
    } else {
      store.addReminder(payload)
    }

    const outcome = await store.syncReminders(true)

    if (outcome.notice && outcome.scheduled === 0) {
      // 排期没成功，数据已保存，提示用户处理权限问题
      showToast({ message: outcome.notice, type: 'warning', duration: 3500 })
    } else {
      showToast({ message: '保存成功！', type: 'success' })
      if (outcome.notice) {
        showToast({ message: outcome.notice, type: 'warning', duration: 3500 })
      }
    }

    setTimeout(() => {
      router.back()
    }, 600)
  } catch (error) {
    console.error('保存提醒失败:', error)
    showToast({ message: `保存失败：${(error as Error)?.message ?? '未知错误'}`, type: 'error' })
  }
}

const sendTest = async () => {
  const result = await store.sendTestReminder(
    title.value.trim() || '积分提醒',
    body.value.trim() || '这是一条测试通知'
  )
  if (result.success) {
    showToast({ message: '测试通知已发送，请稍候查看通知栏', type: 'success', duration: 3000 })
  } else {
    showToast({ message: result.notice ?? '发送失败', type: 'error', duration: 3500 })
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.reminder-edit-page {
  max-width: 480px;
  margin: 0 auto;
  animation: fade-in 0.5s ease;
}

.form {
  padding: 0 var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-xl);
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: right;
}

// ===== 时间选择 =====
.time-field {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  &__suffix {
    font-size: 14px;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
}

.input--time {
  flex: 1;
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: center;
  color: var(--primary-color);
}

.quick-times {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  overflow-x: auto;
  padding-bottom: var(--spacing-xs);
}

.quick-time {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  &.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }
}

// ===== 预览卡片 =====
.preview-card {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: rgba(99, 102, 241, 0.06);
  border: 1px dashed rgba(99, 102, 241, 0.3);

  &__head {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: 6px;
  }

  &__icon {
    font-size: 14px;
  }

  &__name {
    font-size: 13px;
    font-weight: 600;
    flex: 1;
  }

  &__time {
    font-size: 11px;
    color: var(--text-muted);
  }

  &__body {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-secondary);
    word-break: break-word;
  }
}

// ===== 开关 =====
.switch-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  cursor: pointer;
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

// ===== 测试按钮 =====
.test-btn {
  width: 100%;
}

.test-hint {
  margin-top: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
