<template>
  <div class="confirm-overlay" @click="handleOverlayClick">
    <div class="confirm-modal" @click.stop>
      <div class="confirm-modal__header">
        <div class="confirm-modal__icon" :class="`icon--${type}`">
          <IconFont :name="iconName" :size="40" />
        </div>
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
import IconFont from '@/components/IconFont.vue'

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

const iconName = computed(() => {
  const icons: Record<string, 'star' | 'close' | 'gift'> = {
    warning: 'star',
    danger: 'close',
    info: 'gift'
  }
  return icons[props.type] || icons.warning
})

const iconColor = computed(() => {
  const colors = {
    warning: 'var(--warning-color)',
    danger: 'var(--danger-color)',
    info: 'var(--primary-color)'
  }
  return colors[props.type] || colors.warning
})

const handleOverlayClick = () => {
  // 点击遮罩层不关闭
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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: overlay-in 0.25s ease;
  padding: var(--spacing-lg);
}

.confirm-modal {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  max-width: 340px;
  width: 100%;
  box-shadow: 0 16px 48px rgba(99, 102, 241, 0.12);
  animation: modal-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

  .dark &, html.dark &, .app-container.dark & {
    background: rgba(30, 41, 59, 0.7);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  }

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }

  &__icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-md);
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.08);
    
    &.icon--warning { 
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning-color);
    }
    &.icon--danger { 
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger-color);
    }
    &.icon--info { 
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary-color);
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
    margin-bottom: var(--spacing-xl);
    white-space: pre-wrap;
  }

  &__footer {
    display: flex;
    gap: var(--spacing-md);

    button {
      flex: 1;
      padding: 12px;
      font-size: 15px;
      font-weight: 500;
      border-radius: var(--radius-lg);
    }
  }
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modal-in {
  from {
    transform: scale(0.9) translateY(20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
</style>
