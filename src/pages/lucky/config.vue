<template>
  <div class="lucky-config-page">
    <!-- 头部导航 -->
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="$router.back()">
        ←
      </button>
      <h1 class="page-title">幸运任务配置</h1>
      <button class="btn btn--primary btn--sm" @click="showAddForm = true">
        ✚ 新增
      </button>
    </div>
    
    <!-- 任务列表 -->
    <div v-if="tasks.length === 0" class="empty-state card">
      <span class="empty-state__emoji">📝</span>
      <p>还没有配置任何任务</p>
      <p class="empty-hint">点击上方按钮添加你的第一个幸运任务</p>
    </div>

    <div v-else class="task-list">
      <div 
        v-for="task in tasks" 
        :key="task.id"
        class="task-item card"
      >
        <div class="task-item__content">
          <span class="task-item__icon">⭐</span>
          <div class="task-item__text">{{ task.description }}</div>
        </div>
        <div class="task-item__actions">
          <button 
            class="btn-icon btn-edit"
            @click="editTask(task)"
            title="编辑"
          >
            ✏️
          </button>
          <button 
            class="btn-icon btn-delete"
            @click="confirmDelete(task)"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑任务弹窗 -->
    <div v-if="showAddForm || showEditForm" class="modal-overlay" @click="closeForm">
      <div class="modal" @click.stop>
        <h3 class="modal-title">{{ isEditing ? '✏️ 编辑任务' : '➕ 添加任务' }}</h3>
        <div class="form-group">
          <label class="form-label">任务描述</label>
          <textarea 
            v-model="taskDescription"
            class="textarea"
            placeholder="请输入任务描述，例如：整理自己的房间"
            rows="3"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn--primary" @click="saveTask">
            ✓ 保存
          </button>
          <button class="btn btn--outline" @click="closeForm">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Storage } from '@/utils/storage'
import type { LuckyTask } from '@/types'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'
import { useModalLock } from '@/composables/useModalLock'

const router = useRouter()

// 任务列表数据
const tasks = ref<LuckyTask[]>([])

// 表单状态
const showAddForm = ref(false)
const showEditForm = ref(false)
const isEditing = ref(false)
const editingTaskId = ref<string | null>(null)
const taskDescription = ref('')

// 注册弹窗到全局管理器
useModalLock(showAddForm)
useModalLock(showEditForm)

/**
 * 加载任务列表
 * 从本地存储读取所有配置的幸运任务
 */
const loadTasks = () => {
  tasks.value = Storage.luckyTasks.getAll()
}

/**
 * 打开编辑表单
 * 填充当前任务数据到表单
 */
const editTask = (task: LuckyTask) => {
  isEditing.value = true
  editingTaskId.value = task.id
  taskDescription.value = task.description
  showEditForm.value = true
}

/**
 * 保存任务（新增或更新）
 * 根据 isEditing 标志判断是新增还是更新操作
 */
const saveTask = () => {
  // 验证输入
  if (!taskDescription.value.trim()) {
    showToast({ message: '请输入任务描述', type: 'warning' })
    return
  }

  if (isEditing.value && editingTaskId.value) {
    // 更新现有任务
    Storage.luckyTasks.update(editingTaskId.value, {
      description: taskDescription.value.trim()
    })
    showToast({ message: '任务更新成功', type: 'success' })
  } else {
    // 新增任务
    const newTask: LuckyTask = {
      id: Date.now().toString(),
      description: taskDescription.value.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    Storage.luckyTasks.add(newTask)
    showToast({ message: '任务添加成功', type: 'success' })
  }

  // 重新加载列表并关闭表单
  loadTasks()
  closeForm()
}

/**
 * 确认删除任务
 * 使用二次确认防止误删
 */
const confirmDelete = async (task: LuckyTask) => {
  const confirmed = await showConfirm({
    title: '删除确认',
    message: `确定要删除任务"${task.description}"吗？`,
    type: 'danger'
  })

  if (confirmed) {
    // 执行删除操作
    Storage.luckyTasks.delete(task.id)
    loadTasks()
    showToast({ message: '任务已删除', type: 'success' })
  }
}

/**
 * 关闭表单并重置状态
 */
const closeForm = () => {
  showAddForm.value = false
  showEditForm.value = false
  isEditing.value = false
  editingTaskId.value = null
  taskDescription.value = ''
}

onMounted(() => {
  // 滚动到页面顶部
  window.scrollTo(0, 0)
  
  // 加载任务列表
  loadTasks()
})
</script>

<style scoped lang="scss">
.lucky-config-page {
  // 添加顶部安全区域，避免内容被固定头部遮挡
  padding-top: calc(80px + env(safe-area-inset-top, 0px));
  max-width: 480px;
  margin: 0 auto;
  
  // 内容区域添加左右边距
  > *:not(.header) {
    padding-left: var(--spacing-lg);
    padding-right: var(--spacing-lg);
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  
  &__emoji {
    font-size: 64px;
    display: block;
    margin-bottom: var(--spacing-md);
  }
  
  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }
  
  .empty-hint {
    font-size: 12px;
    color: var(--text-muted);
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
  
  &__content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
  }
  
  &__icon {
    font-size: 24px;
  }
  
  &__text {
    font-size: 15px;
    line-height: 1.5;
    color: var(--text-primary);
  }
  
  &__actions {
    display: flex;
    gap: var(--spacing-sm);
  }
}

.btn-icon {
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &.btn-edit:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: var(--primary-color);
  }
  
  &.btn-delete:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: var(--danger-color);
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
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 16px;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

.modal-actions {
  display: flex;
  gap: var(--spacing-sm);
}
</style>
