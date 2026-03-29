import { watch, type Ref } from 'vue'

// 注册所有需要监听的弹窗 ref
const modalRefs: Ref<boolean>[] = []

/**
 * 注册弹窗 ref 到全局管理器
 * @param ref - 弹窗状态 ref
 */
export function registerModal(ref: Ref<boolean>) {
  if (!modalRefs.includes(ref)) {
    modalRefs.push(ref)
  }
}

/**
 * 检查是否有任何弹窗打开
 */
export function hasOpenModal(): boolean {
  return modalRefs.some(ref => ref.value) || !!document.querySelector('.modal-overlay')
}

/**
 * 锁定背景滚动
 */
export function lockBackgroundScroll() {
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
}

/**
 * 解锁背景滚动
 */
export function unlockBackgroundScroll() {
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
}

/**
 * 监听弹窗状态并自动管理背景滚动
 * @param ref - 弹窗状态 ref
 */
export function useModalLock(ref: Ref<boolean>) {
  // 注册到全局管理器
  registerModal(ref)
  
  // 监听弹窗状态变化
  watch(ref, (newVal) => {
    if (newVal) {
      // 弹窗打开时，锁定背景滚动
      lockBackgroundScroll()
    } else {
      // 弹窗关闭时，延迟检查是否还有其他弹窗
      setTimeout(() => {
        if (!hasOpenModal()) {
          unlockBackgroundScroll()
        }
      }, 100)
    }
  })
}
