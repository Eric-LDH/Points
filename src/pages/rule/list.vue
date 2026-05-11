<template>
  <div class="rule-list-page">
    <!-- 头部导航 -->
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="$router.back()">
        ←
      </button>
      <h1 class="page-title">积分规则管理</h1>
      <button class="btn btn--primary btn--sm" @click="addNewRule">
        ✚ 新增
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <input 
        type="text" 
        v-model="searchText"
        class="input"
        placeholder="🔍 搜索规则..."
      />
    </div>

    <!-- 分类筛选 -->
    <div class="category-filter">
      <div 
        class="filter-tab"
        :class="{ active: selectedCategory === 'all' }"
        @click="selectedCategory = 'all'"
      >
        全部
      </div>
      <div 
        v-for="cat in categories" 
        :key="cat"
        class="filter-tab"
        :class="{ active: selectedCategory === cat }"
        @click="selectedCategory = cat"
      >
        {{ cat }}
      </div>
    </div>

    <!-- 奖励规则列表 -->
    <div class="section">
      <h2 class="section-title"><span class="section-title__dot" />🏷️ 奖励规则 ({{ rewardRules.length }}项)</h2>
      <div v-if="rewardRules.length === 0" class="empty-state">
        <span class="empty-state__emoji">📝</span>
        <p>暂无奖励规则</p>
      </div>
      <div v-else class="rules-list">
        <div 
          v-for="rule in rewardRules" 
          :key="rule.id"
          class="rule-card glass-card"
        >
          <div class="rule-card__header">
            <div class="rule-card__left">
              <span class="rule-card__icon">{{ rule.icon }}</span>
              <div>
                <div class="rule-card__name">{{ rule.name }}</div>
                <div class="rule-card__meta">
                  <span class="category-tag">{{ rule.category }}</span>
                  <span class="points-tag positive">+{{ rule.points }}分</span>
                </div>
              </div>
            </div>
            <div class="rule-card__actions">
              <button 
                class="icon-btn"
                :class="{ active: rule.enabled }"
                @click="toggleRule(rule)"
              >
                {{ rule.enabled ? '✓' : '○' }}
              </button>
              <button class="icon-btn" @click="editRule(rule)">✎</button>
              <button class="icon-btn danger" @click="deleteRule(rule)">🗑</button>
            </div>
          </div>
          <div v-if="rule.description" class="rule-card__desc">
            {{ rule.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- 惩罚规则列表 -->
    <div class="section">
      <h2 class="section-title"><span class="section-title__dot" />⚠️ 惩罚规则 ({{ penaltyRules.length }}项)</h2>
      <div v-if="penaltyRules.length === 0" class="empty-state">
        <span class="empty-state__emoji">✅</span>
        <p>暂无惩罚规则</p>
      </div>
      <div v-else class="rules-list">
        <div 
          v-for="rule in penaltyRules" 
          :key="rule.id"
          class="rule-card glass-card"
        >
          <div class="rule-card__header">
            <div class="rule-card__left">
              <span class="rule-card__icon">{{ rule.icon }}</span>
              <div>
                <div class="rule-card__name">{{ rule.name }}</div>
                <div class="rule-card__meta">
                  <span class="category-tag">{{ rule.category }}</span>
                  <span class="points-tag negative">{{ rule.points }}分</span>
                </div>
              </div>
            </div>
            <div class="rule-card__actions">
              <button 
                class="icon-btn"
                :class="{ active: rule.enabled }"
                @click="toggleRule(rule)"
              >
                {{ rule.enabled ? '✓' : '○' }}
              </button>
              <button class="icon-btn" @click="editRule(rule)">✎</button>
              <button class="icon-btn danger" @click="deleteRule(rule)">🗑</button>
            </div>
          </div>
          <div v-if="rule.description" class="rule-card__desc">
            {{ rule.description }}
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
import type { Rule } from '@/types'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'

const store = useAppStore()
const router = useRouter()

const searchText = ref('')
const selectedCategory = ref<string>('all')

const categories = ['家务', '生活习惯', '学习习惯', '加分项', '惩罚']

// 页面挂载时滚动到顶部
onMounted(() => {
  window.scrollTo(0, 0)
})

const filteredRules = computed(() => {
  let rules = store.rules
  
  // 搜索过滤
  if (searchText.value) {
    rules = rules.filter(r => r.name.includes(searchText.value))
  }
  
  // 分类过滤
  if (selectedCategory.value !== 'all') {
    rules = rules.filter(r => r.category === selectedCategory.value)
  }
  
  return rules
})

const rewardRules = computed(() => {
  return filteredRules.value.filter(r => r.type === 'reward')
})

const penaltyRules = computed(() => {
  return filteredRules.value.filter(r => r.type === 'penalty')
})

const addNewRule = () => {
  router.push('/rule/edit')
}

const editRule = (rule: Rule) => {
  router.push(`/rule/edit?id=${rule.id}`)
}

const toggleRule = (rule: Rule) => {
  store.updateRule(rule.id, { enabled: !rule.enabled })
}

const deleteRule = async (rule: Rule) => {
  const confirmed = await showConfirm({
    title: '确认删除',
    message: `确认删除"${rule.name}"？\n此操作不可恢复！`,
    type: 'danger'
  })
  
  if (confirmed) {
    store.deleteRule(rule.id)
    showToast({ message: '删除成功', type: 'success' })
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.rule-list-page {
  // 添加顶部安全区域，避免内容被状态栏遮挡
  padding-top: calc(var(--spacing-lg) + env(safe-area-inset-top, 0px));
  max-width: 480px;
  margin: 0 auto;
  animation: fade-in 0.5s ease;
  
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
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

.category-filter {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
}

.filter-tab {
  padding: 8px 16px;
  background: var(--card-bg);
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
  
  &.active {
    background: var(--primary-color);
    color: white;
  }
}

.section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 18px;
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

.rules-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.rule-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow);
  content-visibility: auto;
  contain: paint layout style;
  contain-intrinsic-size: 80px;
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-sm);
  }
  
  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  &__icon {
    font-size: 36px;
  }
  
  &__name {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
  }
  
  &__meta {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }
  
  &__desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: var(--spacing-sm);
  }
  
  &__actions {
    display: flex;
    gap: var(--spacing-xs);
  }
}

.category-tag {
  padding: 2px 8px;
  background: var(--bg-color);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-secondary);
}

.points-tag {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  
  &.positive {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
  }
  
  &.negative {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger-color);
  }
}

.actions {
  display: flex;
  gap: var(--spacing-sm);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s ease, color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  
  &.active {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
  }
  
}

.glass-card {
  @include glass-card;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>