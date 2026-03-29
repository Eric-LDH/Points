import { ref } from 'vue'

export interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('info')

export function showToast(options: ToastOptions | string) {
  const config = typeof options === 'string' 
    ? { message: options, type: 'info' as const, duration: 2000 }
    : { ...options, duration: options.duration ?? 2000, type: options.type ?? 'info' as const }

  toastMessage.value = config.message
  toastType.value = config.type
  toastVisible.value = true

  return new Promise<void>((resolve) => {
    setTimeout(() => {
      toastVisible.value = false
      resolve()
    }, config.duration)
  })
}

export function useToast() {
  return {
    toastVisible,
    toastMessage,
    toastType,
    showToast
  }
}
