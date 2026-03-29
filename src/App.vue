<template>
  <div class="app-container" :class="{ dark: darkMode }">
    <router-view />
    <Tabbar v-if="showTabbar" />
    
    <!-- 全局 Toast 组件 -->
    <Toast 
      :visible="toastVisible" 
      :message="toastMessage" 
      :type="toastType" 
    />
    
    <!-- 全局确认对话框 -->
    <ConfirmDialog
      v-if="confirmVisible"
      :visible="confirmVisible"
      :title="confirmTitle"
      :message="confirmMessage"
      :type="confirmType"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import Tabbar from '@/components/Tabbar.vue'
import Toast from '@/components/Toast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useToast } from '@/utils/toast'
import { useConfirm, confirmResult } from '@/utils/confirm'
import { useConfirm as useConfirmUtil } from '@/utils/confirm'
import { App } from '@capacitor/app'
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar'
import { hasOpenModal, lockBackgroundScroll, unlockBackgroundScroll } from '@/composables/useModalLock'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const darkMode = computed(() => store.darkMode)

// Toast 相关
const { toastVisible, toastMessage, toastType } = useToast()

// Confirm 相关
const { confirmVisible, confirmTitle, confirmMessage, confirmType, showConfirm, confirmResult: localConfirmResult } = useConfirmUtil()

const showTabbar = computed(() => {
  // 底部导航显示在主要页面
  const mainRoutes = ['/', '/index', '/stats', '/record', '/exchange', '/mine']
  return mainRoutes.includes(route.path)
})

const handleConfirm = () => {
  localConfirmResult(true)
}

const handleCancel = () => {
  localConfirmResult(false)
}

// Android 返回键监听器
let backButtonListener: any = null

// 监听确认对话框状态变化
watch(confirmVisible, (newVal: boolean) => {
  if (newVal) {
    lockBackgroundScroll()
  } else {
    // 延迟一点时间，检查是否还有其他弹窗打开
    setTimeout(() => {
      if (!hasOpenModal()) {
        unlockBackgroundScroll()
      }
    }, 100)
  }
})

// 监听深色模式切换，同步更新状态栏
watch(darkMode, async (newVal: boolean) => {
  await updateStatusBarStyle(newVal)
}, { immediate: false })

/**
 * 初始化状态栏样式
 */
const initStatusBar = async () => {
  try {
    const capacitor = (window as any).Capacitor
    if (capacitor && capacitor.isNativePlatform()) {
      // 设置状态栏透明，让 WebView 内容延伸到状态栏下方
      await StatusBar.setStyle({ style: StatusBarStyle.Dark })
      await StatusBar.setBackgroundColor({ color: store.darkMode ? '#1F2937' : '#F9FAFB' })
      await StatusBar.setOverlaysWebView({ overlay: true })
      console.log('状态栏初始化成功')
    }
  } catch (error) {
    console.error('初始化状态栏失败:', error)
  }
}

/**
 * 更新状态栏样式（根据深色/浅色模式）
 */
const updateStatusBarStyle = async (isDark: boolean) => {
  try {
    const capacitor = (window as any).Capacitor
    if (capacitor && capacitor.isNativePlatform()) {
      // 更新状态栏背景色
      await StatusBar.setBackgroundColor({ 
        color: isDark ? '#1F2937' : '#F9FAFB' 
      })
      
      // 更新状态栏图标颜色（深色模式用浅色图标，浅色模式用深色图标）
      await StatusBar.setStyle({ 
        style: isDark ? StatusBarStyle.Light : StatusBarStyle.Dark 
      })
      
      console.log('状态栏样式已更新:', isDark ? '深色' : '浅色')
    }
  } catch (error) {
    console.error('更新状态栏样式失败:', error)
  }
}

onMounted(async () => {
  // 初始化默认数据
  store.initDefaultData()
  
  // 立即应用深色模式到 html 和 body
  if (store.darkMode) {
    document.documentElement.classList.add('dark')
    document.documentElement.style.backgroundColor = 'var(--dark-bg)'
    document.body.style.backgroundColor = 'var(--dark-bg)'
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.backgroundColor = 'var(--bg-color)'
    document.body.style.backgroundColor = 'var(--bg-color)'
  }
  
  // 初始化状态栏样式
  await initStatusBar()
  
  // 监听 Android 物理返回键
  const capacitor = (window as any).Capacitor
  if (capacitor && capacitor.isNativePlatform()) {
    backButtonListener = App.addListener('backButton', (data: { canGoBack: boolean }) => {
      // 如果有弹窗，先关闭弹窗
      if (hasOpenModal()) {
        // 关闭确认对话框
        if (confirmVisible.value) {
          confirmResult(false)
          return
        }
        
        // 关闭其他弹窗
        const closeEvents = document.querySelectorAll('.modal-overlay')
        closeEvents.forEach(overlay => {
          (overlay as HTMLElement).click()
        })
        return
      }
      
      // 如果在子页面（非主页面），返回上一级
      const mainRoutes = ['/', '/index', '/stats', '/record', '/exchange', '/mine']
      if (!mainRoutes.includes(route.path)) {
        router.back()
      } else {
        // 在主页面，双击退出
        if (data.canGoBack) {
          router.back()
        } else {
          // 提示用户再次按返回键退出
          App.exitApp()
        }
      }
    })
  }
})

onUnmounted(() => {
  // 清理返回键监听器
  if (backButtonListener) {
    backButtonListener.remove()
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  /* 确保内容延伸到状态栏区域 */
  position: relative;
  
  /* 深色模式背景色由 main.scss 统一控制 */
}
</style>
