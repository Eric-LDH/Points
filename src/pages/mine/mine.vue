<template>
  <div class="mine-page">
    <h1 class="page-title">👤 我的</h1>
    
    <!-- 孩子信息 -->
    <div class="child-card card">
      <div class="child-card__header">
        <span class="child-card__avatar">{{ currentChild?.avatar || '👦' }}</span>
        <div>
          <div class="child-card__name">{{ currentChild?.name || '未选择' }}</div>
          <div class="child-card__points">当前积分：{{ totalPoints }}</div>
        </div>
      </div>
      <div class="child-card__actions">
        <button class="btn btn--outline btn--sm" @click="showChildSwitch = true">
          👨‍👩‍👧‍👦 切换孩子
        </button>
      </div>
    </div>

    <!-- 规则与兑换管理 -->
    <div class="section">
      <h2 class="section-title">⚙️ 规则与兑换管理</h2>
      <div class="menu-list">
        <div class="menu-item" @click="goToRuleList">
          <div class="menu-item__left">
            <span class="menu-item__icon">📋</span>
            <span class="menu-item__title">积分规则管理</span>
          </div>
          <span class="menu-item__arrow">›</span>
        </div>
        <div class="menu-item" @click="goToRewardManage">
          <div class="menu-item__left">
            <span class="menu-item__icon">🎁</span>
            <span class="menu-item__title">兑换商品管理</span>
          </div>
          <span class="menu-item__arrow">›</span>
        </div>
        <div class="menu-item" @click="goToLuckyConfig">
          <div class="menu-item__left">
            <span class="menu-item__icon">🍀</span>
            <span class="menu-item__title">幸运任务配置</span>
          </div>
          <span class="menu-item__arrow">›</span>
        </div>
      </div>
    </div>

    <!-- 补录管理 -->
    <div class="section">
      <h2 class="section-title">📝 补录管理</h2>
      <div class="menu-list">
        <div class="menu-item" @click="goToRecord">
          <div class="menu-item__left">
            <span class="menu-item__icon">📅</span>
            <span class="menu-item__title">手工补录</span>
          </div>
          <span class="menu-item__arrow">›</span>
        </div>
      </div>
    </div>

    <!-- 数据备份与恢复 -->
    <div class="section">
      <h2 class="section-title">💾 数据备份与恢复</h2>
      <div class="backup-card card">
        <div class="backup-info">
          <div class="backup-info__icon">💿</div>
          <div>
            <div class="backup-info__label">本地存储</div>
            <div class="backup-info__size">{{ storageSize }} / 可用空间大</div>
            <div class="backup-info__time">最后备份：{{ lastBackupTime }}</div>
          </div>
        </div>
        <div class="backup-actions">
          <button class="btn btn--primary btn--sm" @click="exportBackup">
            📤 手动备份
          </button>
          <button class="btn btn--outline btn--sm" @click="triggerImport">
            📥 从文件恢复
          </button>
          <input 
            type="file" 
            ref="fileInput"
            accept=".json"
            style="display: none"
            @change="importBackup"
          />
        </div>
      </div>
    </div>

    <!-- 系统设置 -->
    <div class="section">
      <h2 class="section-title">⚙️ 系统设置</h2>
      <div class="menu-list">
        <div class="menu-item" @click="toggleDarkMode">
          <div class="menu-item__left">
            <span class="menu-item__icon">{{ darkMode ? '🌙' : '☀️' }}</span>
            <span class="menu-item__title">深色模式</span>
          </div>
          <div class="switch" :class="{ active: darkMode }" @click.stop="toggleDarkMode">
            <div class="switch__knob"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 帮助孩子切换弹窗 -->
    <div v-if="showChildSwitch" class="modal-overlay" @click="showChildSwitch = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">👨‍👩‍👧‍👦 选择孩子</h3>
        <div class="modal-content">
          <div 
            v-for="child in children" 
            :key="child.id"
            class="child-option"
            :class="{ active: child.id === currentChildId }"
            @click="switchChild(child.id)"
          >
            <span class="child-option__avatar">{{ child.avatar }}</span>
            <div class="child-option__info">
              <div class="child-option__name">{{ child.name }}</div>
              <div class="child-option__points">{{ child.currentPoints }}分</div>
            </div>
            <div v-if="child.id === currentChildId" class="checkmark">✓</div>
            <button 
              class="btn-edit-name"
              @click.stop="showEditChildName(child)"
            >
              ✏️
            </button>
            <button 
              class="btn-delete-child"
              @click.stop="confirmDeleteChild(child)"
              title="删除孩子"
            >
              🗑️
            </button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn--primary modal-close" @click="showAddChildForm = true">
            ➕ 添加孩子
          </button>
          <button class="btn btn--outline modal-close" @click="showChildSwitch = false">
            关闭
          </button>
        </div>
      </div>
    </div>

    <!-- 添加孩子表单弹窗 -->
    <div v-if="showAddChildForm" class="modal-overlay" @click="showAddChildForm = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">➕ 添加孩子</h3>
        <div class="form-group">
          <label class="form-label">孩子姓名</label>
          <input 
            type="text" 
            v-model="newChildName"
            class="input"
            placeholder="请输入孩子姓名"
          />
        </div>
        <div class="form-group">
          <label class="form-label">头像表情</label>
          <div class="avatar-selector">
            <div 
              v-for="avatar in avatarOptions" 
              :key="avatar"
              class="avatar-option"
              :class="{ selected: newChildAvatar === avatar }"
              @click="newChildAvatar = avatar"
            >
              {{ avatar }}
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn--primary" @click="addChild">
            ✓ 确认添加
          </button>
          <button class="btn btn--outline" @click="showAddChildForm = false">
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 修改孩子名字弹窗 -->
    <div v-if="showEditChild" class="modal-overlay" @click="showEditChild = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">✏️ 修改名字</h3>
        <div class="form-group">
          <label class="form-label">孩子姓名</label>
          <input 
            type="text" 
            v-model="editingChildName"
            class="input"
            placeholder="请输入孩子姓名"
          />
        </div>
        <div class="modal-actions">
          <button class="btn btn--primary" @click="saveChildName">
            ✓ 保存
          </button>
          <button class="btn btn--outline" @click="showEditChild = false">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import type { Child } from '@/types'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'
import { Share } from '@capacitor/share'
import { useModalLock } from '@/composables/useModalLock'

const router = useRouter()
const store = useAppStore()

const currentChild = computed(() => store.currentChild)
const totalPoints = computed(() => store.totalPoints)
const children = computed(() => store.children)
const currentChildId = computed(() => store.currentChildId)
const darkMode = computed(() => store.darkMode)

const showChildSwitch = ref(false)
const showAddChildForm = ref(false)
const showEditChild = ref(false)
const showAddChild = ref(false)
const showRewardManage = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// 注册弹窗到全局管理器
useModalLock(showChildSwitch)
useModalLock(showAddChildForm)
useModalLock(showEditChild)

// 添加孩子相关
const newChildName = ref('')
const newChildAvatar = ref('👦')
const avatarOptions = ['👦', '👧', '👶', '👱‍♂️', '👱‍♀️', '🧒', '👨‍🎓', '👩‍🎓']

// 编辑孩子相关
const editingChildId = ref<string | null>(null)
const editingChildName = ref('')

// 显示编辑孩子名字弹窗
const showEditChildName = (child: Child) => {
  editingChildId.value = child.id
  editingChildName.value = child.name
  showEditChild.value = true
}

// 添加孩子
const addChild = () => {
  if (!newChildName.value.trim()) {
    showToast({ message: '请输入孩子姓名', type: 'warning' })
    return
  }
  
  const newChild = store.addChild({
    name: newChildName.value,
    avatar: newChildAvatar.value,
    currentPoints: 0,
    totalPoints: 0
  })
  
  // 自动切换到新添加的孩子
  store.switchChild(newChild.id)
  
  // 重置表单
  newChildName.value = ''
  newChildAvatar.value = '👦'
  showAddChildForm.value = false
  
  showToast({ message: `成功添加孩子：${newChild.name}`, type: 'success' })
}

// 保存修改后的孩子名字
const saveChildName = () => {
  if (!editingChildName.value.trim()) {
    showToast({ message: '请输入孩子姓名', type: 'warning' })
    return
  }
  
  if (editingChildId.value) {
    store.updateChildName(editingChildId.value, editingChildName.value)
    showEditChild.value = false
    editingChildId.value = null
    editingChildName.value = ''
    showToast({ message: '名字修改成功！', type: 'success' })
  }
}

// 删除孩子
const confirmDeleteChild = async (child: Child) => {
  if (children.value.length <= 1) {
    showToast({ message: '至少保留一个孩子！', type: 'warning' })
    return
  }
  
  const confirmed = await showConfirm({
    title: '删除确认',
    message: `确定要删除孩子"${child.name}"吗？\n\n删除后该孩子的所有积分记录都将被清空，此操作不可恢复！`,
    type: 'danger'
  })
  
  if (confirmed) {
    // 如果删除的是当前孩子，先切换到其他孩子
    if (child.id === currentChildId.value) {
      const otherChild = children.value.find(c => c.id !== child.id)
      if (otherChild) {
        store.switchChild(otherChild.id)
      }
    }
    
    // 删除孩子
    store.deleteChild(child.id)
    
    // 关闭弹窗
    showChildSwitch.value = false
    
    showToast({ message: `已删除孩子：${child.name}`, type: 'success' })
  }
}

const storageSize = ref('2.3MB')
const lastBackupTime = ref('今天 14:30')

const goToRuleList = () => {
  router.push('/rule/list')
}

const goToRewardManage = () => {
  router.push('/reward/list')
}

const goToLuckyConfig = () => {
  router.push('/lucky/config')
}

const goToRecord = () => {
  router.push('/record')
}

const switchChild = (id: string) => {
  store.switchChild(id)
  showChildSwitch.value = false
}

const toggleDarkMode = () => {
  store.toggleDarkMode()
}

const exportBackup = async () => {
  try {
    // 生成备份数据
    const backupData = {
      rules: store.rules,
      rewardItems: store.rewardItems,
      pointsRecords: store.pointsRecords,
      exchangeRecords: store.exchangeRecords,
      children: store.children,
      backupAt: new Date().toISOString(),
      version: '1.0.0'
    }
    
    // 转换为 JSON 字符串
    const jsonString = JSON.stringify(backupData, null, 2)
    const dateStr = new Date().toISOString().split('T')[0]
    const timestamp = Date.now()
    const fileName = `backup_${dateStr}_${timestamp}.json`
    
    // 在移动设备上使用 Capacitor Filesystem 插件
    const capacitor = (window as any).Capacitor
    if (capacitor && capacitor.isNativePlatform()) {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
      
      // 写入文件到缓存目录 - 明确指定 UTF-8 编码
      const result = await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      })
      
      // 使用 Share 插件分享文件
      const { Share } = await import('@capacitor/share')
      await Share.share({
        title: '备份数据',
        text: '家庭积分管理系统备份文件',
        files: [result.uri],
        dialogTitle: '分享到'
      })
    } else {
      // 在浏览器中使用传统下载方式
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `积分备份_${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    
    lastBackupTime.value = '刚刚'
    showToast({ message: '备份成功！', type: 'success' })
  } catch (error) {
    console.error('备份失败:', error)
    showToast({ message: '备份失败：' + (error as Error).message, type: 'error' })
  }
}

const triggerImport = () => {
  fileInput.value?.click()
}

const importBackup = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  try {
    await store.importBackup(file)
    showToast({ message: '恢复成功！', type: 'success' })
  } catch (error) {
    showToast({ message: '恢复失败：' + (error as Error).message, type: 'error' })
  }
  
  // 清空 input
  target.value = ''
}

onMounted(() => {
  // 滚动到页面顶部
  window.scrollTo(0, 0)
  
  // 计算实际存储大小
  let size = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      size += localStorage[key].length * 2
    }
  }
  storageSize.value = (size / 1024).toFixed(1) + 'KB'
})
</script>

<style scoped lang="scss">
.mine-page {
  padding: var(--spacing-lg);
  max-width: 480px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: var(--spacing-xl);
}

.section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.child-card {
  margin-bottom: var(--spacing-xl);
  
  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }
  
  &__avatar {
    font-size: 56px;
  }
  
  &__name {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
  }
  
  &__points {
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  &__actions {
    display: flex;
    gap: var(--spacing-sm);
  }
}

.menu-list {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow);
  // 防止圆角处透出白色边 - 创建层叠上下文
  isolation: isolate;
  
  // 为每个菜单项添加样式，确保与父容器背景一致
  .menu-item {
    // 使用与父容器相同的背景色，避免透出
    background-color: inherit;
  }
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  // 使用 inherit 从父容器继承背景色，避免圆角处透白边
  background-color: inherit;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  
  // 确保最后一个元素的圆角处不透明
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: var(--bg-color);
  }
  
  &:active {
    background: rgba(99, 102, 241, 0.05);
  }
  
  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  &__icon {
    font-size: 24px;
  }
  
  &__title {
    font-size: 16px;
  }
  
  &__badge {
    margin-left: var(--spacing-sm);
    padding: 2px 8px;
    background: var(--primary-color);
    color: white;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 500;
  }
  
  &__arrow {
    font-size: 24px;
    color: var(--text-muted);
  }
}

.backup-card {
  padding: var(--spacing-lg);
}

.backup-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  
  &__icon {
    font-size: 40px;
  }
  
  &__label {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
  }
  
  &__size {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }
  
  &__time {
    font-size: 12px;
    color: var(--text-muted);
  }
}

.backup-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.switch {
  width: 50px;
  height: 28px;
  background: var(--border-color);
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  
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
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &.active .switch__knob {
    left: 24px;
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
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  max-height: 60vh;
  overflow-y: auto;
}

.child-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: var(--primary-color);
    color: white;
  }
  
  &.active {
    border: 2px solid var(--primary-color);
    background: rgba(99, 102, 241, 0.05);
  }
  
  &__avatar {
    font-size: 40px;
  }
  
  &__info {
    flex: 1;
  }
  
  &__name {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
  }
  
  &__points {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.checkmark {
  width: 20px;
  height: 20px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.btn-edit-name {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: var(--primary-color);
  }
}

.btn-delete-child {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  margin-left: var(--spacing-xs);
  
  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: var(--danger-color);
  }
}

.modal-actions {
  display: flex;
  gap: var(--spacing-sm);
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

.avatar-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.avatar-option {
  font-size: 32px;
  padding: var(--spacing-md);
  text-align: center;
  background: var(--bg-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.selected {
    border: 2px solid var(--primary-color);
    background: rgba(99, 102, 241, 0.1);
  }
  
  &:hover {
    background: rgba(99, 102, 241, 0.05);
  }
}

.modal-close {
  width: 100%;
}

.btn--sm {
  padding: 8px 16px;
  font-size: 14px;
}
</style>
