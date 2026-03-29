<template>
  <div class="toast-container">
    <transition name="toast-fade">
      <div v-if="visible" class="toast" :class="`toast--${type}`">
        <span class="toast__icon">{{ icon }}</span>
        <span class="toast__message">{{ message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

const props = defineProps<Props>()

const icon = computed(() => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
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
  gap: 8px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(8px);
  min-width: 200px;
  justify-content: center;

  &--success {
    background: linear-gradient(135deg, #10B981, #059669);
  }

  &--error {
    background: linear-gradient(135deg, #EF4444, #DC2626);
  }

  &--warning {
    background: linear-gradient(135deg, #F59E0B, #D97706);
  }

  &--info {
    background: linear-gradient(135deg, #6366F1, #4F46E5);
  }

  &__icon {
    font-size: 16px;
    font-weight: bold;
  }

  &__message {
    line-height: 1.5;
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
