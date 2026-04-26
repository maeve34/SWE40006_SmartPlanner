<template>
  <div class="schedule page-enter-active">
    <div class="sched-wrap">

      <div class="sched-header">
        <div>
          <p class="label-caps" style="margin-bottom:4px;">Weekly timetable</p>
          <h2 class="serif" style="font-size:26px;">{{ weekLabel }}</h2>
        </div>
        <div class="sched-btns">
          <button class="btn btn-ghost" @click="shiftWeek(-1)">‹ Prev</button>
          <button class="btn btn-ghost" @click="shiftWeek(1)">Next ›</button>
          <button class="btn pdf-btn" @click="exportPDF">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
          <button class="btn btn-primary" @click="$emit('open-add')">+ Add task</button>
        </div>
      </div>

      <div class="week-grid" id="schedule-print">
        <div class="wg-head">
          <div class="wg-time-col"></div>
          <div v-for="d in weekDays" :key="d.date" class="wg-day-head" :class="{ today: d.isToday }">
            <span class="wg-dow">{{ d.dow }}</span>
            <span class="wg-num">{{ d.num }}</span>
            <span v-if="d.isToday" class="today-badge">Today</span>
          </div>
        </div>

        <div class="wg-allday">
          <div class="wg-time-col" style="font-size:9px; color:var(--muted); padding-top:8px; padding-right:8px;">All day</div>
          <div v-for="d in weekDays" :key="d.date" class="wg-allday-cell" :class="{ today: d.isToday }">
            <div
              v-for="task in tasksForDay(d.date)" :key="task.id"
              class="allday-event" :class="evClass(task.type)"
              @click="toggleExpand(task.id)"
            >
              {{ task.name }}
            </div>
          </div>
        </div>

        <div class="wg-body">
          <div v-for="(hr, hi) in hours" :key="hr" class="wg-row">
            <div class="wg-time-col">{{ hr }}</div>
            <div v-for="d in weekDays" :key="d.date" class="wg-cell" :class="{ today: d.isToday }">
              <div
                v-for="ev in subtaskEventsForHour(d.date, hi)"
                :key="ev.id"
                class="time-event" :class="evClass(ev.type)"
                :style="{ top: ev.topPct + '%', height: ev.heightPct + '%' }"
              >
                {{ ev.name }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="legend">
        <div v-for="l in legends" :key="l.label" class="legend-item">
          <div class="legend-dot" :class="l.cls"></div>
          {{ l.label }}
        </div>
      </div>

      <transition name="expand">
        <div v-if="expandedTask" class="detail-card card card-p">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
            <div>
              <span class="pill" :class="priorityPill[expandedTask.priority]">{{ expandedTask.priority }}</span>
              <span class="detail-name">{{ expandedTask.name }}</span>
            </div>
            <button class="btn-icon" @click="expandedId = null">✕</button>
          </div>
          <div v-if="expandedTask.subtasks.length" class="subtask-detail">
            <div class="label-caps" style="margin-bottom:8px;">Sub-tasks</div>
            <div v-for="s in expandedTask.subtasks" :key="s.id" class="sub-detail-row">
              <div class="sub-cb-d" :class="{ done: s.done }" @click="store.toggleSubtask(expandedTask.id, s.id)">
                <svg v-if="s.done" width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,1.5" fill="none" stroke="#6BB896" stroke-width="2" stroke-linecap="round"/></svg>
              </div>
              <span :class="{ 'done-text': s.done }">{{ s.name }}</span>
              <span class="muted" style="margin-left:auto; font-size:11px;">{{ s.est }}</span>
              <span v-if="s.date" class="muted" style="font-size:11px;">{{ formatDate(s.date) }} {{ s.start }}–{{ s.end }}</span>
            </div>
          </div>
          <div v-else class="muted" style="font-size:12px;">No sub-tasks for this item.</div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store } from '../stores/store.js'

const emit = defineEmits(['open-add'])

const weekOffset = ref(0)
const expandedId = ref(null)

const todayStr = new Date().toISOString().split('T')[0]
const hours = ['8 am','9 am','10 am','11 am','12 pm','1 pm','2 pm','3 pm','4 pm','5 pm','6 pm','7 pm']
const hourNums = [8,9,10,11,12,13,14,15,16,17,18,19]

const weekDays = computed(() => {
  const today = new Date()
  const dow   = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - dow + (dow === 0 ? -6 : 1) + weekOffset.value * 7)
  const mns = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const ds = d.toISOString().split('T')[0]
    return { dow:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()], num:d.getDate(), date:ds, isToday:ds===todayStr }
  })
})

const weekLabel = computed(() => {
  const d = weekDays.value
  const mns = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const a = new Date(d[0].date), b = new Date(d[6].date)
  return `${mns[a.getMonth()]} ${d[0].num} – ${mns[b.getMonth()]} ${d[6].num}, ${b.getFullYear()}`
})

function shiftWeek(dir) { weekOffset.value += dir }

function tasksForDay(date) {
  return store.tasks.filter(t => t.due === date && !t.done)
}

function subtaskEventsForHour(date, hourIdx) {
  const h = hourNums[hourIdx]
  const events = []
  store.tasks.forEach(task => {
    task.subtasks.forEach(sub => {
      if (sub.date !== date || !sub.start) return
      const [sh, sm] = sub.start.split(':').map(Number)
      const [eh, em] = sub.end.split(':').map(Number)
      if (sh === h) {
        const topPct   = (sm / 60) * 100
        const durMins  = (eh * 60 + em) - (sh * 60 + sm)
        const heightPct = Math.min((durMins / 60) * 100, 200)
        events.push({ id: sub.id, name: sub.name, type: task.type, topPct, heightPct })
      }
    })
  })
  return events
}

const expandedTask = computed(() => expandedId.value ? store.tasks.find(t => t.id === expandedId.value) : null)
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function evClass(type) {
  return { reading:'ev-read', assignment:'ev-assign', project:'ev-project', studying:'ev-study', revision:'ev-read', other:'ev-other' }[type] || 'ev-other'
}

const priorityPill = { high:'pill-red', medium:'pill-amber', low:'pill-green' }

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

const legends = [
  { label:'Assignment', cls:'ev-assign' },
  { label:'Reading',    cls:'ev-read'   },
  { label:'Project',    cls:'ev-project'},
  { label:'Studying',   cls:'ev-study'  },
  { label:'Deadline',   cls:'ev-dead'   },
]

function exportPDF() {
  alert('PDF export — html2pdf.js would trigger here.\nIn production: import html2pdf from "html2pdf.js" and call html2pdf().from(document.getElementById("schedule-print")).save()')
}
</script>

<style scoped>
.schedule   { min-height: calc(100vh - 54px); background: var(--bg); }
.sched-wrap { max-width: 1100px; margin: 0 auto; padding: 32px 28px; }

.sched-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.sched-btns   { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }

.pdf-btn { background:var(--blue-bg); color:#5A9ACA; border:1px solid rgba(58,107,154,.2); }
.pdf-btn:hover { background:rgba(58,107,154,.2); }

.week-grid { border:1px solid var(--border); border-radius:12px; overflow:hidden; background:var(--surface); margin-bottom:12px; }

.wg-head { display:grid; grid-template-columns:56px repeat(7,1fr); background:var(--surface2); border-bottom:1px solid var(--border); }
.wg-time-col { padding:10px 8px; text-align:right; font-size:10px; color:var(--muted); }
.wg-day-head { padding:10px 8px; text-align:center; border-left:1px solid var(--border); display:flex; flex-direction:column; align-items:center; gap:2px; }
.wg-day-head.today { background:rgba(74,123,95,.06); }
.wg-dow  { font-size:10px; font-weight:500; color:var(--muted); letter-spacing:.05em; }
.wg-num  { font-size:15px; font-weight:600; color:var(--text); }
.wg-day-head.today .wg-num { color:var(--accent); }
.today-badge { font-size:9px; font-weight:600; color:var(--accent); background:var(--accent-l); padding:1px 6px; border-radius:3px; }

.wg-allday { display:grid; grid-template-columns:56px repeat(7,1fr); border-bottom:1px solid var(--border); min-height:36px; }
.wg-allday-cell { border-left:1px solid var(--border); padding:3px 3px; display:flex; flex-direction:column; gap:2px; }
.wg-allday-cell.today { background:rgba(74,123,95,.04); }
.allday-event { font-size:10px; font-weight:500; border-radius:4px; padding:2px 5px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; cursor:pointer; border-left:2px solid; }

.wg-body { display:flex; flex-direction:column; }
.wg-row  { display:grid; grid-template-columns:56px repeat(7,1fr); }
.wg-time-col { padding:6px 8px 0 0; text-align:right; font-size:9px; color:var(--muted); border-bottom:1px solid var(--border); }
.wg-cell { position:relative; height:52px; border-left:1px solid var(--border); border-bottom:1px solid var(--border); transition:background .15s; }
.wg-cell:hover { background:var(--surface2); }
.wg-cell.today { background:rgba(74,123,95,.03); }

.time-event { position:absolute; left:2px; right:2px; border-radius:4px; padding:2px 5px; font-size:9px; font-weight:500; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; z-index:1; border-left:2px solid; }

.ev-assign  { background:rgba(74,123,95,.18);  color:#6BB896; border-color:var(--accent); }
.ev-read    { background:rgba(58,107,154,.18); color:#5A9ACA; border-color:var(--blue);   }
.ev-project { background:rgba(123,94,167,.18); color:#9B7EC7; border-color:var(--purple); }
.ev-study   { background:rgba(196,131,44,.18); color:#D4933C; border-color:var(--amber);  }
.ev-dead    { background:rgba(192,60,44,.18);  color:#E05A4A; border-color:var(--red);    }
.ev-other   { background:var(--surface3);      color:var(--muted2); border-color:var(--muted); }

.legend { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:16px; }
.legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--muted2); }
.legend-dot  { width:10px; height:10px; border-radius:2px; border-left:2px solid; }

.detail-card { margin-top:4px; }
.detail-name { font-size:15px; font-weight:600; color:var(--text); margin-left:10px; }
.sub-detail-row { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid var(--border); font-size:12px; color:var(--text); }
.sub-detail-row:last-child { border-bottom:none; }
.sub-cb-d { width:16px; height:16px; border-radius:3px; border:1px solid var(--border2); flex-shrink:0; display:flex; align-items:center; justify-content:center; cursor:pointer; }
.sub-cb-d.done { background:var(--accent-l); border-color:var(--accent); }
.done-text { text-decoration:line-through; color:var(--muted); }

.expand-enter-active { animation:expandIn .2s ease; }
.expand-leave-active { animation:expandIn .15s ease reverse; }
@keyframes expandIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
</style>
