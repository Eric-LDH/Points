<template>
  <div class="app-container" :class="{ dark: darkMode }">
    <router-view v-slot="{ Component, route: viewRoute }">
      <Transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="viewRoute.path" />
      </Transition>
    </router-view>
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
import { computed, onMounted, onUnmounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import Tabbar from '@/components/Tabbar.vue'
import Toast from '@/components/Toast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useToast } from '@/utils/toast'
import { useConfirm } from '@/utils/confirm'
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
const { confirmVisible, confirmTitle, confirmMessage, confirmType, showConfirm, confirmResult } = useConfirm()

const showTabbar = computed(() => {
  const mainRoutes = ['/', '/index', '/stats', '/lucky', '/exchange', '/mine']
  return mainRoutes.includes(route.path)
})

const handleConfirm = () => {
  confirmResult(true)
}

const handleCancel = () => {
  confirmResult(false)
}

// 页面转场动画控制
const transitionName = ref('slide-left')
const historyStack = ref<string[]>(['/'])

watch(() => route.path, (newPath, oldPath) => {
  if (oldPath) {
    const tabRoutes = ['/index', '/stats', '/lucky', '/exchange', '/mine']
    const newIsTab = tabRoutes.includes(newPath)
    const oldIsTab = tabRoutes.includes(oldPath)
    
    if (newIsTab && oldIsTab) {
      // Tab 切换 - 使用淡入淡出
      transitionName.value = 'fade'
    } else {
      // 判断是前进还是后退
      const historyIndex = historyStack.value.indexOf(newPath)
      if (historyIndex === -1 || historyIndex < historyStack.value.length - 1) {
        transitionName.value = 'slide-left'
      } else {
        transitionName.value = 'slide-right'
      }
    }
  }
  // 更新历史栈
  historyStack.value = historyStack.value.filter(p => p !== newPath)
  historyStack.value.push(newPath)
  if (historyStack.value.length > 10) {
    historyStack.value.shift()
  }
})

// Android 返回键监听器
let backButtonListener: any = null

// 监听确认对话框状态变化
watch(confirmVisible, (newVal: boolean) => {
  if (newVal) {
    lockBackgroundScroll()
  } else {
    setTimeout(() => {
      if (!hasOpenModal()) {
        unlockBackgroundScroll()
      }
    }, 100)
  }
})

/**
 * 更新状态栏样式
 */
const updateStatusBarStyle = async (isDark: boolean) => {
  try {
    const capacitor = (window as any).Capacitor
    if (capacitor && capacitor.isNativePlatform()) {
      await StatusBar.setBackgroundColor({ 
        color: isDark ? '#0F172A' : '#EEF2FF' 
      })
      await StatusBar.setStyle({ 
        style: isDark ? StatusBarStyle.Light : StatusBarStyle.Dark 
      })
    }
  } catch (error) {
    console.error('更新状态栏样式失败:', error)
  }
}

watch(darkMode, async (newVal: boolean) => {
  await updateStatusBarStyle(newVal)
}, { immediate: true })

const initStatusBar = async () => {
  try {
    const capacitor = (window as any).Capacitor
    if (capacitor && capacitor.isNativePlatform()) {
      await StatusBar.setOverlaysWebView({ overlay: true })
      const isDark = darkMode.value
      await StatusBar.setBackgroundColor({ 
        color: isDark ? '#0F172A' : '#EEF2FF' 
      })
      await StatusBar.setStyle({ 
        style: isDark ? StatusBarStyle.Light : StatusBarStyle.Dark 
      })
    }
  } catch (error) {
    console.error('初始化状态栏失败:', error)
  }
}

onMounted(async () => {
  store.initDefaultData()
  
  if (store.darkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  
  await initStatusBar()
  
  const capacitor = (window as any).Capacitor
  if (capacitor && capacitor.isNativePlatform()) {
    backButtonListener = App.addListener('backButton', (data: { canGoBack: boolean }) => {
      if (hasOpenModal()) {
        if (confirmVisible.value) {
          confirmResult(false)
          return
        }
        const closeEvents = document.querySelectorAll('.modal-overlay')
        closeEvents.forEach(overlay => {
          (overlay as HTMLElement).click()
        })
        return
      }
      
      const mainRoutes = ['/', '/index', '/stats', '/lucky', '/exchange', '/mine']
      if (!mainRoutes.includes(route.path)) {
        router.back()
      } else {
        if (data.canGoBack) {
          router.back()
        } else {
          App.exitApp()
        }
      }
    })
  }
})

onUnmounted(() => {
  if (backButtonListener) {
    backButtonListener.remove()
  }
})
</script>

<style scoped>
.app-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: transparent;
  position: relative;
  padding-bottom: 80px;
  overflow-x: hidden;
}
</style>
