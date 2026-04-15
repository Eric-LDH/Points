<template>
  <div class="lucky-page">
    <h1 class="page-title">🍀 幸运任务</h1>
    
    <!-- 触发按钮 -->
    <div class="trigger-section card">
      <div class="trigger-content">
        <span class="trigger-icon">🎲</span>
        <button 
          class="btn btn--primary btn--lg trigger-btn"
          @click="drawLuckyTask"
          :disabled="isDrawing"
        >
          {{ isDrawing ? '抽取中...' : '领取今日幸运任务' }}
        </button>
      </div>
    </div>

    <!-- 今日任务展示区域 -->
    <div v-if="todayTask" class="task-display card">
      <div class="task-header">
        <span class="task-emoji">🎯</span>
        <h2 class="task-title">今日幸运任务</h2>
      </div>
      <div class="task-content">
        <p class="task-description">{{ todayTask.task.description }}</p>
        <div class="task-time">
          <span>📅 {{ formatTime(todayTask.drawnAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态提示 -->
    <div v-else class="empty-state card">
      <span class="empty-state__emoji">🎲</span>
      <p>点击上方按钮，抽取你的今日幸运任务！</p>
    </div>

    <!-- 配置说明 -->
    <div class="info-section card">
      <div class="info-content">
        <span class="info-icon">💡</span>
        <div>
          <p class="info-text">任务列表可在"我的"页面中进行配置管理</p>
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

const router = useRouter()

// 今日任务数据（包含任务内容和抽取时间）
interface TodayTask {
  task: LuckyTask
  drawnAt: string
}

const todayTask = ref<TodayTask | null>(null)
const isDrawing = ref(false)

/**
 * 随机抽取幸运任务
 * 使用 Math.random() 从配置列表中随机选择一条任务
 */
const drawLuckyTask = () => {
  // 获取所有配置的幸运任务
  const tasks = Storage.luckyTasks.getAll()
  
  // 检查是否有可用任务
  if (tasks.length === 0) {
    showToast({ message: '还没有配置任何任务，请先去配置', type: 'warning' })
    return
  }
  
  isDrawing.value = true
  
  // 模拟抽取动画延迟
  setTimeout(() => {
    // 使用 Math.random() 生成 0 到 1 之间的随机数
    // 乘以任务数组长度并向下取整，得到随机索引
    const randomIndex = Math.floor(Math.random() * tasks.length)
    const selectedTask = tasks[randomIndex]
    
    // 保存今日任务及抽取时间
    todayTask.value = {
      task: selectedTask,
      drawnAt: new Date().toISOString()
    }
    
    // 保存到本地存储，确保刷新后仍显示今日任务
    localStorage.setItem('lucky_today_task', JSON.stringify(todayTask.value))
    
    isDrawing.value = false
    showToast({ message: '抽取成功！祝你好运！', type: 'success' })
  }, 500)
}

/**
 * 格式化时间显示
 */
const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

/**
 * 跳转到配置页面
 */
const goToConfig = () => {
  router.push('/lucky/config')
}

onMounted(() => {
  // 滚动到页面顶部
  window.scrollTo(0, 0)
  
  // 从本地存储恢复今日任务（如果存在）
  const saved = localStorage.getItem('lucky_today_task')
  if (saved) {
    try {
      todayTask.value = JSON.parse(saved)
    } catch (e) {
      console.error('解析今日任务失败:', e)
    }
  }
})
</script>

<style scoped lang="scss">
.lucky-page {
  padding: var(--spacing-lg);
  max-width: 480px;
  margin: 0 auto;
  background-color: var(--bg-color);
  min-height: 100vh;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: var(--spacing-xl);
  color: var(--text-primary);
}

.trigger-section {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.trigger-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.trigger-icon {
  font-size: 64px;
  animation: sparkle 2s infinite;
}

@keyframes sparkle {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
}

.trigger-btn {
  width: 100%;
  padding: 16px 24px;
  font-size: 18px;
  font-weight: 600;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.task-display {
  margin-bottom: var(--spacing-xl);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.task-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.task-emoji {
  font-size: 32px;
}

.task-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.task-content {
  background: var(--bg-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.task-description {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.task-time {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

.empty-state {
  margin-bottom: var(--spacing-xl);
  text-align: center;
  padding: var(--spacing-xl);
  
  &__emoji {
    font-size: 64px;
    display: block;
    margin-bottom: var(--spacing-md);
  }
  
  p {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.info-section {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05));
}

.info-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.info-icon {
  font-size: 32px;
}

.info-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}
</style>
