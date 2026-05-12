<template>
  <div class="lucky-page">
    <!-- 背景装饰星星 -->
    <div class="lucky-decorations" aria-hidden="true">
      <div class="lucky-star lucky-star--1">✦</div>
      <div class="lucky-star lucky-star--2">✦</div>
      <div class="lucky-star lucky-star--3">✦</div>
    </div>

    <!-- 渐变英雄头部 -->
    <div class="hero-header">
      <div class="hero-header__bg">
        <div class="hero-header__glow glow-1" />
        <div class="hero-header__glow glow-2" />
      </div>
      <div class="hero-header__content">
        <div class="hero-header__stars" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="rgba(255,255,255,0.2)">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="rgba(255,255,255,0.15)" class="star-float-1">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <svg viewBox="0 0 24 24" width="10" height="10" fill="rgba(255,255,255,0.25)" class="star-float-2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h1 class="hero-header__title">幸运任务</h1>
        <p class="hero-header__subtitle">转一转，抽取你的幸运任务</p>
      </div>
    </div>

    <!-- 幸运转盘 -->
    <div class="wheel-section">
      <div class="wheel-glow-ring" />
      <div class="wheel-card glass-card">
        <LuckyWheel
          :tasks="tasks"
          :selected-index="storedTaskIndex"
          @draw="handleDraw"
        />
      </div>
    </div>

    <!-- 最新任务展示 -->
    <div v-if="todayTask" class="task-display glass-card" style="animation: task-display-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)">
      <div class="task-display__body">
        <p class="task-display__desc">{{ todayTask.task.description }}</p>
        <div class="task-display__meta">
          <div class="task-display__time">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
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
        <svg viewBox="0 0 24 24" width="56" height="56" fill="none" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#F59E0B" />
          <path d="M12 8v4l2 2" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
      <p class="empty-state__text">点击转盘中心的 <strong>GO！</strong> 按钮</p>
      <p class="empty-state__hint">抽取今天的幸运任务吧 🍀</p>
    </div>

    <!-- 配置提示 -->
    <div class="info-card glass-card">
      <div class="info-card__accent" />
      <div class="info-card__content">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--primary-color)" stroke-width="2" aria-hidden="true">
          <path d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <div>
          <p class="info-card__text">任务列表可在「我的」页面中配置管理</p>
          <button class="btn btn--primary btn--sm" @click="goToConfig">
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

// ========== 背景装饰星星 ==========
.lucky-decorations {
  position: fixed;
  inset: 0;
  max-width: 480px;
  margin: 0 auto;
  pointer-events: none;
  z-index: 0;
}

.lucky-star {
  position: absolute;
  font-size: 20px;
  color: rgba(99, 102, 241, 0.15);
  animation: star-float 6s ease-in-out infinite;
  will-change: transform;

  .dark &, html.dark & {
    color: rgba(139, 92, 246, 0.2);
  }

  &--1 {
    top: 10%;
    left: 5%;
    font-size: 22px;
    animation-delay: 0s;
  }

  &--2 {
    top: 25%;
    right: 8%;
    font-size: 16px;
    animation-delay: 2s;
  }

  &--3 {
    bottom: 30%;
    left: 3%;
    font-size: 14px;
    animation-delay: 4s;
  }
}

// ========== 渐变英雄头部 ==========
.hero-header {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);
  z-index: 1;

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

  &__stars {
    display: flex;
    gap: 6px;
    margin-bottom: var(--spacing-sm);
  }

  &__title {
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.15);
    letter-spacing: 0.5px;
  }

  &__subtitle {
    font-size: 14px;
    color: rgba(255,255,255,0.8);
  }
}

// ========== 转盘区域 ==========
.wheel-section {
  position: relative;
  margin-bottom: var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.wheel-glow-ring {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(99,102,241,0.15), rgba(251,191,36,0.1), rgba(99,102,241,0.15), rgba(168,85,247,0.1), rgba(99,102,241,0.15));
  animation: glow-spin 8s linear infinite;
  will-change: transform;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    inset: 10px;
    border-radius: 50%;
    background: transparent;
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.2), 0 0 80px rgba(251, 191, 36, 0.1);
    animation: glow-pulse 3s ease-in-out infinite;
  }
}

.wheel-card {
  position: relative;
  padding: 0;
  overflow: visible;
  z-index: 2;
  background: transparent !important;
  box-shadow: none !important;
}

// ========== 任务展示卡片 ==========
.task-display {
  overflow: hidden;
  padding: 0;
  margin-bottom: var(--spacing-xl);
  position: relative;
  z-index: 1;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.15), 0 0 40px rgba(251, 191, 36, 0.05), 0 8px 32px rgba(99, 102, 241, 0.08) !important;

  .dark &, html.dark & {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.1), 0 0 40px rgba(251, 191, 36, 0.03), 0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.05) !important;
  }

  &__ribbon {
    background: linear-gradient(135deg, #F59E0B, #FBBF24, #F59E0B);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
    color: #fff;
    text-align: center;
    padding: 12px;
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    letter-spacing: 1px;

    svg {
      filter: drop-shadow(0 0 4px rgba(255,255,255,0.4));
    }
  }

  &__body {
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  &__icon-wrap {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1));
    border-radius: 50%;
    margin: 0 auto var(--spacing-md);
    animation: icon-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 0 16px rgba(251, 191, 36, 0.2);

    svg {
      filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.4));
    }
  }

  &__desc {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.6;
    background: linear-gradient(135deg, #F59E0B, #D97706);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: var(--spacing-md);

    .dark &, html.dark & {
      color: var(--dark-text-primary);
      -webkit-text-fill-color: initial;
      background: none;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: right;
    gap: var(--spacing-md);
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
    color: #F59E0B;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 12px;
    background: rgba(245, 158, 11, 0.12);
    border-radius: 12px;
    font-weight: 500;
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #F59E0B;
  animation: status-pulse 2s ease-in-out infinite;
}

// ========== 空状态 ==========
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-xl);
  position: relative;
  z-index: 1;

  &__icon-wrap {
    width: 90px;
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.08));
    border-radius: 50%;
    margin: 0 auto var(--spacing-lg);
    animation: star-spin-float 4s ease-in-out infinite;
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.1);

    svg {
      filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4));
    }
  }

  &__text {
    font-size: 15px;
    color: var(--text-secondary);
    margin-bottom: 4px;

    strong {
      color: var(--primary-color);
      font-weight: 700;
    }

    .dark &, html.dark & {
      color: var(--dark-text-secondary);
    }
  }

  &__hint {
    font-size: 13px;
    color: var(--text-muted);

    .dark &, html.dark & {
      color: var(--dark-text-muted);
    }
  }
}

// ========== 配置提示 ==========
.info-card {
  padding: 0;
  position: relative;
  z-index: 1;
  display: flex;
  overflow: hidden;

  &__accent {
    width: 4px;
    flex-shrink: 0;
    background: linear-gradient(180deg, var(--primary-color), var(--purple-light));
  }

  &__content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    flex: 1;
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

// ========== 工具类 ==========
.glass-card {
  @include glass-card;
}

// ========== 关键帧 ==========
@keyframes page-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes task-display-in {
  0% { opacity: 0; transform: scale(0.92) translateY(16px); }
  60% { transform: scale(1.02) translateY(-4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes star-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(5deg); }
  75% { transform: translateY(-5px) rotate(-3deg); }
}

@keyframes star-spin-float {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
  25% { transform: translateY(-6px) rotate(90deg) scale(1.05); }
  50% { transform: translateY(0) rotate(180deg) scale(1); }
  75% { transform: translateY(-4px) rotate(270deg) scale(1.03); }
}

@keyframes glow-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: 0% center; }
  50% { background-position: 100% center; }
  100% { background-position: 0% center; }
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes icon-bounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

// ========== 英雄头部星星浮动 ==========
.star-float-1 {
  animation: star-drift 5s ease-in-out infinite;
  transform-origin: center;
}

.star-float-2 {
  animation: star-drift 4s ease-in-out infinite reverse;
  transform-origin: center;
}

@keyframes star-drift {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(15deg); opacity: 0.3; }
}

</style>
