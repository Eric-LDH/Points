<template>
  <div class="lucky-page">
    <div class="page-header-section">
      <h1 class="page-title">幸运任务</h1>
      <p class="page-subtitle">转一转，抽取你的幸运任务</p>
    </div>

    <!-- 幸运转盘 -->
    <div class="wheel-section glass-card">
      <LuckyWheel
        :tasks="tasks"
        :selected-index="storedTaskIndex"
        @draw="handleDraw"
      />
    </div>

    <!-- 最新任务展示 -->
    <div v-if="todayTask" class="task-display glass-card" style="animation: slide-up 0.4s ease">
      <div class="task-display__ribbon">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        最新幸运任务
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <div class="task-display__body">
        <div class="task-display__icon-wrap">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FBBF24" />
          </svg>
        </div>
        <p class="task-display__desc">{{ todayTask.task.description }}</p>
        <div class="task-display__meta">
          <div class="task-display__time">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {{ formatTime(todayTask.drawnAt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state glass-card">
      <div class="empty-state__icon-wrap">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="var(--text-muted)" fill="none" />
          <path d="M12 8v4l2 2" stroke="var(--text-muted)" stroke-linecap="round" />
        </svg>
      </div>
      <p>点击转盘中心的 GO！按钮，抽取幸运任务</p>
    </div>

    <!-- 配置提示 -->
    <div class="info-card glass-card">
      <div class="info-card__content">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--primary-color)" stroke-width="2">
          <path d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="10" />
        </svg>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Storage } from '@/utils/storage'
import type { LuckyTask } from '@/types'
import { showToast } from '@/utils/toast'
import LuckyWheel from '@/components/LuckyWheel.vue'

const router = useRouter()

interface TodayTask {
  task: LuckyTask
  drawnAt: string
}

const todayTask = ref<TodayTask | null>(null)
const tasks = ref<LuckyTask[]>([])

// 已抽取任务在列表中的索引（用于轮盘高亮）
const storedTaskIndex = computed(() => {
  if (!todayTask.value) return null
  const idx = tasks.value.findIndex(t => t.id === todayTask.value!.task.id)
  return idx >= 0 ? idx : null
})

// 抽奖完成处理
const handleDraw = (task: LuckyTask) => {
  todayTask.value = {
    task,
    drawnAt: new Date().toISOString()
  }
  localStorage.setItem('lucky_today_task', JSON.stringify(todayTask.value))
  showToast({ message: '🎉 恭喜！获得了幸运任务！', type: 'success' })
}

// 格式化时间
const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${h}:${m}`
}

const goToConfig = () => {
  router.push('/lucky/config')
}

onMounted(() => {
  window.scrollTo(0, 0)

  // 加载任务列表
  tasks.value = Storage.luckyTasks.getAll()

  // 加载今日已抽取任务
  const saved = localStorage.getItem('lucky_today_task')
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as TodayTask
      todayTask.value = parsed
    } catch (e) {
      console.error(e)
    }
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
  animation: page-fade-in 0.5s ease;
}

// ===== 页面头部 =====
.page-header-section {
  margin-bottom: var(--spacing-xl);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 2px;
  background: linear-gradient(135deg, var(--primary-color), var(--purple-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  width: 100%;

  .dark &, html.dark & {
    color: var(--dark-text-primary);
    -webkit-text-fill-color: initial;
    background: none;
  }
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  flex: 1;

  .dark &, html.dark & {
    color: var(--dark-text-muted);
  }
}

// ===== 转盘区域 =====
.wheel-section {
  padding: 0;
  margin-bottom: var(--spacing-xl);
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
}

// ===== 任务展示卡片 =====
.task-display {
  overflow: hidden;
  padding: 0;
  margin-bottom: var(--spacing-xl);
  animation: slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

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
    text-align: center;
  }

  &__icon-wrap {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.08));
    border-radius: 50%;
    margin: 0 auto var(--spacing-md);
    animation: icon-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__desc {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.7;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);

    .dark &, html.dark & {
      color: var(--dark-text-primary);
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-lg);
  }

  &__time {
    font-size: 12px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 4px;

    .dark &, html.dark & {
      color: var(--dark-text-muted);
    }
  }

  &__status {
    font-size: 12px;
    color: var(--warning-color);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    background: rgba(245, 158, 11, 0.1);
    border-radius: 12px;
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--warning-color);
  animation: status-pulse 2s ease-in-out infinite;
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
    animation: float 3s ease-in-out infinite;
  }

  p {
    font-size: 14px;
    color: var(--text-muted);

    .dark &, html.dark & {
      color: var(--dark-text-muted);
    }
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

    .dark &, html.dark & {
      color: var(--dark-text-muted);
    }
  }
}

// ===== 工具类 =====
.glass-card {
  @include glass-card;
}

// ===== 关键帧 =====
@keyframes page-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes icon-bounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

</style>
