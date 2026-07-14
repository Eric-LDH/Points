<template>
  <div class="history-page">
    <!-- 头部导航 -->
    <div class="header">
      <button class="btn btn--primary btn--sm" @click="goBack">
        ←
      </button>
      <h1 class="page-title">历史积分</h1>
    </div>

    <div class="history-content">
    <p class="page-subtitle">{{ currentChild?.name || '宝贝' }}的积分历史</p>

    <!-- 粒度切换 & 日期范围 -->
    <div class="filter-section glass-card">
      <div class="filter-row">
        <div class="granularity-tabs">
          <button
            v-for="g in granularities"
            :key="g.value"
            class="granularity-tab"
            :class="{ active: granularity === g.value }"
            @click="onGranularityChange(g.value)"
          >{{ g.label }}</button>
        </div>
      </div>
      <div class="filter-row filter-row--range">
        <div class="date-input-wrap">
          <span class="date-label">从</span>
          <input type="date" class="date-input" v-model="startDate" @change="onDateRangeChange" />
        </div>
        <span class="date-sep">—</span>
        <div class="date-input-wrap">
          <span class="date-label">至</span>
          <input type="date" class="date-input" v-model="endDate" @change="onDateRangeChange" />
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-title__dot" />
        积分趋势
      </h2>
      <div v-if="chartData.length === 0" class="empty-state glass-card">
        <div class="empty-state__icon">📊</div>
        <p>暂无数据</p>
      </div>
      <div v-else class="chart-container glass-card" ref="chartRef"></div>
    </div>

    <!-- 汇总卡片列表 -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-title__dot" />
        时间段汇总
      </h2>
      <div v-if="chartData.length === 0" class="empty-state glass-card">
        <div class="empty-state__icon">📋</div>
        <p>暂无数据</p>
      </div>
      <div v-else class="summary-list">
        <div
          v-for="item in chartData"
          :key="item.label"
          class="summary-card glass-card"
        >
          <div class="summary-card__label">{{ item.label }}</div>
          <div class="summary-card__points" :class="item.points >= 0 ? 'positive' : 'negative'">
            {{ item.points >= 0 ? '+' : '' }}{{ item.points }}
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const router = useRouter()
const store = useAppStore()
const chartRef = ref<HTMLDivElement | null>(null)

const goBack = () => router.back()
let chartInstance: echarts.ECharts | null = null

const currentChild = computed(() => store.currentChild)

type Granularity = 'day' | 'week' | 'month'
const granularity = ref<Granularity>('month')
const granularities: { label: string; value: Granularity }[] = [
  { label: '按天', value: 'day' },
  { label: '按周', value: 'week' },
  { label: '按月', value: 'month' }
]

// 默认日期范围：近3个月
const endDate = ref(formatDateOnly(new Date()))
const startDate = ref(getDefaultStartDate())

function getDefaultStartDate(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return formatDateOnly(d)
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

function onGranularityChange(val: Granularity) {
  granularity.value = val
}

function onDateRangeChange() {
  // 确保范围有效
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    ;[startDate.value, endDate.value] = [endDate.value, startDate.value]
  }
}

// 按天汇总
function getDayData(records: { date: string; points: number }[]) {
  const map = new Map<string, number>()
  records.forEach(r => {
    map.set(r.date, (map.get(r.date) || 0) + r.points)
  })
  const allDates = getDateRange(startDate.value, endDate.value)
  return allDates.map(d => ({
    label: formatDayLabel(d),
    date: d,
    points: map.get(d) || 0
  }))
}

// 按周汇总
function getWeekData(dayData: { label: string; date: string; points: number }[]) {
  const map = new Map<string, number>()
  dayData.forEach(d => {
    const weekKey = getWeekKey(d.date)
    map.set(weekKey, (map.get(weekKey) || 0) + d.points)
  })
  const seen = new Set<string>()
  const result: { label: string; date: string; points: number }[] = []
  dayData.forEach(d => {
    const wk = getWeekKey(d.date)
    if (!seen.has(wk)) {
      seen.add(wk)
      result.push({ label: wk, date: d.date, points: map.get(wk) || 0 })
    }
  })
  return result
}

// 按月汇总
function getMonthData(dayData: { label: string; date: string; points: number }[]) {
  const map = new Map<string, number>()
  dayData.forEach(d => {
    const mk = d.date.slice(0, 7)
    map.set(mk, (map.get(mk) || 0) + d.points)
  })
  const seen = new Set<string>()
  const result: { label: string; date: string; points: number }[] = []
  dayData.forEach(d => {
    const mk = d.date.slice(0, 7)
    if (!seen.has(mk)) {
      seen.add(mk)
      result.push({ label: formatMonthLabel(mk), date: d.date, points: map.get(mk) || 0 })
    }
  })
  return result
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return formatWeekLabel(monday)
}

function formatWeekLabel(monday: Date): string {
  const end = new Date(monday)
  end.setDate(end.getDate() + 6)
  const sm = monday.getMonth() + 1
  const sd = monday.getDate()
  const em = end.getMonth() + 1
  const ed = end.getDate()
  return `${sm}/${sd}-${em}/${ed}`
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const m = d.getMonth() + 1
  const day = d.getDate()
  const w = weekNames[d.getDay()]
  return `${m}/${day} ${w}`
}

function formatMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-')
  return `${y}年${parseInt(m)}月`
}

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const cur = new Date(s)
  while (cur <= e) {
    dates.push(formatDateOnly(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

const chartData = computed(() => {
  const childId = store.currentChildId
  if (!childId) return []

  const childRecords = store.pointsRecords.filter(r => r.childId === childId)

  // 筛选日期范围
  const filtered = childRecords.filter(r => {
    return r.date >= startDate.value && r.date <= endDate.value
  })

  const simpleRecords = filtered.map(r => ({ date: r.date, points: r.points }))
  const dayData = getDayData(simpleRecords)

  if (granularity.value === 'day') return dayData
  if (granularity.value === 'week') return getWeekData(dayData)
  return getMonthData(dayData)
})

// ECharts 初始化和更新
function initChart() {
  if (!chartRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartRef.value, undefined, { renderer: 'canvas' })
  updateChart()
}

function updateChart() {
  if (!chartInstance || !chartRef.value) return

  const data = chartData.value
  if (data.length === 0) return

  const isDark = store.darkMode
  const textColor = isDark ? '#94a3b8' : '#94a3b8'
  const lineColor = isDark ? '#818cf8' : '#6366f1'
  const areaColorTop = isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.15)'
  const areaColorBottom = isDark ? 'rgba(129, 140, 248, 0)' : 'rgba(99, 102, 241, 0)'

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 13 },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        return `<div style="font-weight:600;margin-bottom:4px">${p.axisValue}</div>
          <div>净得分：<span style="color:${lineColor};font-weight:700">${p.value >= 0 ? '+' : ''}${p.value}</span></div>`
      }
    },
    grid: { left: 44, right: 20, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.label),
      axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' } },
      axisTick: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 10,
        interval: data.length > 10 ? Math.floor(data.length / 5) : 0,
        rotate: data.length > 10 ? 30 : 0
      }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } },
      axisLabel: { color: textColor, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [{
      type: 'line',
      data: data.map(d => d.points),
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { color: lineColor, width: 2.5 },
      itemStyle: { color: lineColor },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: areaColorTop },
          { offset: 1, color: areaColorBottom }
        ])
      }
    }]
  }, { notMerge: true })
}

// 监听数据变化
watch(chartData, async () => {
  await nextTick()
  updateChart()
}, { deep: true })

watch(() => store.darkMode, async () => {
  await nextTick()
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  initChart()
})

watch([startDate, endDate, granularity], async () => {
  await nextTick()
  updateChart()
})

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  window.scrollTo(0, 0)
  nextTick(() => {
    initChart()
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped lang="scss">
@use '@/assets/main.scss' as *;

.history-page {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  animation: fade-in 0.5s ease;
  padding-top: calc(72px + env(safe-area-inset-top, 0px));
  padding-bottom: calc(var(--spacing-lg) + 80px);
}

// ===== 头部导航（参考 record.vue） =====
.header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: calc(var(--spacing-md) + env(safe-area-inset-top, 0px)) var(--spacing-lg) var(--spacing-md);
  @include glass(0.85, 10px, 0.08);
  z-index: 1000;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: var(--spacing-lg);
    right: var(--spacing-lg);
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--primary-light), transparent);
    opacity: 0.3;
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);

    .dark & {
      color: var(--dark-text-primary);
    }
  }
}

.history-content {
  padding: 0 var(--spacing-lg);
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: var(--spacing-lg);
  margin-top: var(--spacing-sm);

  .dark & {
    color: var(--dark-text-secondary);
  }
}

// ===== 筛选区域 =====
.filter-section {
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.filter-row {
  display: flex;
  align-items: center;

  &--range {
    margin-top: var(--spacing-md);
    gap: var(--spacing-sm);
  }
}

.granularity-tabs {
  display: flex;
  background: var(--bg-color);
  border-radius: var(--radius-lg);
  padding: 3px;
  gap: 2px;
  width: 100%;

  .dark & {
    background: var(--dark-border);
  }
}

.granularity-tab {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;

  .dark & {
    color: var(--dark-text-muted);
  }

  &.active {
    background: var(--primary-color);
    color: #fff;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }
}

.date-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.date-label {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;

  .dark & {
    color: var(--dark-text-secondary);
  }
}

.date-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-color);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  min-width: 0;

  .dark & {
    background: var(--dark-card-bg);
    border-color: var(--dark-border);
    color: var(--dark-text-primary);
  }

  &:focus {
    border-color: var(--primary-color);
  }
}

.date-sep {
  font-size: 13px;
  color: var(--text-muted);
  flex-shrink: 0;

  .dark & {
    color: var(--dark-text-muted);
  }
}

// ===== 区块 =====
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
  color: var(--text-primary);

  .dark & {
    color: var(--dark-text-primary);
  }

  &__dot {
    width: 4px;
    height: 18px;
    background: linear-gradient(180deg, var(--primary-color), var(--primary-light));
    border-radius: 2px;
    flex-shrink: 0;
  }
}

// ===== 图表容器 =====
.chart-container {
  width: 100%;
  height: 260px;
  padding: var(--spacing-sm);
}

// ===== 汇总卡片 =====
.summary-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);

    .dark & {
      color: var(--dark-text-primary);
    }
  }

  &__points {
    font-size: 20px;
    font-weight: 700;
    padding: 4px 14px;
    border-radius: var(--radius-md);

    &.positive {
      color: var(--success-color);
      background: rgba(16, 185, 129, 0.08);

      .dark & {
        background: rgba(16, 185, 129, 0.12);
      }
    }

    &.negative {
      color: var(--danger-color);
      background: rgba(239, 68, 68, 0.08);

      .dark & {
        background: rgba(239, 68, 68, 0.12);
      }
    }
  }
}

// ===== 空状态 =====
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);

  .dark & {
    background: var(--dark-card-bg);
  }

  &__icon {
    font-size: 48px;
    display: block;
    margin-bottom: var(--spacing-md);
  }

  p {
    font-size: 14px;
    color: var(--text-muted);

    .dark & {
      color: var(--dark-text-secondary);
    }
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
