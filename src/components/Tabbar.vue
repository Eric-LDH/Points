<template>
  <div class="tabbar">
    <div 
      v-for="item in menuItems" 
      :key="item.path"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': isActive(item.path) }"
      @click="navigateTo(item.path)"
    >
      <div 
        class="tabbar__item__icon"
        :class="{ 'tabbar__item__icon--highlight': item.highlight }"
      >
        {{ item.icon }}
      </div>
      <span>{{ item.title }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const menuItems = [
  { path: '/index', icon: '🏠', title: '首页', highlight: false },
  { path: '/stats', icon: '📊', title: '统计', highlight: false },
  { path: '/exchange', icon: '🎁', title: '兑换', highlight: false },
  { path: '/mine', icon: '👤', title: '我的', highlight: false }
]

const isActive = (path: string) => {
  return route.path === path
}

const navigateTo = (path: string) => {
  // 切换页面时刷新数据
  store.refreshData()
  router.push(path)
}
</script>

<style scoped lang="scss">
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  padding: 8px 0;
  display: flex;
  justify-content: space-around;
  z-index: 1000;
  max-width: 480px;
  margin: 0 auto;
  
  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
    color: var(--text-secondary);
    
    &:hover {
      transform: translateY(-2px);
    }
    
    &:active {
      transform: scale(0.95);
    }
    
    &--active {
      color: var(--primary-color);
    }
    
    &__icon {
      font-size: 24px;
      
      &--highlight {
        font-size: 36px;
        filter: drop-shadow(0 2px 8px rgba(99, 102, 241, 0.4));
        animation: pulse 2s infinite;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
