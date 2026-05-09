<template>
  <div class="stats-page">
    <div class="page-header-section">
      <h1 class="page-title">数据统计</h1>
      <p class="page-subtitle">{{ child?.name || '宝贝' }}的积分成长报告</p>
    </div>
    
    <!-- 概览卡片 -->
    <div class="overview-card glass-card">
      <div class="overview-card__stats">
        <div class="stat-box">
          <div class="stat-box__icon stat-box__icon--primary">
            <IconFont name="star" :size="20" color="#6366F1" />
          </div>
          <div class="stat-box__label">当前积分</div>
          <div class="stat-box__value">{{ totalPoints }}</div>
        </div>
        <div class="stat-divider" />
        <div class="stat-box">
          <div class="stat-box__icon stat-box__icon--success">
            <IconFont name="trophy" :size="20" color="#10B981" />
          </div>
          <div class="stat-box__label">累计获得</div>
          <div class="stat-box__value">{{ child?.totalPoints || 0 }}</div>
        </div>
        <div class="stat-divider" />
        <div class="stat-box">
          <div class="stat-box__icon stat-box__icon--warning">
            <IconFont name="gift" :size="20" color="#F59E0B" />
          </div>
          <div class="stat-box__label">本月兑换</div>
          <div class="stat-box__value">{{ monthExchange }}</div>
        </div>
      </div>
    </div>

    <!-- 本周表现 -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-title__dot" />
        本周表现
      </h2>
      <div class="week-chart glass-card">
        <div 
          v-for="(day, index) in weekDays" 
          :key="index"
          class="day-column"
        >
          <div class="day-column__bar-wrapper">
            <div 
              class="day-column__bar"
              :style="{ height: getBarHeight(day.points) + 'px' }"
            >
              <div class="day-column__bar-glow" />
            </div>
          </div>
          <div class="day-column__points">{{ day.points }}</div>
          <div class="day-column__label" :class="{ 'day-column__label--today': day.isToday }">
            {{ day.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 分类统计 -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-title__dot" />
        分类统计
      </h2>
      <div v-if="categoryStats.length === 0" class="empty-state glass-card">
        <div class="empty-state__icon">📝</div>
        <p>还没有任何记录</p>
      </div>
      <div v-else class="category-list">
        <div 
          v-for="cat in categoryStats" 
          :key="cat.category"
          class="category-item glass-card"
        >
          <div class="category-item__header">
            <div class="category-item__icon-wrap">
              <span class="category-item__icon">{{ cat.icon }}</span>
            </div>
            <div class="category-item__info">
              <span class="category-item__name">{{ cat.category }}</span>
              <div class="category-item__stats">
                <span class="category-item__count">{{ cat.count }}次</span>
                <span class="category-item__points">{{ cat.totalPoints > 0 ? '+' : '' }}{{ cat.totalPoints }}分</span>
              </div>
            </div>
          </div>
          <div class="category-item__bar">
            <div class="progress-bar">
              <div 
                class="progress-bar__fill"
                :style="{ width: cat.percentage + '%' }"
              />
            </div>
            <span class="category-item__pct">{{ cat.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近记录 -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-title__dot" />
        最近记录
      </h2>
      <div v-if="recentRecords.length === 0" class="empty-state glass-card">
        <div class="empty-state__icon">📝</div>
        <p>还没有任何记录</p>
      </div>
      <div v-else class="records-list">
        <div 
          v-for="record in recentRecords" 
          :key="record.id"
          class="record-item glass-card"
        >
          <div class="record-item__left">
            <span class="record-item__icon">{{ record.ruleIcon }}</span>
            <div>
              <div class="record-item__name">{{ record.ruleName }}</div>
              <div class="record-item__date">
                <IconFont name="calendar" :size="10" color="var(--text-muted)" />
                {{ formatDate(record.date) }}
              </div>
            </div>
          </div>
          <div class="record-item__points" :class="record.points > 0 ? 'positive' : 'negative'">
            {{ record.points > 0 ? '+' : '' }}{{ record.points }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores'
import IconFont from '@/components/IconFont.vue'

const store = useAppStore()

onMounted(() => {
  window.scrollTo(0, 0)
  store.refreshData()
})

watch(() => store.currentChildId, () => {
  store.refreshData()
})

const child = computed(() => store.currentChild)
const totalPoints = computed(() => store.totalPoints)
const pointsRecords = computed(() => store.pointsRecords)
const enabledRules = computed(() => store.enabledRules)

const weekDays = computed(() => {
  const childId = store.currentChildId
  const childRecords = pointsRecords.value.filter(r => r.childId === childId)
  const today = new Date()
  const currentDay = today.getDay()
  const mondayOffset = currentDay === 0 ? 6 : currentDay - 1
  const monday = new Date(today)
  monday.setDate(monday.getDate() - mondayOffset)
  monday.setHours(0, 0, 0, 0)
  const result = []
  const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const todayStr = today.toISOString().split('T')[0]
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const dayRecords = childRecords.filter(r => r.date === dateStr)
    const dayPoints = dayRecords.reduce((sum, r) => sum + r.points, 0)
    result.push({
      name: weekDayNames[i],
      points: dayPoints,
      date: dateStr,
      isToday: dateStr === todayStr
    })
  }
  return result
})

const maxPoints = computed(() => {
  return Math.max(...weekDays.value.map(d => d.points), 1)
})

const getBarHeight = (points: number) => {
  return Math.max((points / maxPoints.value) * 100, points > 0 ? 8 : 4)
}

const categoryStats = computed(() => {
  const childId = store.currentChildId
  const childRecords = pointsRecords.value.filter(r => r.childId === childId)
  const rulesMap: Record<string, { icon: string; count: number; points: number }> = {}
  enabledRules.value.forEach(rule => {
    if (!rulesMap[rule.category]) {
      rulesMap[rule.category] = { icon: rule.icon, count: 0, points: 0 }
    }
  })
  childRecords.forEach(record => {
    const rule = store.enabledRules.find(r => r.id === record.ruleId)
    if (rule) {
      if (!rulesMap[rule.category]) {
        rulesMap[rule.category] = { icon: rule.icon, count: 0, points: 0 }
      }
      rulesMap[rule.category].count += 1
      rulesMap[rule.category].points += record.points
    }
  })
  const totalCount = childRecords.length
  return Object.entries(rulesMap)
    .map(([category, data]) => ({
      category, icon: data.icon, count: data.count,
      totalPoints: data.points,
      percentage: totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
})

const monthExchange = computed(() => {
  const today = new Date()
  const currentMonth = today.toISOString().slice(0, 7)
  const monthRecords = store.exchangeRecords.filter(r => {
    return new Date(r.exchangeDate).toISOString().slice(0, 7) === currentMonth
  })
  return monthRecords.reduce((sum, r) => sum + r.totalPoints, 0)
})

const recentRecords = computed(() => {
  const childId = store.currentChildId
  return pointsRecords.value.filter(r => r.childId === childId).slice(0, 10)
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
@import '@/assets/main.scss';

.stats-page {
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

// ===== 概览卡片 =====
.overview-card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);

  &__stats {
    display: flex;
    align-items: center;
  }
}

.stat-box {
  flex: 1;
  text-align: center;
  padding: var(--spacing-sm);

  &__icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin: 0 auto var(--spacing-sm);

    &--primary { background: rgba(99, 102, 241, 0.1); }
    &--success { background: rgba(16, 185, 129, 0.1); }
    &--warning { background: rgba(245, 158, 11, 0.1); }
  }

  &__label {
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 2px;
  }

  &__value {
    font-size: 22px;
    font-weight: 700;
  }
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: var(--border-color);
  flex-shrink: 0;

  .dark & { background: rgba(255,255,255,0.08); }
}

// ===== 本周柱状图 =====
.week-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: var(--spacing-lg);
  min-height: 180px;
}

.day-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;

  &__bar-wrapper {
    width: 32px;
    height: 120px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    position: relative;
  }

  &__bar {
    width: 100%;
    background: linear-gradient(180deg, var(--primary-light) 0%, var(--primary-color) 80%);
    border-radius: 6px 6px 2px 2px;
    transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
    min-height: 4px;
  }

  &__bar-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 30%;
    background: linear-gradient(180deg, rgba(255,255,255,0.4), transparent);
    border-radius: 6px 6px 0 0;
  }

  &__points {
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-color);
  }

  &__label {
    font-size: 11px;
    color: var(--text-muted);

    &--today {
      color: var(--primary-color);
      font-weight: 600;
      position: relative;

      &::after {
        content: '·';
        position: absolute;
        bottom: -14px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 18px;
        color: var(--primary-color);
      }
    }
  }
}

// ===== 分类统计 =====
.category-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.category-item {
  padding: var(--spacing-md) var(--spacing-lg);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
  }

  &__icon-wrap {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.06);
    border-radius: 12px;
    flex-shrink: 0;
  }

  &__icon {
    font-size: 22px;
  }

  &__info {
    flex: 1;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  &__stats {
    display: flex;
    gap: var(--spacing-sm);
    font-size: 12px;
  }

  &__count {
    color: var(--text-muted);
  }

  &__points {
    font-weight: 600;
    color: var(--success-color);
  }

  &__bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    .progress-bar {
      flex: 1;
    }
  }

  &__pct {
    font-size: 12px;
    color: var(--text-muted);
    width: 36px;
    text-align: right;
    flex-shrink: 0;
  }
}

.progress-bar {
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;

  .dark & { background: rgba(255,255,255,0.06); }

  &__fill {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

// ===== 最近记录 =====
.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);

  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  &__icon {
    font-size: 28px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 2px;
  }

  &__date {
    font-size: 11px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__points {
    font-size: 18px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: var(--radius-md);

    &.positive {
      background: rgba(16, 185, 129, 0.08);
      color: var(--success-color);
    }

    &.negative {
      background: rgba(239, 68, 68, 0.08);
      color: var(--danger-color);
    }
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

// ===== 工具类 =====
.glass-card {
  @include glass-card;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
