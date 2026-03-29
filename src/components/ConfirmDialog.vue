<template>
  <div class="confirm-overlay" @click="handleOverlayClick">
    <div class="confirm-modal" @click.stop>
      <div class="confirm-modal__header">
        <span class="confirm-modal__icon" :class="`icon--${type}`">{{ icon }}</span>
        <h3 class="confirm-modal__title">{{ title }}</h3>
      </div>
      
      <div v-if="message" class="confirm-modal__content">
        {{ message }}
      </div>
      
      <div class="confirm-modal__footer">
        <button 
          class="btn btn--outline"
          @click="handleCancel"
        >
          {{ cancelText || '取消' }}
        </button>
        <button 
          class="btn"
          :class="`btn--${type === 'danger' ? 'danger' : 'primary'}`"
          @click="handleConfirm"
        >
          {{ confirmText || '确定' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  title: string
  message?: string
  type?: 'warning' | 'danger' | 'info'
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'warning',
  confirmText: '确定',
  cancelText: '取消'
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const icon = computed(() => {
  const icons = {
    warning: '⚠',
    danger: '❗',
    info: 'ℹ'
  }
  return icons[props.type] || icons.warning
})

const handleOverlayClick = () => {
  // 点击遮罩层不关闭，必须选择
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped lang="scss">
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}

.confirm-modal {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 16px;
  }

  &__icon {
    font-size: 48px;
    margin-bottom: 12px;

    &--warning {
      filter: hue-rotate(0deg);
    }

    &--danger {
      filter: hue-rotate(0deg);
    }

    &--info {
      filter: hue-rotate(200deg);
    }
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
  }

  &__content {
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.6;
    text-align: center;
    margin-bottom: 24px;
    white-space: pre-wrap;
  }

  &__footer {
    display: flex;
    gap: 12px;

    button {
      flex: 1;
      padding: 12px;
      font-size: 15px;
      font-weight: 500;
      border-radius: 12px;
      transition: all 0.2s ease;
    }
  }

  @media (prefers-color-scheme: dark) {
    background: var(--dark-card-bg);
    
    .confirm-modal__title {
      color: var(--dark-text-primary);
    }

    .confirm-modal__content {
      color: var(--dark-text-secondary);
    }
  }

  // 支持 .dark 类名触发深色模式
  .app-container.dark & {
    background: var(--dark-card-bg);
    
    .confirm-modal__title {
      color: var(--dark-text-primary);
    }

    .confirm-modal__content {
      color: var(--dark-text-secondary);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
