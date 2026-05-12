<template>
  <div class="lucky-page">
    <div class="page-header-section">
      <h1 class="page-title">幸运任务</h1>
      <p class="page-subtitle">每天都有新挑战</p>
    </div>
    
    <!-- 触发区域 -->
    <div class="lucky-hero glass-card">
      <div class="lucky-hero__glow" />
      <div class="lucky-hero__content">
        <div class="lucky-hero__icon">
          <IconFont name="clover" :size="48" color="#6366F1" />
        </div>
        <button 
          class="lucky-btn"
          @click="drawLuckyTask"
          :disabled="isDrawing"
        >
          <span v-if="isDrawing" class="lucky-btn__loading">
            <IconFont name="add" :size="20" color="#fff" custom-class="spinning" />
            抽取中...
          </span>
          <span v-else class="lucky-btn__text">
            <IconFont name="star" :size="18" color="#fff" />
            领取今日幸运任务
          </span>
        </button>
      </div>
    </div>

    <!-- 今日任务展示 -->
    <div v-if="todayTask" class="task-display glass-card" style="animation: slide-up 0.4s ease">
      <div class="task-display__ribbon">
        <IconFont name="star" :size="12" color="#fff" />
        今日幸运任务
        <IconFont name="star" :size="12" color="#fff" />
      </div>
      <div class="task-display__body">
        <p class="task-display__desc">{{ todayTask.task.description }}</p>
        <div class="task-display__time">
          <IconFont name="calendar" :size="12" color="var(--text-muted)" />
          {{ formatTime(todayTask.drawnAt) }} 抽取
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state glass-card">
      <div class="empty-state__icon-wrap">
        <IconFont name="clover" :size="40" color="var(--text-muted)" />
      </div>
      <p>点击上方按钮，抽取你的今日幸运任务</p>
    </div>

    <!-- 配置提示 -->
    <div class="info-card glass-card">
      <div class="info-card__content">
        <IconFont name="notes" :size="20" color="var(--primary-color)" />
        <div>
          <p class="info-card__text">任务列表可在「我的」页面中配置管理</p>
          <button class="btn btn--outline btn--sm" @click="goToConfig">
            前往配置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Storage } from '@/utils/storage'
import type { LuckyTask } from '@/types'
import { showToast } from '@/utils/toast'
import IconFont from '@/components/IconFont.vue'

const router = useRouter()

interface TodayTask {
  task: LuckyTask
  drawnAt: string
}

const todayTask = ref<TodayTask | null>(null)
const isDrawing = ref(false)

const drawLuckyTask = () => {
  const tasks = Storage.luckyTasks.getAll()
  if (tasks.length === 0) {
    showToast({ message: '还没有配置任何任务，请先去配置', type: 'warning' })
    return
  }
  isDrawing.value = true
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * tasks.length)
    const selectedTask = tasks[randomIndex]
    todayTask.value = {
      task: selectedTask,
      drawnAt: new Date().toISOString()
    }
    localStorage.setItem('lucky_today_task', JSON.stringify(todayTask.value))
    isDrawing.value = false
    showToast({ message: '抽取成功！祝你好运！', type: 'success' })
  }, 600)
}

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  // 使用本地时间格式化，避免时区问题
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const goToConfig = () => {
  router.push('/lucky/config')
}

onMounted(() => {
  window.scrollTo(0, 0)
  const saved = localStorage.getItem('lucky_today_task')
  if (saved) {
    try { todayTask.value = JSON.parse(saved) } catch (e) { console.error(e) }
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.lucky-page {
  padding: var(--spacing-lg);
  padding-top: calc(var(--spacing-lg) + env(safe-area-inset-top, 0px));
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  animation: fade-in 0.5s ease;
}

.page-header-section {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 2px;

  .dark &, html.dark & {
    color: var(--dark-text-primary);
  }

  @media (prefers-color-scheme: dark) {
    color: var(--dark-text-primary);
  }
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

// ===== 幸运抽奖区域 =====
.lucky-hero {
  position: relative;
  overflow: hidden;
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  margin-bottom: var(--spacing-xl);

  &__glow {
    position: absolute;
    top: -50%;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%);
    pointer-events: none;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xl);
  }

  &__icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.08);
    border-radius: 50%;
  }
}

.lucky-btn {
  width: 100%;
  padding: 16px 24px;
  border: none;
  border-radius: var(--radius-xl);
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #6366F1, #8B5CF6, #A78BFA);
  background-size: 200% 200%;
  color: #fff;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:active {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  &__text, &__loading {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

// ===== 任务展示 =====
.task-display {
  overflow: hidden;
  padding: 0;
  margin-bottom: var(--spacing-xl);

  &__ribbon {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    color: #fff;
    text-align: center;
    padding: 10px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  &__body {
    padding: var(--spacing-lg);
  }

  &__desc {
    font-size: 17px;
    line-height: 1.7;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
    text-align: center;

    .dark &, html.dark & {
      color: var(--dark-text-primary);
    }

    @media (prefers-color-scheme: dark) {
      color: var(--dark-text-primary);
    }
  }

  &__time {
    font-size: 12px;
    color: var(--text-muted);
    text-align: right;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
  }
}

// ===== 空状态 =====
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-xl);

  &__icon-wrap {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.05);
    border-radius: 50%;
    margin: 0 auto var(--spacing-lg);
  }

  p {
    font-size: 14px;
    color: var(--text-muted);
  }
}

// ===== 配置提示 =====
.info-card {
  padding: var(--spacing-lg);

  &__content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  &__text {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: var(--spacing-sm);
  }
}

// ===== 工具类 =====
.glass-card {
  @include glass-card;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateX(0%) translateY(0) rotate(0deg); }
  50% { transform: translateX(0%) translateY(-10px) rotate(5deg); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
