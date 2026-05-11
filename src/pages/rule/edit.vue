<template>
  <div class="rule-edit-page">
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="$router.back()">
        ←
      </button>
      <h1 class="page-title">{{ isEdit ? '编辑' : '新增' }}规则</h1>
      <button class="btn btn--primary btn--sm" @click="saveRule">
        ✓ 保存
      </button>
    </div>

    <div class="form">
      <div class="form-group">
        <label class="form-label">规则名称 *</label>
        <input 
          type="text" 
          v-model="formData.name"
          class="input"
          placeholder="例如：晾衣服"
        />
      </div>

      <div class="form-group">
        <label class="form-label">分类 *</label>
        <select v-model="formData.category" class="input input--select">
          <option value="">请选择分类</option>
          <option v-if="formData.type === 'penalty'" value="惩罚" selected>惩罚</option>
          <template v-else>
            <option value="家务">家务</option>
            <option value="生活习惯">生活习惯</option>
            <option value="学习习惯">学习习惯</option>
            <option value="加分项">加分项</option>
            <option value="惩罚">惩罚</option>
          </template>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">类型 *</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="formData.type" value="reward" />
            <span>奖励</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="formData.type" value="penalty" />
            <span>惩罚</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">积分值 *</label>
        <input 
          type="number" 
          v-model.number="formData.points"
          class="input"
          :placeholder="formData.type === 'reward' ? '+2' : '-2'"
          :min="formData.type === 'penalty' ? -999 : 0"
          :max="formData.type === 'penalty' ? -1 : 999"
        />
        <div v-if="formData.type === 'penalty' && formData.points > 0" class="form-tip error">
          ⚠️ 惩罚规则的积分值必须为负数
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">图标</label>
        <div class="icon-selector">
          <div class="icon-selector__preview">
            <span class="icon-preview__icon">{{ formData.icon || '❓' }}</span>
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
        <label class="form-label">备注（选填）</label>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { IconGenerator } from '@/utils/iconGenerator'
import type { Rule } from '@/types'
import { showToast } from '@/utils/toast'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

// 确保路由参数安全处理
const ruleId = computed(() => route.query.id as string | undefined)
const isEdit = computed(() => !!ruleId.value)

// 查找正在编辑的规则
const editingRule = computed(() => {
  if (!isEdit.value || !ruleId.value) return null
  return store.rules.find(r => r.id === ruleId.value) || null
})

// 表单数据
const formData = ref({
  name: '' as string,
  category: '' as Rule['category'] | '',
  type: 'reward' as Rule['type'],
  points: 2,
  icon: '📋' as string,
  description: '' as string,
  enabled: true,
  sortOrder: 999
})

// 图标选项列表
const icons = ['📋', '🧹', '👕', '🍽️', '📚', '✏️', '⏰', '🛏️', '🚿', '🦷', '🏃', '🎨', '🎵', '💪', '⭐', '🎯', '✅', '❌', '⚠️', '🔥']

// 监听类型变化，自动设置默认分类
watch(() => formData.value.type, (newType) => {
  if (newType === 'penalty') {
    formData.value.category = '惩罚'
  } else if (formData.value.category === '惩罚') {
    // 如果从惩罚切换到奖励，清空分类让用户重新选择
    formData.value.category = ''
  }
}, { immediate: true })

// 页面挂载时滚动到顶部并初始化数据
onMounted(() => {
  // 滚动到页面顶部
  window.scrollTo(0, 0)
  
  console.log('RuleEdit mounted', {
    isEdit: isEdit.value,
    ruleId: ruleId.value,
    rulesCount: store.rules.length
  })
  
  // 如果是编辑模式，加载现有数据
  if (isEdit.value && editingRule.value) {
    const rule = editingRule.value
    console.log('Loading rule for edit:', rule)
    formData.value = {
      name: rule.name,
      category: rule.category,
      type: rule.type,
      points: rule.points,
      icon: rule.icon,
      description: rule.description || '',
      enabled: rule.enabled,
      sortOrder: rule.sortOrder
    }
  } else if (isEdit.value && !editingRule.value) {
    console.warn('Edit mode but rule not found:', ruleId.value)
    showToast({ message: '未找到该规则，请确认规则是否存在', type: 'error' })
    router.back()
  }
})

// 保存规则
const saveRule = () => {
  // 基础验证
  if (!formData.value.name?.trim()) {
    showToast({ message: '请输入规则名称', type: 'warning' })
    return
  }

  if (!formData.value.category) {
    showToast({ message: '请选择分类', type: 'warning' })
    return
  }

  if (!formData.value.type) {
    showToast({ message: '请选择类型', type: 'warning' })
    return
  }

  if (formData.value.points === 0) {
    showToast({ message: '积分值不能为 0', type: 'warning' })
    return
  }

  // 惩罚规则的积分值必须为负数
  if (formData.value.type === 'penalty' && formData.value.points > 0) {
    showToast({ message: '惩罚规则的积分值必须为负数！', type: 'error' })
    return
  }

  try {
    // 验证通过，执行保存操作（断言 category 不为空）
    const ruleData = {
      ...formData.value,
      category: formData.value.category as Rule['category']
    }
      
    if (isEdit.value && editingRule.value) {
      // 更新现有规则
      store.updateRule(editingRule.value.id, ruleData)
      console.log('Rule updated:', editingRule.value.id)
    } else {
      // 新增规则
      const newRule = store.addRule(ruleData)
      console.log('Rule created:', newRule.id)
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
@use '@/assets/main.scss' as *;

.rule-edit-page {
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

.input--select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
  cursor: pointer;
}

.form-tip {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
  
  &.error {
    color: var(--danger-color);
    font-weight: 500;
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
