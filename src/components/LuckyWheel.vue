<template>
  <div class="lucky-wheel" :class="{ 'is-disabled': disabled, 'is-spinning': spinning }">
    <!-- 指针 -->
    <div class="wheel-pointer">
      <svg width="32" height="36" viewBox="0 0 32 36">
        <defs>
          <linearGradient id="ptrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FBBF24" />
            <stop offset="100%" stop-color="#EF4444" />
          </linearGradient>
        </defs>
        <polygon points="16,36 0,0 32,0" fill="url(#ptrGrad)" />
        <polygon points="16,30 5,4 27,4" fill="rgba(255,255,255,0.25)" />
      </svg>
    </div>

    <!-- 转盘容器 -->
    <div class="wheel-container" :class="{ 'is-single': segments.length === 1 }">
      <div class="wheel-glow-ring" />
      <div class="wheel-outer-ring">
        <div
          v-for="dot in 24"
          :key="dot"
          class="wheel-dot"
          :style="{ transform: `rotate(${dot * 15}deg) translateY(-${dot % 2 === 0 ? 138 : 142}px)` }"
        />
      </div>
      <div class="wheel-rotate" ref="wheelRef" :style="wheelStyle">
        <svg viewBox="0 0 300 300" class="wheel-svg" xmlns="http://www.w3.org/2000/svg">
          <g v-for="(seg, i) in segments" :key="i">
            <path :d="seg.path" :fill="seg.color" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" />
            <path
              v-if="resultIndex === i && !spinning"
              :d="seg.path"
              fill="none"
              :stroke="spinning ? 'none' : '#FBBF24'"
              stroke-width="4"
              class="glow-path"
            />

          </g>
          <!-- 中心装饰 -->
          <circle cx="150" cy="150" r="44" fill="rgba(99,102,241,0.15)" />
          <circle cx="150" cy="150" r="40" fill="rgba(255,255,255,0.98)" stroke="#E5E7EB" stroke-width="1" />
          <circle cx="150" cy="150" r="34" fill="linear-gradient(135deg, #6366F1, #8B5CF6)" />
        </svg>
        <button
          class="wheel-btn"
          @click="startSpin"
          :disabled="disabled || spinning"
        >
          <span v-if="spinning" class="wheel-btn__spinning">
            <svg class="wheel-btn__spinner" viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="12" r="10" fill="none" stroke="#6366F1" stroke-width="3" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
            </svg>
          </span>
          <template v-else>
            <span v-if="disabled" class="wheel-btn__text">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" fill="#9CA3AF" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" />
                <circle cx="12" cy="16" r="1.5" fill="#9CA3AF" />
              </svg>
              <span class="wheel-btn__label">今日已抽</span>
            </span>
            <span v-else class="wheel-btn__text">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#6366F1" transform="matrix(0.85 0 0 0.85 1.8 1.8)" />
                <path d="M13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" fill="#6366F1" />
                <path d="M7.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" fill="#6366F1" opacity="0.5" />
                <path d="M19.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" fill="#6366F1" opacity="0.5" />
              </svg>
              <span class="wheel-btn__label">GO!</span>
            </span>
          </template>
        </button>
      </div>
    </div>

    <!-- 无任务提示 -->
    <div v-if="tasks.length === 0" class="wheel-empty-hint">
      <p>还没有配置幸运任务</p>
      <p class="wheel-empty-hint__sub">请在「我的」页面中添加</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { LuckyTask } from '@/types'

const props = withDefaults(defineProps<{
  tasks: LuckyTask[]
  disabled?: boolean
  selectedIndex?: number | null
}>(), {
  disabled: false,
  selectedIndex: null
})

const emit = defineEmits<{
  draw: [task: LuckyTask]
}>()

// 转盘调色板 - 鲜艳渐变色
const COLORS = [
  '#6366F1', // 靛蓝
  '#F59E0B', // 琥珀
  '#EC4899', // 粉红
  '#10B981', // 翡翠
  '#8B5CF6', // 紫
  '#F97316', // 橙
  '#06B6D4', // 青
  '#EF4444', // 红
  '#14B8A6', // 青绿
  '#A855F7', // 紫罗兰
  '#EAB308', // 黄
  '#3B82F6', // 蓝
]

const SPIN_DURATION = 3500 // 旋转持续时间（毫秒）

const spinning = ref(false)
const currentRotation = ref(0)
const wheelRef = ref<HTMLElement | null>(null)
const resultIndex = ref<number | null>(null)

// 转盘最多展示 12 个扇区
const MAX_SEGMENTS = 12

// 计算扇区数据（只用于转盘视觉效果，不限制随机范围）
const segments = computed(() => {
  const effectiveTasks = props.tasks.length > 0 ? props.tasks : []
  const count = Math.min(effectiveTasks.length, MAX_SEGMENTS)
  if (count === 0) return []

  const sectorAngle = 360 / count
  const cx = 150
  const cy = 150
  const r = 138

  return effectiveTasks.slice(0, MAX_SEGMENTS).map((task, i) => {
    const startAngle = i * sectorAngle - 90
    const endAngle = (i + 1) * sectorAngle - 90
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = sectorAngle > 180 ? 1 : 0

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`

    // 文字位置（扇区中心线 65% 半径处）
    return {
      path,
      color: COLORS[i % COLORS.length],
    }
  })
})

// 转盘旋转样式
const wheelStyle = computed(() => ({
  transform: `rotate(${currentRotation.value}deg)`,
  transition: spinning.value
    ? `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0.85, 0.35, 1.05)`
    : 'none',
}))

// 监听 selectedIndex 外部变化（用于恢复今日已抽状态）
// selectedIndex 是任务在完整列表中的索引，需要映射到转盘视觉扇区
watch(() => props.selectedIndex, (val) => {
  if (val !== null && val !== undefined && !spinning.value) {
    resultIndex.value = mapTaskIndexToSegment(val)
  }
}, { immediate: true })

// 开始旋转
let spinTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 将任务在完整列表中的索引映射到转盘视觉扇区索引
 * 例如：40 个任务，转盘显示 12 个扇区，任务 #25 映射到扇区 25 % 12 = 1
 */
const mapTaskIndexToSegment = (taskIndex: number): number => {
  const segmentCount = Math.min(props.tasks.length, MAX_SEGMENTS)
  if (segmentCount === 0) return 0
  return taskIndex % segmentCount
}

const startSpin = () => {
  if (spinning.value || props.disabled || props.tasks.length === 0) return

  // 从全部任务中随机选取（不再限制为前12个）
  const targetTaskIndex = Math.floor(Math.random() * props.tasks.length)
  // 映射到转盘视觉扇区
  const targetSegmentIndex = mapTaskIndexToSegment(targetTaskIndex)

  const segmentCount = Math.min(props.tasks.length, MAX_SEGMENTS)
  const sectorAngle = 360 / segmentCount
  const baseTurns = 5 + Math.floor(Math.random() * 3) // 5-7 圈
  const targetEffectiveAngle = targetSegmentIndex * sectorAngle + sectorAngle / 2
  const targetRotation = (360 - targetEffectiveAngle % 360 + 360) % 360
  const newRotation = currentRotation.value + baseTurns * 360 + targetRotation

  // 激活旋转状态（按钮立即禁用）
  spinning.value = true
  resultIndex.value = null

  // 清除上次计时（安全防护）
  if (spinTimer) {
    clearTimeout(spinTimer)
    spinTimer = null
  }

  // 双段 requestAnimationFrame 确保 transition 被浏览器正确识别：
  // 第一帧：spinning=true 使 transition 样式生效
  // 第二帧：改变 transform 触发平滑动画
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      currentRotation.value = newRotation
    })
  })

  // 固定时长后结束旋转（不依赖 transitionend 事件，更可靠）
  spinTimer = setTimeout(() => {
    spinning.value = false
    // resultIndex 存视觉扇区索引，用于轮盘高亮
    resultIndex.value = targetSegmentIndex
    currentRotation.value = newRotation % 360

    // 使用从全部任务中随机选出的任务
    const selectedTask = props.tasks[targetTaskIndex]
    if (selectedTask) {
      emit('draw', selectedTask)
    }
    spinTimer = null
  }, SPIN_DURATION)
}

// 组件卸载时清理计时器
onUnmounted(() => {
  if (spinTimer) {
    clearTimeout(spinTimer)
    spinTimer = null
  }
})

// 暴露方法供父组件调用
defineExpose({ resultIndex })
</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.lucky-wheel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  animation: wheel-fade-in 0.6s ease;

  &.is-disabled {
    .wheel-container {
      opacity: 0.85;
    }
  }
}

// ===== 指针 =====
.wheel-pointer {
  position: relative;
  z-index: 10;
  margin-bottom: -6px;
  filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.4));
  animation: pointer-bounce 2s ease-in-out infinite;

  .is-spinning & {
    animation: pointer-glow 1s ease-in-out infinite alternate;
  }
}

// ===== 转盘容器 =====
.wheel-container {
  position: relative;
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// ===== 光环装饰 =====
.wheel-glow-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(99,102,241,0.25), rgba(251,191,36,0.15), rgba(99,102,241,0.25), rgba(168,85,247,0.15), rgba(99,102,241,0.25));
  animation: glow-spin 8s linear infinite;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    inset: 15px;
    border-radius: 50%;
    background: transparent;
    box-shadow: 0 0 50px rgba(99, 102, 241, 0.25), 0 0 100px rgba(251, 191, 36, 0.15);
    animation: glow-pulse 3s ease-in-out infinite;
  }
}

// ===== 外圈装饰点 =====
.wheel-outer-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366F1, #8B5CF6, #A78BFA);
  padding: 6px;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.25), inset 0 2px 4px rgba(255,255,255,0.3);

  .dark &, html.dark & {
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15), inset 0 2px 4px rgba(255,255,255,0.1);
  }
}

.wheel-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  transform-origin: 0 0;
  z-index: 2;
}

// ===== 可旋转部分 =====
.wheel-rotate {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  overflow: hidden;
  z-index: 1;
  will-change: transform;
  background: #1E293B;

  .dark &, html.dark & {
    background: #0F172A;
  }
}

.wheel-svg {
  width: 100%;
  height: 100%;
  display: block;
}

// ===== 发光选中扇区 =====
.glow-path {
  animation: glow-pulse 1.5s ease-in-out infinite alternate;
}

// ===== 中心按钮 =====
.wheel-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 3px solid rgba(99, 102, 241, 0.2);
  background: #fff;
  cursor: pointer;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
  outline: none;

  .dark &, html.dark & {
    background: #1E293B;
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }

  &:active:not(:disabled) {
    transform: translate(-50%, -50%) scale(0.92);
  }

  &:disabled {
    cursor: not-allowed;
    border-color: rgba(156, 163, 175, 0.2);
    box-shadow: none;

    .wheel-btn__text {
      flex-direction: column;
      gap: 2px;
    }

    .wheel-btn__label {
      font-size: 10px;
      color: #9CA3AF;
    }
  }

  &__text {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  &__label {
    font-size: 14px;
    font-weight: 700;
    color: #6366F1;
    letter-spacing: 1px;

    .dark &, html.dark & {
      color: #818CF8;
    }
  }

  &__spinning {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__spinner {
    animation: spin-anim 0.8s linear infinite;
    stroke: #6366F1;
  }
}

// ===== 空任务提示 =====
.wheel-empty-hint {
  text-align: center;
  margin-top: var(--spacing-lg);

  p {
    font-size: 14px;
    color: var(--text-secondary);

    .dark &, html.dark & {
      color: var(--dark-text-secondary);
    }
  }

  &__sub {
    font-size: 12px !important;
    color: var(--text-muted) !important;
    margin-top: 4px;

    .dark &, html.dark & {
      color: var(--dark-text-muted) !important;
    }
  }
}

// ===== 动画关键帧 =====
@keyframes wheel-fade-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes pointer-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes pointer-glow {
  from { filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.4)); }
  to { filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.8)); }
}

@keyframes glow-pulse {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

@keyframes spin-anim {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glow-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
</style>
