<template>
  <div class="stats-page">
    <h1 class="page-title">📊 数据统计</h1>
    
    <!-- 概览卡片 -->
    <div class="overview-card card">
      <div class="overview-card__header">
        <span class="overview-card__emoji">🎯</span>
        <h2>积分概览</h2>
      </div>
      <div class="overview-card__stats">
        <div class="stat-box">
          <div class="stat-box__label">当前积分</div>
          <div class="stat-box__value text-primary">{{ totalPoints }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-box__label">累计获得</div>
          <div class="stat-box__value text-success">{{ child?.totalPoints || 0 }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-box__label">本月兑换</div>
          <div class="stat-box__value text-warning">{{ monthExchange }}分</div>
        </div>
      </div>
    </div>

    <!-- 本周表现 -->
    <div class="section">
      <h2 class="section-title">📈 本周表现</h2>
      <div class="week-chart card">
        <div 
          v-for="(day, index) in weekDays" 
          :key="index"
          class="day-column"
        >
          <div class="day-column__bar-container">
            <div 
              class="day-column__bar"
              :style="{ height: getBarHeight(day.points) + 'px' }"
            ></div>
          </div>
          <div class="day-column__label">{{ day.name }}</div>
          <div class="day-column__points">{{ day.points }}</div>
        </div>
      </div>
    </div>

    <!-- 分类统计 -->
    <div class="section">
      <h2 class="section-title">🏷️ 分类统计</h2>
      <div v-if="categoryStats.length === 0" class="empty-state">
        <span class="empty-state__emoji">📝</span>
        <p>还没有任何记录</p>
      </div>
      <div v-else class="category-stats">
        <div 
          v-for="cat in categoryStats" 
          :key="cat.category"
          class="category-item card"
        >
          <div class="category-item__header">
            <span class="category-item__icon">{{ cat.icon }}</span>
            <span class="category-item__name">{{ cat.category }}</span>
          </div>
          <div class="category-item__stats">
            <div class="category-item__count">{{ cat.count }}次</div>
            <div class="category-item__points" :class="cat.totalPoints > 0 ? 'positive' : 'negative'">
              {{ cat.totalPoints > 0 ? '+' : '' }}{{ cat.totalPoints }}分
            </div>
          </div>
          <div class="category-item__percentage">
            <div class="progress-bar">
              <div 
                class="progress-bar__fill"
                :style="{ width: cat.percentage + '%' }"
              ></div>
            </div>
            <span>{{ cat.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近记录 -->
    <div class="section">
      <h2 class="section-title">📝 最近记录</h2>
      <div v-if="recentRecords.length === 0" class="empty-state">
        <span class="empty-state__emoji">📝</span>
        <p>还没有任何记录</p>
      </div>
      <div v-else class="records-list">
        <div 
          v-for="record in recentRecords" 
          :key="record.id"
          class="record-item"
        >
          <div class="record-item__left">
            <span class="record-item__icon">{{ record.ruleIcon }}</span>
            <div>
              <div class="record-item__name">{{ record.ruleName }}</div>
              <div class="record-item__date">{{ formatDate(record.date) }}</div>
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

const store = useAppStore()

// 页面挂载时刷新数据
onMounted(() => {
  // 滚动到页面顶部
  window.scrollTo(0, 0)
  store.refreshData()
})

// 监听孩子切换，确保数据及时更新
watch(
  () => store.currentChildId,
  () => {
    store.refreshData()
  }
)

const child = computed(() => store.currentChild)
const totalPoints = computed(() => store.totalPoints)
const pointsRecords = computed(() => store.pointsRecords)
const todayPoints = computed(() => store.todayPoints)
const enabledRules = computed(() => store.enabledRules)

// 计算本周数据（周一到周日）- 基于当前孩子的记录
const weekDays = computed(() => {
  const childId = store.currentChildId
  const childRecords = pointsRecords.value.filter(r => r.childId === childId)
  
  const today = new Date()
  const currentDay = today.getDay() // 0(周日) - 6(周六)
  
  // 计算本周一的日期
  const mondayOffset = currentDay === 0 ? 6 : currentDay - 1 // 如果是周日，往回推 6 天；否则往回推 (currentDay-1) 天
  const monday = new Date(today)
  monday.setDate(monday.getDate() - mondayOffset)
  monday.setHours(0, 0, 0, 0)
  
  const result = []
  const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  
  // 从周一开始，获取完整 7 天的数据
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(date.getDate() + i)
    
    // 使用本地时间格式化，避免时区问题
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // 计算这一天的总积分（包括今天）
    const dayRecords = childRecords.filter(r => r.date === dateStr)
    const dayPoints = dayRecords.reduce((sum, r) => sum + r.points, 0)
    
    result.push({
      name: weekDayNames[i],
      points: dayPoints,
      date: dateStr
    })
  }
  
  return result
})

const maxPoints = computed(() => {
  const max = Math.max(...weekDays.value.map(d => d.points), 1)
  return max > 0 ? max : 1
})

const getBarHeight = (points: number) => {
  return (points / maxPoints.value) * 120
}

// 分类统计 - 基于真实规则数据
const categoryStats = computed(() => {
  const childId = store.currentChildId
  const childRecords = pointsRecords.value.filter(r => r.childId === childId)
  
  const rulesMap: Record<string, { icon: string; count: number; points: number }> = {}
  
  // 初始化所有分类
  enabledRules.value.forEach(rule => {
    if (!rulesMap[rule.category]) {
      rulesMap[rule.category] = {
        icon: rule.icon,
        count: 0,
        points: 0
      }
    }
  })
  
  // 统计每个分类的记录
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
  
  // 计算总次数用于百分比
  const totalCount = childRecords.length
  
  // 转换为数组并排序
  return Object.entries(rulesMap)
    .map(([category, data]) => ({
      category,
      icon: data.icon,
      count: data.count,
      totalPoints: data.points,
      percentage: totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
})

const monthExchange = computed(() => {
  const today = new Date()
  const currentMonth = today.toISOString().slice(0, 7) // YYYY-MM
  
  // 筛选本月的兑换记录
  const monthRecords = store.exchangeRecords.filter(r => {
    const recordDate = new Date(r.exchangeDate)
    return recordDate.toISOString().slice(0, 7) === currentMonth
  })
  
  // 计算总兑换积分
  return monthRecords.reduce((sum, r) => sum + r.totalPoints, 0)
})

const recentRecords = computed(() => {
  const childId = store.currentChildId
  const childRecords = pointsRecords.value.filter(r => r.childId === childId)
  return childRecords.slice(0, 10)
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}-${day}`
}

</script>

<style scoped lang="scss">
.stats-page {
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

.section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.overview-card {
  margin-bottom: var(--spacing-xl);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow);
  
  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  &__emoji {
    font-size: 32px;
  }
  
  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
  }
}

.stat-box {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--bg-color);
  border-radius: var(--radius-md);
  
  &__label {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
  }
  
  &__value {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
  }
}

.week-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: var(--spacing-lg);
  min-height: 180px;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.day-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  
  &__bar-container {
    width: 32px;
    height: 140px;
    background: var(--bg-color);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overflow: hidden;
  }
  
  &__bar {
    width: 100%;
    background: linear-gradient(180deg, var(--primary-light), var(--primary-color));
    border-radius: var(--radius-sm);
    transition: height 0.3s ease;
  }
  
  &__label {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  &__points {
    font-size: 14px;
    font-weight: 600;
    color: var(--primary-color);
  }
}

.category-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.category-item {
  padding: var(--spacing-md);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  
  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    
    &__name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
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
  
  &__stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
  }
  
  &__count {
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  &__points {
    font-size: 14px;
    font-weight: 600;
    
    &.positive {
      color: var(--success-color);
    }
    
    &.negative {
      color: var(--danger-color);
    }
  }
  
  &__percentage {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    
    .progress-bar {
      background: var(--border-color);
    }
  }
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
  
  &__fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-light), var(--primary-color));
    transition: width 0.3s ease;
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  
  &__emoji {
    font-size: 48px;
    display: block;
    margin-bottom: var(--spacing-md);
  }
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
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  
  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
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
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
    color: var(--text-primary);
  }
  
  &__date {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  &__points {
    font-size: 18px;
    font-weight: 700;
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-md);
    
    &.positive {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success-color);
    }
    
    &.negative {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger-color);
    }
  }
}
</style>