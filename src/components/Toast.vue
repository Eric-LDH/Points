<template>
  <div class="toast-container">
    <transition name="toast-slide">
      <div v-if="visible" class="toast" :class="`toast--${type}`">
        <span class="toast__icon">
          <IconFont :name="iconName" :size="16" color="#fff" />
        </span>
        <span class="toast__message">{{ message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IconFont from '@/components/IconFont.vue'

interface Props {
  visible: boolean
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

const props = defineProps<Props>()

const iconName = computed(() => {
  const icons: Record<string, 'check' | 'close' | 'star' | 'gift'> = {
    success: 'check',
    error: 'close',
    warning: 'star',
    info: 'gift'
  }
  return icons[props.type] || icons.info
})
</script>

<style scoped lang="scss">
.toast-container {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  color: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  min-width: 180px;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.15);

  &--success {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9));
  }

  &--error {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
  }

  &--warning {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9));
  }

  &--info {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(79, 70, 229, 0.9));
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &__message {
    line-height: 1.5;
  }
}

.toast-slide-enter-active {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform, opacity;
}

.toast-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform, opacity;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(30px) scale(0.9);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px) scale(0.9);
}
</style>
