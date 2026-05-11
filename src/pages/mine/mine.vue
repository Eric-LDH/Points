<template>
  <div class="mine-page">
    <!-- 孩子信息卡片 -->
    <div class="profile-card">
      <div class="profile-card__bg">
        <div class="profile-card__glow glow-1" />
        <div class="profile-card__glow glow-2" />
      </div>
      <div class="profile-card__content">
        <div class="profile-card__avatar">
          <span>{{ currentChild?.avatar || '👦' }}</span>
        </div>
        <div class="profile-card__info">
          <div class="profile-card__name">{{ currentChild?.name || '未选择' }}</div>
          <div class="profile-card__points">
            <IconFont name="star" :size="14" color="#FBBF24" />
            {{ totalPoints }} 积分
          </div>
        </div>
        <button class="profile-card__switch" @click="showChildSwitch = true">
          <IconFont name="user" :size="16" />
          切换
        </button>
      </div>
    </div>

    <!-- 规则与兑换管理 -->
    <div class="section">
      <h2 class="section-title">
        <IconFont name="settings" :size="16" color="var(--primary-color)" />
        规则与兑换管理
      </h2>
      <div class="menu-list glass-card">
        <div class="menu-item" @click="goToRuleList">
          <div class="menu-item__left">
            <div class="menu-item__icon menu-item__icon--primary">
              <IconFont name="list" :size="20" color="#6366F1" />
            </div>
            <span class="menu-item__title">积分规则管理</span>
          </div>
          <IconFont name="arrowRight" :size="18" color="var(--text-muted)" />
        </div>
        <div class="menu-item" @click="goToRewardManage">
          <div class="menu-item__left">
            <div class="menu-item__icon menu-item__icon--success">
              <IconFont name="gift" :size="20" color="#10B981" />
            </div>
            <span class="menu-item__title">兑换商品管理</span>
          </div>
          <IconFont name="arrowRight" :size="18" color="var(--text-muted)" />
        </div>
        <div class="menu-item" @click="goToLuckyConfig">
          <div class="menu-item__left">
            <div class="menu-item__icon menu-item__icon--purple">
              <IconFont name="clover" :size="20" color="#8B5CF6" />
            </div>
            <span class="menu-item__title">幸运任务配置</span>
          </div>
          <IconFont name="arrowRight" :size="18" color="var(--text-muted)" />
        </div>
      </div>
    </div>

    <!-- 补录管理 -->
    <div class="section">
      <h2 class="section-title">
        <IconFont name="notes" :size="16" color="var(--primary-color)" />
        补录管理
      </h2>
      <div class="menu-list glass-card">
        <div class="menu-item" @click="goToRecord">
          <div class="menu-item__left">
            <div class="menu-item__icon menu-item__icon--info">
              <IconFont name="calendar" :size="20" color="#3B82F6" />
            </div>
            <span class="menu-item__title">手工补录</span>
          </div>
          <IconFont name="arrowRight" :size="18" color="var(--text-muted)" />
        </div>
      </div>
    </div>

    <!-- 数据备份 -->
    <div class="section">
      <h2 class="section-title">
        <IconFont name="backup" :size="16" color="var(--primary-color)" />
        数据备份与恢复
      </h2>
      <div class="backup-card glass-card">
        <div class="backup-card__content">
          <div class="backup-card__icon">
            <IconFont name="backup" :size="32" color="var(--primary-color)" />
          </div>
          <div>
            <div class="backup-card__label">本地存储</div>
            <div class="backup-card__meta">{{ storageSize }} · 最后备份：{{ lastBackupTime }}</div>
          </div>
        </div>
        <div class="backup-card__actions">
          <button class="btn btn--primary btn--sm" @click="exportBackup">
            <IconFont name="backup" :size="14" color="#fff" />
            手动备份
          </button>
          <button class="btn btn--outline btn--sm" @click="triggerImport">
            <IconFont name="add" :size="14" />
            从文件恢复
          </button>
          <input type="file" ref="fileInput" accept=".json" style="display: none" @change="importBackup" />
        </div>
      </div>
    </div>

    <!-- 系统设置 -->
    <div class="section">
      <h2 class="section-title">
        <IconFont name="settings" :size="16" color="var(--primary-color)" />
        系统设置
      </h2>
      <div class="menu-list glass-card">
        <div class="menu-item" @click="toggleDarkMode">
          <div class="menu-item__left">
            <div class="menu-item__icon menu-item__icon--warning">
              <IconFont :name="darkMode ? 'moon' : 'sun'" :size="20" :color="darkMode ? '#818CF8' : '#F59E0B'" />
            </div>
            <span class="menu-item__title">深色模式</span>
          </div>
          <label class="switch-toggle" :class="{ active: darkMode }">
            <div class="switch-toggle__knob" />
          </label>
        </div>
      </div>
    </div>

    <!-- 切换孩子弹窗 -->
    <div v-if="showChildSwitch" class="modal-overlay" @click="showChildSwitch = false">
      <div class="modal glass-modal" @click.stop>
        <div class="modal__header">
          <h3 class="modal__title">选择孩子</h3>
          <button class="modal__close" @click="showChildSwitch = false">
            <IconFont name="close" :size="20" />
          </button>
        </div>
        <div class="modal__body">
          <div v-for="child in children" :key="child.id"
            class="child-option" :class="{ active: child.id === currentChildId }"
            @click="switchChild(child.id)">
            <span class="child-option__avatar">{{ child.avatar }}</span>
            <div class="child-option__info">
              <div class="child-option__name">{{ child.name }}</div>
              <div class="child-option__points">{{ child.currentPoints }}分</div>
            </div>
            <div v-if="child.id === currentChildId" class="child-option__check">
              <IconFont name="check" :size="14" color="#fff" />
            </div>
            <button class="child-option__edit" @click.stop="showEditChildName(child)">
              <IconFont name="edit" :size="14" color="var(--text-muted)" />
            </button>
            <button class="child-option__delete" @click.stop="confirmDeleteChild(child)">
              <IconFont name="delete" :size="14" color="var(--danger-color)" />
            </button>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" @click="showAddChildForm = true">
            <IconFont name="add" :size="16" color="#fff" />
            添加孩子
          </button>
        </div>
      </div>
    </div>

    <!-- 添加孩子弹窗 -->
    <div v-if="showAddChildForm" class="modal-overlay" @click="showAddChildForm = false">
      <div class="modal glass-modal" @click.stop>
        <div class="modal__header">
          <h3 class="modal__title">添加孩子</h3>
          <button class="modal__close" @click="showAddChildForm = false">
            <IconFont name="close" :size="20" />
          </button>
        </div>
        <div class="modal__body">
          <div class="form-group">
            <label class="form-label">孩子姓名</label>
            <input type="text" v-model="newChildName" class="input" placeholder="请输入孩子姓名" />
          </div>
          <div class="form-group">
            <label class="form-label">头像表情</label>
            <div class="avatar-grid">
              <div v-for="avatar in avatarOptions" :key="avatar"
                class="avatar-option" :class="{ selected: newChildAvatar === avatar }"
                @click="newChildAvatar = avatar">{{ avatar }}</div>
            </div>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" @click="addChild">
            <IconFont name="check" :size="16" color="#fff" />
            确认添加
          </button>
          <button class="btn btn--outline" @click="showAddChildForm = false">取消</button>
        </div>
      </div>
    </div>

    <!-- 修改名字弹窗 -->
    <div v-if="showEditChild" class="modal-overlay" @click="showEditChild = false">
      <div class="modal glass-modal" @click.stop>
        <div class="modal__header">
          <h3 class="modal__title">修改名字</h3>
          <button class="modal__close" @click="showEditChild = false">
            <IconFont name="close" :size="20" />
          </button>
        </div>
        <div class="modal__body">
          <div class="form-group">
            <label class="form-label">孩子姓名</label>
            <input type="text" v-model="editingChildName" class="input" placeholder="请输入孩子姓名" />
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--primary" @click="saveChildName">
            <IconFont name="check" :size="16" color="#fff" />
            保存
          </button>
          <button class="btn btn--outline" @click="showEditChild = false">取消</button>
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
import { useModalLock } from '@/composables/useModalLock'
import IconFont from '@/components/IconFont.vue'

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
const fileInput = ref<HTMLInputElement | null>(null)

useModalLock(showChildSwitch)
useModalLock(showAddChildForm)
useModalLock(showEditChild)

const newChildName = ref('')
const newChildAvatar = ref('👦')
const avatarOptions = ['👦', '👧', '👶', '👱‍♂️', '👱‍♀️', '🧒', '👨‍🎓', '👩‍🎓']

const editingChildId = ref<string | null>(null)
const editingChildName = ref('')

const showEditChildName = (child: Child) => {
  editingChildId.value = child.id
  editingChildName.value = child.name
  showEditChild.value = true
}

const addChild = () => {
  if (!newChildName.value.trim()) { showToast({ message: '请输入孩子姓名', type: 'warning' }); return }
  const newChild = store.addChild({ name: newChildName.value, avatar: newChildAvatar.value, currentPoints: 0, totalPoints: 0 })
  store.switchChild(newChild.id)
  newChildName.value = ''
  newChildAvatar.value = '👦'
  showAddChildForm.value = false
  showToast({ message: `成功添加孩子：${newChild.name}`, type: 'success' })
}

const saveChildName = () => {
  if (!editingChildName.value.trim()) { showToast({ message: '请输入孩子姓名', type: 'warning' }); return }
  if (editingChildId.value) {
    store.updateChildName(editingChildId.value, editingChildName.value)
    showEditChild.value = false
    editingChildId.value = null
    editingChildName.value = ''
    showToast({ message: '名字修改成功！', type: 'success' })
  }
}

const confirmDeleteChild = async (child: Child) => {
  if (children.value.length <= 1) { showToast({ message: '至少保留一个孩子！', type: 'warning' }); return }
  const confirmed = await showConfirm({ title: '删除确认', message: `确定要删除孩子"${child.name}"吗？\n\n删除后该孩子的所有积分记录都将被清空，此操作不可恢复！`, type: 'danger' })
  if (confirmed) {
    if (child.id === currentChildId.value) {
      const otherChild = children.value.find(c => c.id !== child.id)
      if (otherChild) store.switchChild(otherChild.id)
    }
    store.deleteChild(child.id)
    showChildSwitch.value = false
    showToast({ message: `已删除孩子：${child.name}`, type: 'success' })
  }
}

const storageSize = ref('2.3MB')
const lastBackupTime = ref('今天 14:30')

const goToRuleList = () => router.push('/rule/list')
const goToRewardManage = () => router.push('/reward/list')
const goToLuckyConfig = () => router.push('/lucky/config')
const goToRecord = () => router.push('/record')

const switchChild = (id: string) => { store.switchChild(id); showChildSwitch.value = false }
const toggleDarkMode = () => { store.toggleDarkMode() }

const exportBackup = async () => {
  try {
    const backupData = { rules: store.rules, rewardItems: store.rewardItems, pointsRecords: store.pointsRecords, exchangeRecords: store.exchangeRecords, children: store.children, luckyTasks: store.luckyTasks, backupAt: new Date().toISOString(), version: '1.0.0' }
    const jsonString = JSON.stringify(backupData, null, 2)
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `backup_${dateStr}.json`
    const capacitor = (window as any).Capacitor
    if (capacitor && capacitor.isNativePlatform()) {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
      const result = await Filesystem.writeFile({ path: fileName, data: jsonString, directory: Directory.Cache, encoding: Encoding.UTF8 })
      const { Share } = await import('@capacitor/share')
      await Share.share({ title: '备份数据', text: '家庭积分管理系统备份文件', files: [result.uri], dialogTitle: '分享到' })
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `积分备份_${dateStr}.json`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    }
    lastBackupTime.value = '刚刚'
    showToast({ message: '备份成功！', type: 'success' })
  } catch (error) {
    console.error('备份失败:', error)
    showToast({ message: '备份失败：' + (error as Error).message, type: 'error' })
  }
}

const triggerImport = () => { fileInput.value?.click() }

const importBackup = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  try { await store.importBackup(file); showToast({ message: '恢复成功！', type: 'success' }) }
  catch (error) { showToast({ message: '恢复失败：' + (error as Error).message, type: 'error' }) }
  target.value = ''
}

onMounted(() => {
  window.scrollTo(0, 0)
  let size = 0
  for (let key in localStorage) { if (localStorage.hasOwnProperty(key)) size += localStorage[key].length * 2 }
  storageSize.value = (size / 1024).toFixed(1) + 'KB'
})
</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.mine-page {
  padding: var(--spacing-lg);
  padding-top: calc(var(--spacing-lg) + env(safe-area-inset-top, 0px));
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  animation: fade-in 0.5s ease;
}

.section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
}

// ===== 个人资料卡片 =====
.profile-card {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);

  &__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%);
  }

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(50px);
    opacity: 0.3;

    &.glow-1 { width: 180px; height: 180px; background: #818CF8; top: -60px; right: -40px; }
    &.glow-2 { width: 120px; height: 120px; background: #C4B5FD; bottom: -30px; left: -30px; }
  }

  &__content {
    position: relative;
    padding: var(--spacing-xl);
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    z-index: 1;
    backdrop-filter: blur(4px);
  }

  &__avatar {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.15);
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.25);
    flex-shrink: 0;
    font-size: 36px;
  }

  &__info {
    flex: 1;
  }

  &__name {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 2px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  &__points {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: rgba(255,255,255,0.8);
  }

  &__switch {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 14px;
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: var(--radius-xl);
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.3s, transform 0.3s;
    flex-shrink: 0;

    &:active { transform: scale(0.95); }
  }
}

// ===== 菜单列表 =====
.menu-list {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm) 0;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 var(--spacing-xs);

  &:active {
    transform: scale(0.98);
  }

  &:not(:last-child) {
    border-bottom: 1px solid var(--border-color);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  &__icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    flex-shrink: 0;

    &--primary { background: rgba(99, 102, 241, 0.08); }
    &--success { background: rgba(16, 185, 129, 0.08); }
    &--purple { background: rgba(139, 92, 246, 0.08); }
    &--info { background: rgba(59, 130, 246, 0.08); }
    &--warning { background: rgba(245, 158, 11, 0.08); }
  }

  &__title {
    font-size: 15px;
    font-weight: 500;
  }
}

// ===== 备份卡片 =====
.backup-card {
  padding: var(--spacing-lg);

  &__content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.06);
    border-radius: 12px;
    flex-shrink: 0;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
  }

  &__meta {
    font-size: 12px;
    color: var(--text-muted);
  }

  &__actions {
    display: flex;
    gap: var(--spacing-sm);
  }
}

// ===== 开关 =====
.switch-toggle {
  width: 46px;
  height: 26px;
  background: var(--border-color);
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;
  flex-shrink: 0;

  &.active {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  }

  &__knob {
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  &.active &__knob {
    left: 22px;
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
  max-height: 80vh;
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
    padding: var(--spacing-lg);
    max-height: calc(80vh - 120px);
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);

    button { flex: 1; }
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

// ===== 孩子选项 =====
.child-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
  margin-bottom: var(--spacing-sm);
  @include glass(0.3, 8px, 0.06);

  &.active {
    background: rgba(99, 102, 241, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  &__avatar { font-size: 36px; }
  &__info { flex: 1; }
  &__name { font-size: 16px; font-weight: 500; margin-bottom: 2px; }
  &__points { font-size: 13px; color: var(--text-muted); }

  &__check {
    width: 22px; height: 22px;
    background: var(--primary-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__edit, &__delete {
    width: 32px; height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
    flex-shrink: 0;

  }

}

// ===== 表单 =====
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.avatar-option {
  font-size: 32px;
  padding: var(--spacing-md);
  text-align: center;
  @include glass(0.3, 8px, 0.06);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;

  &.selected {
    border: 2px solid var(--primary-color);
    background: rgba(99, 102, 241, 0.08);
  }

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

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>