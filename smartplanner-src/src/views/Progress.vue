<template>
  <div class="progress-page page-enter-active">
    <div class="prog-wrap">

      <div class="prog-header">
        <div>
          <p class="label-caps" style="margin-bottom:4px;">Insights</p>
          <h2 class="serif" style="font-size:26px;">Your progress</h2>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="pill pill-green">🔥 {{ streak }}-task streak</span>
          <button class="btn btn-ghost">This week ▾</button>
        </div>
      </div>

      <div class="stat-summary">
        <div class="card card-p stat-card" v-for="s in summaryStats" :key="s.label">
          <div class="ss-num" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="ss-label muted">{{ s.label }}</div>
        </div>
      </div>

      <div class="charts-row">

        <div class="card card-p chart-card">
          <div class="label-caps" style="margin-bottom:16px;">Completion by task type</div>
          <Bar :data="barData" :options="barOptions" />
        </div>

        <div class="card card-p chart-card chart-card-sm">
          <div class="label-caps" style="margin-bottom:16px;">Task type breakdown</div>
          <div class="donut-wrap">
            <Doughnut :data="donutData" :options="donutOptions" />
          </div>
          <div class="donut-legend">
            <div v-for="(label, i) in donutData.labels" :key="label" class="dl-item">
              <div class="dl-dot" :style="{ background: donutData.datasets[0].backgroundColor[i] }"></div>
              {{ label }}
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-row">

        <div class="card card-p">
          <div class="label-caps" style="margin-bottom:14px;">All tasks</div>
          <div v-for="task in store.tasks" :key="task.id" class="prog-task-row">
            <div class="prog-task-info">
              <div class="prog-task-name" :class="{ done: task.done }">{{ task.name }}</div>
              <div style="font-size:11px; color:var(--muted2);">
                Due {{ formatDue(task.due) }} ·
                <span :class="typeCls[task.type]">{{ task.type }}</span>
              </div>
            </div>
            <div class="prog-bar-wrap">
              <div class="prog-track">
                <div class="prog-fill" :class="priorityCls[task.priority]" :style="{ width: taskProgress(task) + '%' }"></div>
              </div>
              <span class="prog-pct">{{ taskProgress(task) }}%</span>
            </div>
            <span class="pill" :class="priorityPill[task.priority]">{{ task.priority }}</span>
          </div>
        </div>

        <div class="card card-p">
          <div class="label-caps" style="margin-bottom:14px;">Recent activity</div>
          <div v-for="a in activities" :key="a.id" class="act-item">
            <div class="act-icon" :style="{ background: a.bg }">{{ a.icon }}</div>
            <div class="act-body">
              <div class="act-title">{{ a.title }}</div>
              <div class="act-sub muted">{{ a.sub }}</div>
            </div>
            <span class="act-time muted">{{ a.time }}</span>
          </div>
        </div>
      </div>

      <div class="ai-banner">
        <span class="ai-badge">✦ AI INSIGHT</span>
        <p>You currently have <strong>{{ completedCount }} task{{ completedCount !== 1 ? 's' : '' }} completed</strong> out of {{ store.tasks.length }} total. {{ completedCount >= store.tasks.length / 2 ? 'Great progress — you\'re more than halfway there!' : 'Keep going — focus on high-priority items first.' }}</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title
} from 'chart.js'
import { store } from '../stores/store.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title)

const completedCount  = computed(() => store.tasks.filter(t => t.done).length)
const incompleteCount = computed(() => store.tasks.filter(t => !t.done).length)
const streak = computed(() => completedCount.value)

const summaryStats = computed(() => [
  { label:'Tasks completed',  value: completedCount.value,  color:'#6BB896' },
  { label:'Tasks remaining',  value: incompleteCount.value, color:'#E05A4A' },
  { label:'Total tasks',      value: store.tasks.length,    color:'var(--text)' },
  { label:'Subtasks done',    value: store.tasks.flatMap(t=>t.subtasks).filter(s=>s.done).length, color:'#5A9ACA' },
])

const taskTypes = ['reading','studying','assignment','project','revision','other']
const typeColors = ['#5A9ACA','#6BB896','#D4933C','#9B7EC7','#5A9ACA','#9A9690']

const barData = computed(() => {
  const labels = taskTypes.filter(tp => store.tasks.some(t => t.type === tp))
  const counts = labels.map(tp => store.tasks.filter(t => t.type === tp && t.done).length)
  const totals = labels.map(tp => store.tasks.filter(t => t.type === tp).length)
  return {
    labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
    datasets: [
      { label:'Completed', data:counts, backgroundColor:'rgba(74,123,95,.7)', borderRadius:6, borderSkipped:false },
      { label:'Total',     data:totals, backgroundColor:'rgba(74,123,95,.15)', borderRadius:6, borderSkipped:false },
    ],
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display:false } },
  scales: {
    x: { grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#6B6860', font:{ family:'Geist, sans-serif', size:11 } } },
    y: { grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#6B6860', font:{ family:'Geist, sans-serif', size:11 }, stepSize:1 }, beginAtZero:true },
  },
}

const donutData = computed(() => {
  const labels = taskTypes.filter(tp => store.tasks.some(t => t.type === tp))
  return {
    labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
    datasets: [{
      data: labels.map(tp => store.tasks.filter(t => t.type === tp).length),
      backgroundColor: ['rgba(90,154,202,.7)','rgba(74,123,95,.7)','rgba(212,147,60,.7)','rgba(155,126,199,.7)','rgba(90,154,202,.5)','rgba(154,150,144,.5)'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }
})

const donutOptions = {
  responsive:true, maintainAspectRatio:true, cutout:'70%',
  plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => ` ${ctx.label}: ${ctx.raw} task${ctx.raw!==1?'s':''}` } } },
}

const priorityPill = { high:'pill-red', medium:'pill-amber', low:'pill-green' }
const priorityCls  = { high:'fill-red', medium:'fill-amber', low:'fill-green' }
const typeCls = { reading:'clr-blue', assignment:'clr-amber', project:'clr-purple', studying:'clr-green', revision:'clr-blue', other:'' }

function taskProgress(task) {
  if (task.done) return 100
  if (!task.subtasks.length) return 0
  return Math.round(task.subtasks.filter(s => s.done).length / task.subtasks.length * 100)
}

function formatDue(due) {
  if (!due) return '—'
  return new Date(due + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

const activities = [
  { id:1, icon:'✓', bg:'rgba(74,123,95,.15)',  title:'Lab report submitted',     sub:'Completed on time',          time:'2h ago' },
  { id:2, icon:'🧠', bg:'rgba(58,107,154,.15)', title:'AI subtasks generated',    sub:'Portfolio split into 3 tasks', time:'Yesterday' },
  { id:3, icon:'📅', bg:'rgba(192,60,44,.15)',  title:'Deadline approaching',     sub:'Read Ch.7 due soon',          time:'Today' },
  { id:4, icon:'📄', bg:'rgba(123,94,167,.15)', title:'Schedule exported to PDF', sub:'Week of Apr 13–19',           time:'Mon' },
]
</script>

<style scoped>
.progress-page { min-height:calc(100vh - 54px); background:var(--bg); }
.prog-wrap  { max-width:1100px; margin:0 auto; padding:32px 28px; }
.prog-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:12px; }

.stat-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
.stat-card { text-align:center; }
.ss-num    { font-family:var(--font-disp); font-size:36px; line-height:1; }
.ss-label  { font-size:12px; margin-top:4px; }

.charts-row { display:grid; grid-template-columns:1fr 300px; gap:16px; margin-bottom:16px; }
.chart-card { }
.chart-card-sm { display:flex; flex-direction:column; }
.donut-wrap { max-width:180px; margin:0 auto 12px; }
.donut-legend { display:flex; flex-direction:column; gap:5px; }
.dl-item { display:flex; align-items:center; gap:7px; font-size:12px; color:var(--muted2); }
.dl-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

.bottom-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }

.prog-task-row  { display:flex; align-items:center; gap:12px; padding:9px 0; border-bottom:1px solid var(--border); }
.prog-task-row:last-child { border-bottom:none; }
.prog-task-info { flex:1; min-width:0; }
.prog-task-name { font-size:13px; font-weight:500; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.prog-task-name.done { text-decoration:line-through; color:var(--muted); }
.prog-bar-wrap  { width:100px; display:flex; align-items:center; gap:6px; flex-shrink:0; }
.prog-track { flex:1; height:4px; background:var(--surface3); border-radius:2px; overflow:hidden; }
.prog-fill  { height:4px; border-radius:2px; transition:width .5s; }
.fill-red   { background:var(--red); }
.fill-amber { background:var(--amber); }
.fill-green { background:var(--accent); }
.prog-pct   { font-size:10px; color:var(--muted2); min-width:28px; }

.clr-blue   { color:#5A9ACA; }
.clr-amber  { color:#D4933C; }
.clr-purple { color:#9B7EC7; }
.clr-green  { color:#6BB896; }

.act-item  { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--border); }
.act-item:last-child { border-bottom:none; }
.act-icon  { width:32px; height:32px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:14px; }
.act-body  { flex:1; }
.act-title { font-size:13px; font-weight:500; color:var(--text); }
.act-sub   { font-size:11px; margin-top:1px; }
.act-time  { font-size:11px; flex-shrink:0; }

.ai-banner {
  background:linear-gradient(135deg, rgba(74,123,95,.12), rgba(74,123,95,.06));
  border:1px solid rgba(74,123,95,.3); border-radius:12px; padding:16px 20px;
  display:flex; align-items:center; gap:14px;
}
.ai-badge { font-size:10px; font-weight:700; letter-spacing:.1em; color:var(--accent); background:var(--accent-l); padding:3px 8px; border-radius:4px; white-space:nowrap; flex-shrink:0; }
.ai-banner p { font-size:13px; color:var(--muted2); line-height:1.5; }
.ai-banner strong { color:var(--text); }
</style>
