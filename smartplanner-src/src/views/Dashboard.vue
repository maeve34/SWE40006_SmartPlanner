<template>
  <div class="dashboard page-enter-active">
    <div class="dash-wrap">

      <div class="dash-greeting">
        <h1 class="serif greeting-h">Good {{ timeOfDay }}, {{ auth.user?.name }} ☀</h1>
        <p class="muted">{{ todayFull }} · {{ incompleteTasks.length }} task{{ incompleteTasks.length !== 1 ? 's' : '' }} remaining</p>
      </div>

      <div class="dash-layout">

        <div class="dash-main">

          <div class="card card-p cal-card">
            <div class="cal-top">
              <button class="btn-icon" @click="shiftWeek(-1)">‹</button>
              <span class="label-caps">{{ weekLabel }}</span>
              <button class="btn-icon" @click="shiftWeek(1)">›</button>
            </div>
            <div class="cal-grid">
              <div v-for="d in weekDays" :key="d.label" class="cal-cell" :class="{ today: d.isToday }" @click="selectedDate = d.date">
                <span class="cal-dow">{{ d.dow }}</span>
                <span class="cal-num">{{ d.num }}</span>
                <span v-if="d.hasTasks" class="cal-dot"></span>
              </div>
            </div>
          </div>

          <div class="filter-bar">
            <button
              v-for="f in filters" :key="f.value"
              :class="['filter-chip', { active: activeFilter === f.value }]"
              @click="activeFilter = f.value"
            >{{ f.label }}</button>
          </div>

          <TransitionGroup name="task" tag="div" class="task-list">
            <div
              v-for="task in filteredTasks" :key="task.id"
              class="card task-item" :class="{ done: task.done }"
            >
              <button class="task-cb" @click.stop="store.toggleTask(task.id)">
                <svg v-if="task.done" width="11" height="11" viewBox="0 0 11 11">
                  <polyline points="1.5,5.5 4.5,8.5 9.5,2.5" fill="none" stroke="#6BB896" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>

              <div class="task-body">
                <div class="task-name">{{ task.name }}</div>
                <div class="task-meta">
                  <span>📅 {{ formatDue(task.due) }}</span>
                  <span v-if="task.subtasks.length" class="pill pill-gray">{{ task.subtasks.filter(s=>s.done).length }}/{{ task.subtasks.length }} subtasks</span>
                  <span class="pill" :class="typePill[task.type]">{{ task.type }}</span>
                </div>

                <div v-if="task.subtasks.length" class="subtask-prog">
                  <div class="prog-track">
                    <div class="prog-fill" :style="{ width: subtaskPct(task) + '%' }"></div>
                  </div>
                  <span class="prog-label">{{ subtaskPct(task) }}%</span>
                </div>

                <div v-if="expanded[task.id]" class="subtask-list">
                  <div v-for="sub in task.subtasks" :key="sub.id" class="sub-item" @click.stop="store.toggleSubtask(task.id, sub.id)">
                    <div class="sub-cb" :class="{ done: sub.done }">
                      <svg v-if="sub.done" width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,1.5" fill="none" stroke="#6BB896" stroke-width="2" stroke-linecap="round"/></svg>
                    </div>
                    <span :class="{ 'done-text': sub.done }">{{ sub.name }}</span>
                    <span class="muted" style="margin-left:auto; font-size:11px;">{{ sub.est }}</span>
                  </div>
                </div>
              </div>

              <div class="task-right">
                <span class="pill" :class="priorityPill[task.priority]">{{ task.priority }}</span>
                <div class="task-actions">
                  <button v-if="task.subtasks.length" class="btn-icon" @click.stop="toggleExpand(task.id)" title="Show subtasks">▾</button>
                  <button class="btn-icon btn-del" @click.stop="store.deleteTask(task.id)" title="Delete">×</button>
                </div>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="filteredTasks.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <p>No tasks here.</p>
            <button class="btn btn-primary" @click="$emit('open-add')">+ Add task</button>
          </div>

          <button class="add-row" @click="$emit('open-add')">
            <span>+</span> Drop a new task…
          </button>
        </div>

        <aside class="dash-side">
          <div class="card card-p" style="margin-bottom:12px;">
            <div class="label-caps" style="margin-bottom:12px;">This week</div>
            <div class="stats-grid">
              <div class="stat-block">
                <div class="stat-num" style="color:var(--accent);">{{ completedTasks.length }}</div>
                <div class="stat-sub">Done</div>
              </div>
              <div class="stat-block">
                <div class="stat-num" style="color:#E05A4A;">{{ incompleteTasks.length }}</div>
                <div class="stat-sub">Remaining</div>
              </div>
            </div>
          </div>

          <div class="card card-p">
            <div class="label-caps" style="margin-bottom:12px;">Upcoming deadlines</div>
            <div v-for="t in upcomingDeadlines" :key="t.id" class="deadline-row">
              <span class="deadline-name">{{ t.name }}</span>
              <span class="pill" :class="priorityPill[t.priority]">{{ formatDue(t.due) }}</span>
            </div>
            <div v-if="upcomingDeadlines.length === 0" class="muted" style="font-size:12px;">No upcoming deadlines 🎉</div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { store, auth } from '../stores/store.js'

const emit = defineEmits(['open-add'])

const activeFilter = ref('all')
const filters = [
  { label: 'All',        value: 'all'        },
  { label: 'Today',      value: 'today'      },
  { label: '🔴 High',    value: 'high'       },
  { label: '🟡 Medium',  value: 'medium'     },
  { label: '🟢 Low',     value: 'low'        },
  { label: 'Reading',    value: 'reading'    },
  { label: 'Assignment', value: 'assignment' },
  { label: 'Completed',  value: 'completed'  },
  { label: 'Incomplete', value: 'incomplete' },
]

const todayStr = new Date().toISOString().split('T')[0]

const filteredTasks = computed(() => {
  const all = store.tasks
  switch (activeFilter.value) {
    case 'today':      return all.filter(t => t.due === todayStr)
    case 'high':       return all.filter(t => t.priority === 'high')
    case 'medium':     return all.filter(t => t.priority === 'medium')
    case 'low':        return all.filter(t => t.priority === 'low')
    case 'reading':    return all.filter(t => t.type === 'reading')
    case 'assignment': return all.filter(t => t.type === 'assignment')
    case 'completed':  return all.filter(t => t.done)
    case 'incomplete': return all.filter(t => !t.done)
    default:           return all
  }
})

const completedTasks  = computed(() => store.tasks.filter(t => t.done))
const incompleteTasks = computed(() => store.tasks.filter(t => !t.done))
const upcomingDeadlines = computed(() =>
  store.tasks.filter(t => !t.done).sort((a,b) => a.due.localeCompare(b.due)).slice(0,4)
)

const expanded = reactive({})
function toggleExpand(id) { expanded[id] = !expanded[id] }
function subtaskPct(task) {
  if (!task.subtasks.length) return 0
  return Math.round(task.subtasks.filter(s => s.done).length / task.subtasks.length * 100)
}

const weekOffset = ref(0)
const selectedDate = ref(todayStr)

const weekDays = computed(() => {
  const today = new Date()
  const dow   = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - dow + (dow === 0 ? -6 : 1) + weekOffset.value * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const ds = d.toISOString().split('T')[0]
    return {
      dow:      ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
      num:      d.getDate(),
      date:     ds,
      isToday:  ds === todayStr,
      hasTasks: store.tasks.some(t => t.due === ds),
    }
  })
})

const weekLabel = computed(() => {
  const days = weekDays.value
  const first = days[0], last = days[6]
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const d0 = new Date(first.date), d1 = new Date(last.date)
  return `${months[d0.getMonth()]} ${first.num} – ${months[d1.getMonth()]} ${last.num}`
})

function shiftWeek(dir) { weekOffset.value += dir }

const hour = new Date().getHours()
const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

const todayFull = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

const priorityPill = { high:'pill-red', medium:'pill-amber', low:'pill-green' }
const typePill     = { reading:'pill-blue', assignment:'pill-amber', project:'pill-purple', studying:'pill-green', revision:'pill-blue', other:'pill-gray' }

function formatDue(due) {
  if (!due) return '—'
  const d = new Date(due + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}
</script>

<style scoped>
.dashboard { min-height: calc(100vh - 54px); background: var(--bg); }
.dash-wrap  { max-width: 1100px; margin: 0 auto; padding: 32px 28px; }

.dash-greeting  { margin-bottom: 24px; }
.greeting-h     { font-size: 30px; margin-bottom: 4px; }

.dash-layout    { display: grid; grid-template-columns: 1fr 260px; gap: 20px; }
.dash-main      {}
.dash-side      { display: flex; flex-direction: column; gap: 12px; }

.cal-card  { margin-bottom: 14px; }
.cal-top   { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.cal-grid  { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
.cal-cell  { display:flex; flex-direction:column; align-items:center; gap:2px; padding:7px 4px; border-radius:7px; cursor:pointer; transition:all .15s; }
.cal-cell:hover { background:var(--surface2); }
.cal-cell.today { background:var(--accent); }
.cal-dow   { font-size:9px; font-weight:500; color:var(--muted); letter-spacing:.05em; }
.cal-cell.today .cal-dow { color:rgba(255,255,255,.6); }
.cal-num   { font-size:14px; font-weight:600; color:var(--text); }
.cal-cell.today .cal-num { color:#fff; }
.cal-dot   { width:4px; height:4px; border-radius:50%; background:var(--accent); }
.cal-cell.today .cal-dot { background:rgba(255,255,255,.7); }

.filter-bar  { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:14px; }
.filter-chip { padding:5px 12px; border-radius:20px; font-size:12px; font-weight:500; border:1px solid var(--border2); color:var(--muted2); background:transparent; cursor:pointer; transition:all .15s; font-family:var(--font-body); }
.filter-chip:hover  { color:var(--text); border-color:var(--muted); }
.filter-chip.active { background:var(--surface3); color:var(--text); border-color:var(--muted); }

.task-list { display:flex; flex-direction:column; gap:6px; margin-bottom:8px; }
.task-item { display:flex; align-items:flex-start; gap:12px; padding:12px 14px; cursor:pointer; transition:border-color .15s; }
.task-item:hover { border-color:var(--border2); }
.task-item.done  { opacity:.55; }

.task-cb { width:18px; height:18px; border-radius:4px; flex-shrink:0; border:1.5px solid var(--border2); background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; margin-top:1px; }
.task-item.done .task-cb { background:var(--accent-l); border-color:var(--accent); }

.task-body { flex:1; min-width:0; }
.task-name { font-size:13px; font-weight:500; color:var(--text); margin-bottom:4px; }
.task-item.done .task-name { text-decoration:line-through; }
.task-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:11px; color:var(--muted2); }

.subtask-prog { display:flex; align-items:center; gap:7px; margin-top:6px; }
.prog-track   { flex:1; height:3px; background:var(--surface3); border-radius:2px; overflow:hidden; }
.prog-fill    { height:3px; background:var(--accent); border-radius:2px; transition:width .4s; }
.prog-label   { font-size:10px; color:var(--muted2); min-width:30px; }

.subtask-list { margin-top:8px; display:flex; flex-direction:column; gap:4px; }
.sub-item     { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted2); padding:4px 0; cursor:pointer; }
.sub-cb       { width:14px; height:14px; border-radius:3px; border:1px solid var(--border2); flex-shrink:0; display:flex; align-items:center; justify-content:center; }
.sub-cb.done  { background:var(--accent-l); border-color:var(--accent); }
.done-text    { text-decoration:line-through; color:var(--muted); }

.task-right   { display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0; }
.task-actions { display:flex; gap:4px; opacity:0; transition:opacity .15s; }
.task-item:hover .task-actions { opacity:1; }
.btn-del      { color:var(--red); border-color:rgba(192,60,44,.3); font-size:16px; }
.btn-del:hover{ background:var(--red-bg); }

.stats-grid   { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.stat-block   { background:var(--surface2); border-radius:8px; padding:10px 12px; border:1px solid var(--border); }
.stat-num     { font-size:24px; font-weight:700; }
.stat-sub     { font-size:10px; color:var(--muted); margin-top:2px; }

.deadline-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:7px; }
.deadline-name{ font-size:12px; color:var(--text); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:8px; }

.empty-state  { text-align:center; padding:32px; color:var(--muted2); }
.empty-icon   { font-size:32px; margin-bottom:8px; }
.add-row      { width:100%; padding:10px 14px; border-radius:10px; border:1.5px dashed var(--border2); background:transparent; color:var(--muted); font-size:13px; cursor:pointer; display:flex; align-items:center; gap:8px; font-family:var(--font-body); transition:all .15s; }
.add-row:hover{ border-color:var(--accent); color:var(--accent); background:var(--accent-l); }

.task-enter-active { animation: taskIn .2s ease; }
.task-leave-active { animation: taskIn .15s ease reverse; }
@keyframes taskIn   { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
</style>
