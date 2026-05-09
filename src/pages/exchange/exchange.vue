<template>
  <div class="exchange-page">
    <div class="page-header-section">
      <h1 class="page-title">积分商城</h1>
      <p class="page-subtitle">用积分兑换心仪好物</p>
    </div>
    
    <!-- 当前积分卡片 -->
    <div class="points-card glass-card">
      <div class="points-card__bg" />
      <div class="points-card__content">
        <div class="points-card__icon">
          <IconFont name="gift" :size="32" color="#fff" />
        </div>
        <div>
          <div class="points-card__label">当前积分</div>
          <div class="points-card__value">{{ totalPoints }}</div>
        </div>
      </div>
    </div>

    <!-- 热门兑换 -->
    <div v-if="hotItems.length > 0" class="section">
      <h2 class="section-title">
        <span class="section-title__dot" />
        热门兑换
      </h2>
      <div class="items-grid">
        <div 
          v-for="item in hotItems" 
          :key="`hot-${item.id}`"
          class="item-card glass-card"
        >
          <div class="item-card__badge" v-if="item.cycleType !== 'none'">
            {{ getCycleName(item.cycleType) }}{{ item.cycleLimit }}次
          </div>
          <div class="item-card__icon">{{ item.icon }}</div>
          <div class="item-card__name">{{ item.name }}</div>
          <div class="item-card__points">{{ item.points }} 积分</div>
          <button 
            class="btn btn--primary btn--sm item-card__btn"
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
      <h2 class="section-title">
        <span class="section-title__dot" />
        全部商品
      </h2>
      <div v-if="enabledRewardItems.length === 0" class="empty-state glass-card">
        <div class="empty-state__icon">🎁</div>
        <p>暂无可兑换商品</p>
      </div>
      <div v-else class="items-list">
        <div 
          v-for="item in enabledRewardItems" 
          :key="`list-${item.id}`"
          class="item-row glass-card"
        >
          <div class="item-row__left">
            <span class="item-row__icon">{{ item.icon }}</span>
            <div>
              <div class="item-row__name">{{ item.name }}</div>
              <div class="item-row__desc">{{ item.description }}</div>
              <div v-if="item.cycleType !== 'none'" class="item-row__limit">
                限{{ getCycleName(item.cycleType) }}{{ item.cycleLimit }}次
              </div>
            </div>
          </div>
          <div class="item-row__right">
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

    <!-- 查看兑换记录 -->
    <div class="section">
      <button class="btn btn--outline btn--full" @click="showRecords = true">
        <IconFont name="history" :size="16" />
        查看兑换记录
      </button>
    </div>

    <!-- 兑换记录弹窗 -->
    <div v-if="showRecords" class="modal-overlay" @click="showRecords = false">
      <div class="modal glass-modal" @click.stop>
        <div class="modal__header">
          <h3 class="modal__title">兑换记录</h3>
          <button class="modal__close" @click="showRecords = false">
            <IconFont name="close" :size="20" />
          </button>
        </div>
        <div class="modal__body">
          <div v-if="exchangeRecords.length === 0" class="empty-record">
            暂无兑换记录
          </div>
          <div v-else class="records-list">
            <div 
              v-for="record in exchangeRecords" 
              :key="record.id"
              class="record-item glass-card"
            >
              <div class="record-item__left">
                <span class="record-item__icon">{{ record.itemIcon }}</span>
                <div>
                  <div class="record-item__name">{{ record.itemName }}</div>
                  <div class="record-item__meta">
                    <span class="record-item__date">
                      <IconFont name="calendar" :size="10" color="var(--text-muted)" />
                      {{ formatDate(record.exchangeDate) }}
                    </span>
                    <span v-if="record.cycleType !== 'none'" class="record-item__cycle">
                      已兑{{ getUsedCount(record) }}/{{ record.cycleLimit }}次
                    </span>
                  </div>
                </div>
              </div>
              <div class="record-item__right">
                <div class="record-item__points">-{{ record.totalPoints }}</div>
                <button 
                  v-if="record.status === 'pending'"
                  class="record-item__cancel"
                  @click="cancelExchange(record)"
                >
                  <IconFont name="close" :size="12" color="var(--danger-color)" />
                </button>
              </div>
            </div>
          </div>
        </div>
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
import { Storage } from '@/utils/storage'
import IconFont from '@/components/IconFont.vue'

const store = useAppStore()
const showRecords = ref(false)
useModalLock(showRecords)

const totalPoints = computed(() => store.totalPoints)
const enabledRewardItems = computed(() => store.enabledRewardItems)
const exchangeRecords = computed(() => store.exchangeRecords)

onMounted(() => { window.scrollTo(0, 0) })

const hotItems = computed(() => {
  const items = enabledRewardItems.value
  if (exchangeRecords.value.length === 0) return items.slice(0, 4)
  const countMap = new Map<string, number>()
  exchangeRecords.value.forEach(r => countMap.set(r.itemId, (countMap.get(r.itemId) || 0) + 1))
  const withExchanges = items.filter(i => countMap.has(i.id))
    .sort((a, b) => (countMap.get(b.id) || 0) - (countMap.get(a.id) || 0))
  if (withExchanges.length >= 4) return withExchanges.slice(0, 4)
  const withoutExchanges = items.filter(i => !countMap.has(i.id))
  return [...withExchanges, ...withoutExchanges.slice(0, 4 - withExchanges.length)]
})

const canExchange = (item: RewardItem) => {
  if (!store.currentChildId || totalPoints.value < item.points) return false
  return CycleLimiter.canExchange(item, exchangeRecords.value, store.currentChildId).canExchange
}

const getExchangeButtonText = (item: RewardItem) => {
  if (totalPoints.value < item.points) return '积分不足'
  const usedCount = exchangeRecords.value.filter(r => r.itemId === item.id && r.childId === store.currentChildId).length
  return `兑换 (已兑${usedCount}次)`
}

const getCycleName = (cycleType: string) => CycleLimiter.getCycleName(cycleType)

const exchange = async (item: RewardItem) => {
  if (!store.currentChildId) { showToast({ message: '请先选择孩子', type: 'warning' }); return }
  const result = CycleLimiter.canExchange(item, exchangeRecords.value, store.currentChildId)
  if (!result.canExchange) { showToast({ message: result.message, type: 'warning' }); return }
  const confirmed = await showConfirm({ title: '兑换确认', message: `确认兑换"${item.name}"？\n消耗${item.points}积分` })
  if (confirmed) {
    store.addExchangeRecord({
      itemId: item.id, itemName: item.name, itemIcon: item.icon,
      points: item.points, quantity: 1, totalPoints: item.points,
      exchangeDate: new Date().toISOString(), cycleType: item.cycleType,
      cycleLimit: item.cycleLimit, status: 'pending' as const, childId: store.currentChildId
    })
    showToast({ message: '兑换成功！', type: 'success' })
  }
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const getUsedCount = (record: ExchangeRecord) => {
  const result = CycleLimiter.canExchange({
    id: record.itemId, name: record.itemName, points: record.points,
    icon: record.itemIcon, description: '', cycleType: record.cycleType as any,
    cycleLimit: record.cycleLimit, enabled: true, sortOrder: 0,
    createdAt: '', updatedAt: ''
  }, exchangeRecords.value, record.childId || store.currentChildId || '')
  return result.used
}

const cancelExchange = async (record: ExchangeRecord) => {
  const confirmed = await showConfirm({ title: '取消兑换', message: `确定要取消"${record.itemName}"的兑换吗？\n将退还${record.totalPoints}积分` })
  if (confirmed) {
    store.exchangeRecords = store.exchangeRecords.filter(r => r.id !== record.id)
    Storage.exchangeRecords.delete(record.id)
    if (record.childId) {
      const child = store.children.find(c => c.id === record.childId)
      if (child) { child.currentPoints += record.totalPoints; Storage.children.update(child.id, child) }
    }
    showToast({ message: '已取消兑换并退还积分', type: 'success' })
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/main.scss';

.exchange-page {
  padding: var(--spacing-lg);
  padding-top: calc(var(--spacing-lg) + env(safe-area-inset-top, 0px));
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  animation: fade-in 0.5s ease;
}

.page-header-section {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 2px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  &__dot {
    width: 4px;
    height: 18px;
    background: linear-gradient(180deg, var(--primary-color), var(--primary-light));
    border-radius: 2px;
    flex-shrink: 0;
  }
}

// ===== 积分卡片 =====
.points-card {
  position: relative;
  overflow: hidden;
  margin-bottom: var(--spacing-xl);
  padding: 0;

  &__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    opacity: 0.9;
    border-radius: inherit;
  }

  &__content {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-xl);
    z-index: 1;
  }

  &__icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.15);
    border-radius: 50%;
    backdrop-filter: blur(8px);
    flex-shrink: 0;
  }

  &__label {
    font-size: 14px;
    color: rgba(255,255,255,0.7);
    margin-bottom: 2px;
  }

  &__value {
    font-size: 36px;
    font-weight: 700;
    color: #fff;
  }
}

// ===== 商品网格 =====
.items-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.item-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  position: relative;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &__badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: linear-gradient(135deg, var(--warning-color), #D97706);
    color: #fff;
    padding: 2px 8px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
  }

  &__icon {
    font-size: 40px;
    margin-bottom: var(--spacing-sm);
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
  }

  &__points {
    font-size: 18px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: var(--spacing-md);
  }

  &__btn {
    width: 100%;
  }
}

// ===== 商品列表 =====
.items-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);

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
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  &__desc {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 2px;
  }

  &__limit {
    font-size: 11px;
    color: var(--warning-color);
    font-weight: 500;
  }

  &__right {
    flex-shrink: 0;
  }
}

// ===== 弹窗 =====
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2000;
  padding: var(--spacing-lg);
  animation: fade-in 0.2s ease;

  .dark & { background: rgba(0, 0, 0, 0.6); }
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: 75vh;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  overflow: hidden;
  animation: slide-up-modal 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: 1px solid rgba(99, 102, 241, 0.08);
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
  }

  &__close {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: none;
    background: rgba(99, 102, 241, 0.08);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: background 0.2s, transform 0.2s;

  }

  &__body {
    padding: var(--spacing-md) var(--spacing-lg);
    max-height: calc(75vh - 60px);
    overflow-y: auto;
  }
}

.glass-modal {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.15);

  .dark &, html.dark &, .app-container.dark & {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.05);
  }
}

// ===== 兑换记录 =====
.empty-record {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  gap: var(--spacing-md);

  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
  }

  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
  }

  &__icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  &__date {
    font-size: 11px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__cycle {
    font-size: 10px;
    background: rgba(245, 158, 11, 0.1);
    color: var(--warning-color);
    padding: 1px 6px;
    border-radius: 6px;
    font-weight: 500;
  }

  &__points {
    font-size: 16px;
    font-weight: 700;
    color: var(--danger-color);
  }

  &__cancel {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(239, 68, 68, 0.2);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;

  }
}

// ===== 空状态 =====
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);

  &__icon {
    font-size: 48px;
    display: block;
    margin-bottom: var(--spacing-md);
  }

  p {
    font-size: 14px;
    color: var(--text-muted);
  }
}

// ===== 按钮 =====
.btn--full {
  width: 100%;
}

// ===== 工具类 =====
.glass-card {
  @include glass-card;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up-modal {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
