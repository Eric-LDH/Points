<template>
  <div class="tabbar">
    <div 
      v-for="item in menuItems" 
      :key="item.path"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': isActive(item.path) }"
      @click="navigateTo(item.path)"
    >
      <div class="tabbar__item__icon">
        <IconFont :name="item.icon" :size="22" />
      </div>
      <span>{{ item.title }}</span>
      <div v-if="isActive(item.path)" class="tabbar__item__indicator" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores'
import IconFont from '@/components/IconFont.vue'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const menuItems = [
  { path: '/index', icon: 'home' as const, title: '首页' },
  { path: '/stats', icon: 'chart' as const, title: '统计' },
  { path: '/lucky', icon: 'star' as const, title: '幸运' },
  { path: '/exchange', icon: 'gift' as const, title: '兑换' },
  { path: '/mine', icon: 'user' as const, title: '我的' }
]

const isActive = (path: string) => {
  return route.path === path
}

const navigateTo = (path: string) => {
  store.refreshData()
  router.push(path)
}
</script>

<style scoped lang="scss">
.tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  padding: 6px 0 calc(6px + env(safe-area-inset-bottom, 0px));
  display: flex;
  justify-content: space-around;
  z-index: 1000;
  
  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 11px;
    color: var(--text-secondary);
    padding: 4px 16px;
    border-radius: var(--radius-md);
    position: relative;
    
    &:active {
      transform: scale(0.92);
    }
    
    &--active {
      color: var(--primary-color);
      
      .tabbar__item__icon {
        transform: scale(1.15) translateY(-2px);
        filter: drop-shadow(0 2px 8px rgba(99, 102, 241, 0.4));
      }
    }
    
    &__icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: inherit;
    }
    
    &__indicator {
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 3px;
      background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
      border-radius: 2px;
      animation: indicator-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  }
}

@keyframes indicator-in {
  from {
    transform: translateX(-50%) scaleX(0);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) scaleX(1);
    opacity: 1;
  }
}
</style>
