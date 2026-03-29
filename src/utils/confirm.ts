import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
}

const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmType = ref<'warning' | 'danger' | 'info'>('warning')
let confirmResolve: ((value: boolean) => void) | null = null

export function showConfirm(options: ConfirmOptions | string): Promise<boolean> {
  const config = typeof options === 'string' 
    ? { title: '确认操作', message: options, type: 'warning' as const }
    : { 
        title: options.title || '确认操作', 
        message: options.message, 
        type: options.type ?? 'warning' as const,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消'
      }

  confirmTitle.value = config.title
  confirmMessage.value = config.message || ''
  confirmType.value = config.type
  confirmVisible.value = true

  return new Promise<boolean>((resolve) => {
    confirmResolve = resolve
  })
}

export function confirmResult(result: boolean) {
  if (confirmResolve) {
    confirmResolve(result)
    confirmResolve = null
  }
  confirmVisible.value = false
}

export function useConfirm() {
  return {
    confirmVisible,
    confirmTitle,
    confirmMessage,
    confirmType,
    showConfirm,
    confirmResult
  }
}
