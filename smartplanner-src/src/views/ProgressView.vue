<template>
  <div class="prog-page">
    <AppNavbar/>
    <div class="prog-wrap">
      <div class="prog-header">
        <div>
          <p class="ph-eye">Insights</p>
          <h1 class="ph-h">Your progress</h1>
          <p class="ph-sub">{{ weekLabel }} - Keep pushing</p>
        </div>
      </div>

      <div class="stats-row">
        <div class="card stat-card" v-for="s in stats" :key="s.label">
          <div class="sc-num" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="sc-label">{{ s.label }}</div>
        </div>
      </div>

      <div class="charts-row">
        <div class="card chart-card">
          <p class="cc-label">Task completion by type</p>
          <Bar :data="completionChartData" :options="barOptions"/>
        </div>

        <div class="card chart-card">
          <p class="cc-label">Time allocation</p>
          <Doughnut :data="timeChartData" :options="doughnutOptions"/>
        </div>

        <div class="card chart-card">
          <p class="cc-label">Weekly task load</p>
          <Bar :data="weeklyChartData" :options="barOptions"/>
          <div class="ai-insight">
            <span class="ai-tag">AI Insight</span>
            <p>{{ insightText }}</p>
          </div>
        </div>
      </div>

      <div class="bottom-row">
        <div class="card bottom-card">
          <p class="bc-title">Incomplete tasks</p>
          <div v-if="incompleteTasks.length">
            <div v-for="t in incompleteTasks" :key="t.id" class="it-item">
              <div class="it-left">
                <div class="it-name">{{ t.title }}</div>
                <div class="it-meta">Due {{ formatDate(t.due) }} - {{ t.type }}</div>
              </div>
              <span class="pill" :class="ppill[t.priority]">{{ t.priority }}</span>
              <button class="it-done" @click="tasks.toggleDone(t.id)">Done</button>
            </div>
          </div>
          <p v-else class="empty-msg">All tasks completed.</p>
        </div>

        <div class="card bottom-card">
          <p class="bc-title">Scheduled subtasks</p>
          <div class="act-list">
            <div v-for="s in scheduledSubtasks" :key="s.key" class="act-item">
              <div class="act-icon" :style="{ background: s.done ? 'var(--accent-bg)' : 'var(--blue-bg)' }">{{ s.done ? '✓' : '•' }}</div>
              <div class="act-body">
                <div class="act-name">{{ s.title }}</div>
                <div class="act-sub">{{ s.parentTitle }} - {{ formatDate(s.date) }} {{ s.start || '' }}</div>
              </div>
              <button class="it-done" @click="tasks.toggleSubtask(s.parentId, s.id)">{{ s.done ? 'Undo' : 'Done' }}</button>
            </div>
            <p v-if="!scheduledSubtasks.length" class="empty-msg">No scheduled subtasks yet.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import AppNavbar from '@/components/AppNavbar.vue'
import { useTaskStore } from '@/stores/index.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale)

const tasks = useTaskStore()
const ppill = { high:'pill-red', medium:'pill-amber', low:'pill-green' }

const chartColors = {
  assignment: '#4E7C5F',
  reading: '#3A6B9A',
  project: '#7B5EA7',
  studying: '#6BB896',
  revision: '#C4832C',
  other: '#6A6A6A'
}

const weekRange = computed(() => {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0,0,0,0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
})

const weekLabel = computed(() => {
  const s = weekRange.value[0]
  const e = weekRange.value[6]
  return `${s.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} - ${e.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}`
})

const stats = computed(() => [
  { label: 'Tasks completed', value: tasks.totalDone, color: 'var(--accent)' },
  { label: 'Still pending', value: tasks.totalPending, color: '#E05A4E' },
  { label: 'High priority', value: tasks.highPriority, color: '#D4933C' },
  { label: 'Total tasks', value: tasks.tasks.length, color: '#5A9ACA' },
])

const taskTypes = computed(() => [...new Set(tasks.tasks.map(t => t.type || 'other'))])

const completionChartData = computed(() => ({
  labels: taskTypes.value.map(type => type.charAt(0).toUpperCase() + type.slice(1)),
  datasets: [{
    label: 'Completion %',
    data: taskTypes.value.map(type => {
      const all = tasks.tasks.filter(t => (t.type || 'other') === type)
      const done = all.filter(t => t.done)
      return all.length ? Math.round(done.length / all.length * 100) : 0
    }),
    backgroundColor: taskTypes.value.map(type => chartColors[type] || chartColors.other),
    borderRadius: 6
  }]
}))

const timeChartData = computed(() => ({
  labels: taskTypes.value.map(type => type.charAt(0).toUpperCase() + type.slice(1)),
  datasets: [{
    label: 'Estimated hours',
    data: taskTypes.value.map(type => tasks.tasks.filter(t => (t.type || 'other') === type).length * 1.5),
    backgroundColor: taskTypes.value.map(type => chartColors[type] || chartColors.other),
    borderWidth: 0
  }]
}))

const weeklyChartData = computed(() => ({
  labels: weekRange.value.map(d => d.toLocaleDateString('en-GB', { weekday: 'short' })),
  datasets: [{
    label: 'Tasks and subtasks',
    data: weekRange.value.map(day => {
      const iso = day.toISOString().split('T')[0]
      const mainTasks = tasks.tasks.filter(t => t.due === iso).length
      const subtasks = tasks.tasks.flatMap(t => t.subtasks || []).filter(s => s.date === iso).length
      return mainTasks + subtasks
    }),
    backgroundColor: '#3A6B9A',
    borderRadius: 6
  }]
}))

const scheduledSubtasks = computed(() => tasks.tasks.flatMap(t =>
  (t.subtasks || []).map(s => ({ ...s, key: `${t.id}-${s.id}`, parentId: t.id, parentTitle: t.title }))
).filter(s => s.date).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)))

const incompleteTasks = computed(() => tasks.tasks.filter(t => !t.done))

const insightText = computed(() => {
  const values = weeklyChartData.value.datasets[0].data
  const max = Math.max(...values, 0)
  const index = values.indexOf(max)
  if (max === 0) return 'Add tasks to generate weekly progress insights.'
  return `${weeklyChartData.value.labels[index]} has the heaviest workload this week. Consider moving lower priority work if it feels crowded.`
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#9A9690', boxWidth: 10 } },
    tooltip: { enabled: true }
  },
  scales: {
    x: { ticks: { color: '#9A9690' }, grid: { color: '#2A2A2A' } },
    y: { beginAtZero: true, ticks: { color: '#9A9690' }, grid: { color: '#2A2A2A' } }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#9A9690', boxWidth: 10 } },
    tooltip: { enabled: true }
  }
}

function formatDate(iso) {
  if(!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short'})
}
</script>
<style scoped>
.prog-page { min-height:100vh;background:var(--bg); }
.prog-wrap { max-width:1100px;margin:0 auto;padding:80px 28px 60px; }
.prog-header { margin-bottom:24px; }
.ph-eye { font-size:11px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px; }
.ph-h { font-family:'Instrument Serif',serif;font-size:30px;font-weight:400;color:var(--text); }
.ph-sub { font-size:13px;color:var(--muted2);margin-top:4px; }
.stats-row { display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px; }
.stat-card { padding:18px 20px;text-align:center; }
.sc-num { font-family:'Instrument Serif',serif;font-size:36px; }
.sc-label { font-size:11px;color:var(--muted);margin-top:4px; }
.charts-row { display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px; }
.chart-card { padding:20px;min-height:260px;display:flex;flex-direction:column; }
.chart-card canvas { max-height:190px; }
.cc-label { font-size:10px;font-weight:500;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;margin-bottom:16px; }
.ai-insight { background:var(--accent-bg);border:1px solid var(--accent-bd);border-radius:8px;padding:10px;margin-top:14px; }
.ai-tag { font-size:9px;font-weight:700;letter-spacing:.08em;color:#6BB896;display:block;margin-bottom:4px; }
.ai-insight p { font-size:11px;color:var(--muted2);line-height:1.5; }
.bottom-row { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
.bottom-card { padding:20px; }
.bc-title { font-size:13px;font-weight:600;color:var(--text);margin-bottom:14px; }
.it-item { display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border); }
.it-item:last-child { border-bottom:none; }
.it-left { flex:1;min-width:0; }
.it-name { font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.it-meta { font-size:11px;color:var(--muted);margin-top:1px; }
.it-done { font-size:11px;padding:4px 10px;border-radius:6px;background:var(--accent-bg);border:1px solid var(--accent-bd);color:#6BB896;cursor:pointer;font-family:'Geist',sans-serif;white-space:nowrap; }
.empty-msg { font-size:13px;color:var(--muted);text-align:center;padding:20px 0; }
.act-list { display:flex;flex-direction:column;gap:4px; }
.act-item { display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;transition:background .15s; }
.act-item:hover { background:var(--surface2); }
.act-icon { width:30px;height:30px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--muted2); }
.act-body { flex:1;min-width:0; }
.act-name { font-size:12px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.act-sub { font-size:11px;color:var(--muted); }
</style>
