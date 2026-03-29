<template>
  <div class="reward-list-page">
    <!-- 头部导航 -->
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="$router.back()">
        ←
      </button>
      <h1 class="page-title">兑换商品管理</h1>
      <button class="btn btn--primary btn--sm" @click="addNewItem">
        ✚ 新增
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <input 
        type="text" 
        v-model="searchText"
        class="input"
        placeholder="🔍 搜索商品..."
      />
    </div>

    <!-- 筛选选项 -->
    <div class="filter-bar">
      <div 
        class="filter-chip"
        :class="{ active: filterType === 'all' }"
        @click="filterType = 'all'"
      >
        全部
      </div>
      <div 
        class="filter-chip"
        :class="{ active: filterType === 'available' }"
        @click="filterType = 'available'"
      >
        ✅ 启用
      </div>
      <div 
        class="filter-chip"
        :class="{ active: filterType === 'disabled' }"
        @click="filterType = 'disabled'"
      >
        ⏸️ 禁用
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="section">
      <h2 class="section-title">🎁 兑换商品 ({{ filteredItems.length }}项)</h2>
      
      <div v-if="filteredItems.length === 0" class="empty-state">
        <span class="empty-state__emoji">🛍️</span>
        <p>暂无兑换商品</p>
        <button class="btn btn--primary btn--sm" @click="addNewItem">
          ✚ 添加第一个商品
        </button>
      </div>

      <div v-else class="items-list">
        <div 
          v-for="item in filteredItems" 
          :key="item.id"
          class="item-card"
        >
          <div class="item-card__header">
            <div class="item-card__left">
              <span class="item-card__icon">{{ item.icon || '🎁' }}</span>
              <div>
                <div class="item-card__name">{{ item.name }}</div>
                <div class="item-card__meta">
                  <span class="points-tag">{{ item.points }}积分</span>
                  <span v-if="item.cycleType !== 'none'" class="cycle-tag">
                    {{ getCycleLabel(item.cycleType) }}{{ item.cycleLimit }}次
                  </span>
                </div>
              </div>
            </div>
            <div class="item-card__actions">
              <button 
                class="icon-btn"
                :class="{ active: item.enabled }"
                @click="toggleItem(item)"
              >
                {{ item.enabled ? '✓' : '○' }}
              </button>
              <button class="icon-btn" @click="editItem(item)">✎</button>
              <button class="icon-btn danger" @click="deleteItem(item)">🗑</button>
            </div>
          </div>
          
          <div v-if="item.description" class="item-card__desc">
            {{ item.description }}
          </div>
          
          <div class="item-card__footer">
            <span class="item-card__label">兑换记录：</span>
            <span class="item-card__value">{{ getExchangeCount(item.id) }}次</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import type { RewardItem } from '@/types'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'

const router = useRouter()
const store = useAppStore()

const searchText = ref('')
const filterType = ref<'all' | 'available' | 'disabled'>('all')

// 页面挂载时滚动到顶部
onMounted(() => {
  window.scrollTo(0, 0)
})

const filteredItems = computed(() => {
  let items = store.rewardItems
  
  // 搜索过滤
  if (searchText.value) {
    items = items.filter(i => i.name.includes(searchText.value))
  }
  
  // 状态过滤
  if (filterType.value === 'available') {
    return items.filter(i => i.enabled)
  } else if (filterType.value === 'disabled') {
    return items.filter(i => !i.enabled)
  }
  
  return items
})

const addNewItem = () => {
  router.push('/reward/form')
}

const editItem = (item: RewardItem) => {
  router.push(`/reward/form?id=${item.id}`)
}

const toggleItem = (item: RewardItem) => {
  store.updateRewardItem(item.id, { enabled: !item.enabled })
}

const deleteItem = async (item: RewardItem) => {
  const confirmed = await showConfirm({
    title: '确认删除',
    message: `确认删除"${item.name}"？\n此操作不可恢复！`,
    type: 'danger'
  })
  
  if (confirmed) {
    store.deleteRewardItem(item.id)
    showToast({ message: '删除成功', type: 'success' })
  }
}

const getCycleLabel = (cycleType: string) => {
  const labels: Record<string, string> = {
    weekly: '每周',
    monthly: '每月',
    yearly: '每年'
  }
  return labels[cycleType] || ''
}

const getExchangeCount = (itemId: string) => {
  return store.exchangeRecords.filter(r => r.itemId === itemId).length
}
</script>

<style scoped lang="scss">
.reward-list-page {
  // 头部固定高度 + 状态栏安全区域
  padding-top: calc(80px + env(safe-area-inset-top, 0px));
  max-width: 480px;
  margin: 0 auto;
  
  > *:not(.header) {
    padding-left: var(--spacing-lg);
    padding-right: var(--spacing-lg);
  }
}

.search-box {
  margin-bottom: var(--spacing-lg);
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

.filter-bar {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.filter-chip {
  padding: 6px 16px;
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
}

.section {
  .section-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: var(--spacing-md);
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  
  &__emoji {
    font-size: 64px;
    display: block;
    margin-bottom: var(--spacing-md);
  }
  
  p {
    font-size: 16px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
  }
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.item-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: var(--shadow-lg);
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
  }
  
  &__left {
    display: flex;
    gap: var(--spacing-md);
    flex: 1;
  }
  
  &__icon {
    font-size: 42px;
    flex-shrink: 0;
  }
  
  &__name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
  }
  
  &__meta {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
    flex-wrap: wrap;
  }
  
  &__desc {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-md);
    line-height: 1.5;
  }
  
  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color);
    font-size: 13px;
    
    &__label {
      color: var(--text-secondary);
    }
    
    &__value {
      font-weight: 500;
      color: var(--text-primary);
    }
  }
  
  &__actions {
    display: flex;
    gap: var(--spacing-xs);
  }
}

.points-tag {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.cycle-tag {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--bg-color);
  }
  
  &.active {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
  }
  
  &.danger:hover {
    background: rgba(239, 68, 68, 0.1);
  }
}
</style>
