<template>
  <div class="exchange-page">
    <h1 class="page-title">🎁 积分商城</h1>
    
    <!-- 当前积分 -->
    <div class="points-card card">
      <div class="points-card__header">
        <span class="points-card__emoji">💰</span>
        <div>
          <div class="points-card__label">当前积分</div>
          <div class="points-card__value">{{ totalPoints }}</div>
        </div>
      </div>
    </div>

    <!-- 热门兑换 -->
    <div v-if="hotItems.length > 0" class="section">
      <h2 class="section-title">🔥 热门兑换</h2>
      <div class="items-grid">
        <div 
          v-for="item in hotItems" 
          :key="item.id"
          class="item-card"
        >
          <div class="item-card__header">
            <span class="item-card__icon">{{ item.icon }}</span>
            <div class="item-card__cycle-badge" v-if="item.cycleType !== 'none'">
              {{ getCycleName(item.cycleType) }}{{ item.cycleLimit }}次
            </div>
          </div>
          <div class="item-card__name">{{ item.name }}</div>
          <div class="item-card__points">{{ item.points }}积分</div>
          <button 
            class="btn btn--primary btn--sm"
            :disabled="!canExchange(item)"
            @click="exchange(item)"
          >
            {{ getExchangeButtonText(item) }}
          </button>
        </div>
      </div>
    </div>

    <!-- 全部商品 -->
    <div class="section">
      <h2 class="section-title">📦 全部商品</h2>
      <div v-if="enabledRewardItems.length === 0" class="empty-state">
        <span class="empty-state__emoji">🎁</span>
        <p>暂无可兑换商品</p>
      </div>
      <div v-else class="items-list">
        <div 
          v-for="item in enabledRewardItems" 
          :key="item.id"
          class="item-row"
        >
          <div class="item-row__left">
            <span class="item-row__icon">{{ item.icon }}</span>
            <div>
              <div class="item-row__name">{{ item.name }}</div>
              <div class="item-row__desc">{{ item.description }}</div>
              <div v-if="item.cycleType !== 'none'" class="item-row__limit">
                {{ getCycleName(item.cycleType) }}限{{ item.cycleLimit }}次
              </div>
            </div>
          </div>
          <div class="item-row__right">
            <!-- <div class="item-row__points">{{ item.points }}</div> -->
            <button 
              class="btn btn--success btn--sm"
              :disabled="!canExchange(item)"
              @click="exchange(item)"
            >
              {{ item.points }}分兑换
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 兑换记录入口 -->
    <div class="section">
      <button class="btn btn--outline btn--full" @click="showRecords = true">
        📝 查看兑换记录
      </button>
    </div>

    <!-- 兑换记录弹窗 -->
    <div v-if="showRecords" class="modal-overlay" @click="showRecords = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">📝 兑换记录</h3>
        <div class="modal-content">
          <div v-if="exchangeRecords.length === 0" class="empty-record">
            暂无兑换记录
          </div>
          <div v-else class="records-list">
            <div 
              v-for="record in exchangeRecords" 
              :key="record.id"
              class="record-item"
            >
              <div class="record-item__left">
                <span class="record-item__icon">{{ record.itemIcon }}</span>
                <div>
                  <div class="record-item__name">{{ record.itemName }}</div>
                  <div class="record-item__date">{{ formatDate(record.exchangeDate) }}</div>
                  <div v-if="record.cycleType !== 'none'" class="record-item__cycle">
                    {{ getCycleName(record.cycleType) }}已兑：{{ getUsedCount(record) }}/{{ record.cycleLimit }}次
                  </div>
                </div>
              </div>
              <div class="record-item__points">-{{ record.totalPoints }}</div>
            </div>
          </div>
        </div>
        <button class="btn btn--outline modal-close" @click="showRecords = false">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores'
import { CycleLimiter } from '@/utils/cycleLimiter'
import type { RewardItem, ExchangeRecord } from '@/types'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'
import { useModalLock } from '@/composables/useModalLock'

const store = useAppStore()

const showRecords = ref(false)

// 注册弹窗到全局管理器
useModalLock(showRecords)

const totalPoints = computed(() => store.totalPoints)
const enabledRewardItems = computed(() => store.enabledRewardItems)
const exchangeRecords = computed(() => store.exchangeRecords)

// 页面挂载时滚动到顶部
onMounted(() => {
  window.scrollTo(0, 0)
})

const hotItems = computed(() => {
  // 简单逻辑：取前 4 个启用的商品
  return enabledRewardItems.value.slice(0, 4)
})

const canExchange = (item: RewardItem) => {
  if (!store.currentChildId) return false
  if (totalPoints.value < item.points) return false
  
  const result = CycleLimiter.canExchange(
    item,
    exchangeRecords.value,
    store.currentChildId
  )
  
  return result.canExchange
}

const getExchangeButtonText = (item: RewardItem) => {
  if (totalPoints.value < item.points) {
    return '积分不足'
  }
  
  if (!store.currentChildId) return '兑换'
  
  const result = CycleLimiter.canExchange(
    item,
    exchangeRecords.value,
    store.currentChildId
  )
  
  if (!result.canExchange) {
    return result.message
  }
  
  return `兑换 (${result.remaining}次)`
}

const getCycleName = (cycleType: string) => {
  return CycleLimiter.getCycleName(cycleType)
}

const exchange = async (item: RewardItem) => {
  if (!store.currentChildId) {
    showToast({ message: '请先选择孩子', type: 'warning' })
    return
  }
  
  const result = CycleLimiter.canExchange(
    item,
    exchangeRecords.value,
    store.currentChildId
  )
  
  if (!result.canExchange) {
    showToast({ message: result.message, type: 'warning' })
    return
  }
  
  const confirmed = await showConfirm({
    title: '兑换确认',
    message: `确认兑换"${item.name}"？\n消耗${item.points}积分`,
    confirmText: '确定',
    cancelText: '取消'
  })
  
  if (confirmed) {
    const record: Omit<ExchangeRecord, 'id'> = {
      itemId: item.id,
      itemName: item.name,
      itemIcon: item.icon,
      points: item.points,
      quantity: 1,
      totalPoints: item.points,
      exchangeDate: new Date().toISOString(),
      cycleType: item.cycleType,
      cycleLimit: item.cycleLimit,
      status: 'pending',
      childId: store.currentChildId
    }
    
    store.addExchangeRecord(record)
    showToast({ message: '兑换成功！', type: 'success' })
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

const getUsedCount = (record: ExchangeRecord) => {
  // 简单实现，实际应该查询周期内的记录数
  return 1
}
</script>

<style scoped lang="scss">
.exchange-page {
  // 添加顶部安全区域，避免内容被状态栏遮挡
  padding: var(--spacing-lg);
  max-width: 480px;
  margin: 0 auto;
  background-color: var(--bg-color);
  min-height: 100vh;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: var(--spacing-xl);
  color: var(--text-primary);
}

.points-card {
  margin-bottom: var(--spacing-xl);
  
  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  &__emoji {
    font-size: 48px;
  }
  
  &__label {
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  &__value {
    font-size: 36px;
    font-weight: 700;
    color: var(--primary-color);
  }
}

.section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.item-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }
  
  &__icon {
    font-size: 36px;
  }
  
  &__cycle-badge {
    background: var(--warning-color);
    color: white;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    font-size: 11px;
  }
  
  &__name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
  }
  
  &__points {
    font-size: 18px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: var(--spacing-md);
  }
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  
  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
  }
  
  &__icon {
    font-size: 32px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  &__name {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
  }
  
  &__desc {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }
  
  &__limit {
    font-size: 11px;
    background: var(--warning-color);
    color: white;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    display: inline-block;
  }
  
  &__right {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-md);
    flex-shrink: 0;
  }
  
  &__points {
    font-size: 18px;
    font-weight: 700;
    color: var(--primary-color);
  }
}

.btn--sm {
  padding: 8px 16px;
  font-size: 14px;
}

.btn--full {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
  
  &__emoji {
    font-size: 48px;
    display: block;
    margin-bottom: var(--spacing-md);
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--spacing-lg);
}

.modal {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.modal-content {
  max-height: 60vh;
  overflow-y: auto;
  margin-bottom: var(--spacing-lg);
}

.empty-record {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-color);
  border-radius: var(--radius-md);
  
  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  &__icon {
    font-size: 28px;
  }
  
  &__name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
  }
  
  &__date {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  &__cycle {
    font-size: 11px;
    background: var(--warning-color);
    color: white;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    display: inline-block;
    margin-top: var(--spacing-xs);
  }
  
  &__points {
    font-size: 16px;
    font-weight: 700;
    color: var(--danger-color);
  }
}

.modal-close {
  width: 100%;
}
</style>
