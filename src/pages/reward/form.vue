<template>
  <div class="reward-form-page">
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="$router.back()">
        ←
      </button>
      <h1 class="page-title">{{ isEdit ? '编辑' : '新增' }}商品</h1>
      <button class="btn btn--primary btn--sm" @click="saveItem">
        ✓ 保存
      </button>
    </div>

    <div class="form">
      <div class="form-group">
        <label class="form-label">商品名称 *</label>
        <input 
          type="text" 
          v-model="formData.name"
          class="input"
          placeholder="例如：手机时间 30 分钟"
        />
      </div>

      <div class="form-group">
        <label class="form-label">所需积分 *</label>
        <input 
          type="number" 
          v-model.number="formData.points"
          class="input"
          placeholder="50"
        />
      </div>

      <div class="form-group">
        <label class="form-label">周期限制类型 *</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="formData.cycleType" value="none" />
            <span>无限制</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="formData.cycleType" value="weekly" />
            <span>每周</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="formData.cycleType" value="monthly" />
            <span>每月</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="formData.cycleType" value="yearly" />
            <span>每年</span>
          </label>
        </div>
      </div>

      <div v-if="formData.cycleType !== 'none'" class="form-group">
        <label class="form-label">周期内限制次数 *</label>
        <input 
          type="number" 
          v-model.number="formData.cycleLimit"
          class="input"
          :placeholder="getCyclePlaceholder()"
        />
      </div>

      <div class="form-group">
        <label class="form-label">图标</label>
        <div class="icon-selector">
          <div class="icon-selector__preview">
            <span class="icon-preview__icon">{{ formData.icon || '🎁' }}</span>
          </div>
          <div class="icon-selector__grid">
            <span 
              v-for="icon in icons" 
              :key="icon"
              class="icon-option"
              :class="{ selected: formData.icon === icon }"
              @click="formData.icon = icon"
            >
              {{ icon }}
            </span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">商品描述</label>
        <textarea 
          v-model="formData.description"
          class="input"
          rows="3"
          placeholder="详细描述..."
        ></textarea>
      </div>

      <div class="form-group">
        <label class="switch-label">
          <span>启用状态</span>
          <div class="switch" :class="{ active: formData.enabled }" @click="formData.enabled = !formData.enabled">
            <div class="switch__knob"></div>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import type { RewardItem } from '@/types'
import { showToast } from '@/utils/toast'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const itemId = computed(() => route.query.id as string | undefined)
const isEdit = computed(() => !!itemId.value)

const editingItem = computed(() => {
  if (!isEdit.value || !itemId.value) return null
  return store.rewardItems.find(r => r.id === itemId.value) || null
})

const formData = ref({
  name: '',
  points: 50,
  icon: '🎁',
  description: '',
  cycleType: 'weekly' as RewardItem['cycleType'],
  cycleLimit: 2,
  enabled: true,
  sortOrder: 999
})

const icons = ['🎁', '📱', '📺', '🥤', '🍿', '🎮', '🎬', '✈️', '🧸', '📚', '🏀', '🎨']

const getCyclePlaceholder = () => {
  const placeholders: Record<string, string> = {
    weekly: '2 次/周',
    monthly: '5 次/月',
    yearly: '1 次/年'
  }
  return placeholders[formData.value.cycleType] || ''
}

onMounted(() => {
  // 滚动到页面顶部
  window.scrollTo(0, 0)
  
  console.log('RewardForm mounted', {
    isEdit: isEdit.value,
    itemId: itemId.value,
    itemsCount: store.rewardItems.length
  })
  
  if (isEdit.value && editingItem.value) {
    const item = editingItem.value
    console.log('Loading item for edit:', item)
    formData.value = {
      name: item.name,
      points: item.points,
      icon: item.icon,
      description: item.description,
      cycleType: item.cycleType,
      cycleLimit: item.cycleLimit,
      enabled: item.enabled,
      sortOrder: item.sortOrder
    }
  } else if (isEdit.value && !editingItem.value) {
    console.warn('Edit mode but item not found:', itemId.value)
    showToast({ message: '未找到该商品，请确认商品是否存在', type: 'error' })
    router.back()
  }
})

const saveItem = () => {
  // 基础验证
  if (!formData.value.name?.trim()) {
    showToast({ message: '请填写商品名称', type: 'warning' })
    return
  }

  if (formData.value.points <= 0) {
    showToast({ message: '积分值必须大于 0', type: 'warning' })
    return
  }

  if (formData.value.cycleType !== 'none' && (!formData.value.cycleLimit || formData.value.cycleLimit <= 0)) {
    showToast({ message: '请设置有效的周期限制次数', type: 'warning' })
    return
  }

  try {
    // 验证通过，执行保存操作
    if (isEdit.value && editingItem.value) {
      // 更新现有商品
      store.updateRewardItem(editingItem.value.id, formData.value)
      console.log('Item updated:', editingItem.value.id)
    } else {
      // 新增商品
      const newItem = store.addRewardItem(formData.value)
      console.log('Item created:', newItem.id)
    }

    showToast({ message: '保存成功！', type: 'success' })
    setTimeout(() => {
      router.back()
    }, 500)
  } catch (error: any) {
    console.error('保存失败:', error)
    const errorMessage = error.message || '保存失败，请重试'
    showToast({ message: errorMessage, type: 'error' })
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/main.scss';

.reward-form-page {
  // 添加顶部安全区域，避免内容被状态栏遮挡
  padding-top: calc(var(--spacing-lg) + env(safe-area-inset-top, 0px));
  max-width: 480px;
  margin: 0 auto;
  animation: fade-in 0.5s ease;
  background-color: var(--bg-color);
  min-height: 100vh;
  
  > *:not(.header) {
    padding-left: var(--spacing-lg);
    padding-right: var(--spacing-lg);
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 16px;
  background: var(--card-bg);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: 14px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-md);
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  color: var(--text-primary);
  
  &:has(input:checked) {
    background: var(--primary-color);
    color: white;
  }
}

.icon-selector {
  &__preview {
    text-align: center;
    padding: var(--spacing-md);
    background: var(--card-bg);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
  }
  
  &__grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: var(--spacing-sm);
  }
}

.icon-option {
  font-size: 28px;
  padding: var(--spacing-sm);
  text-align: center;
  background: var(--card-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  
  &.selected {
    background: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
  }
}

.switch-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch {
  width: 50px;
  height: 28px;
  background: var(--border-color);
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;
  
  &.active {
    background: var(--primary-color);
  }
  
  &__knob {
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: left 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &.active .switch__knob {
    left: 24px;
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
