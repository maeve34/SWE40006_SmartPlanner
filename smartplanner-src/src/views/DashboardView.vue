<template>
  <div class="dash-page">
    <AppNavbar/>
    <AddTaskModal :show="showModal" @saved="activeFilter='all'" @close="showModal=false"/>

    <Teleport to="body">
      <Transition name="detail-fade">
        <div v-if="selectedTask" class="detail-overlay" @click.self="selectedTask=null">
          <div class="detail-modal">
            <div class="detail-head">
              <div>
                <p class="detail-kicker">{{ selectedTask.type || 'task' }}</p>
                <h2 class="detail-title">{{ selectedTask.title }}</h2>
              </div>
              <button class="detail-close" @click="selectedTask=null">x</button>
            </div>

            <div class="detail-grid">
              <div class="detail-block">
                <span>Due date</span>
                <strong>{{ formatDate(selectedTask.due) }}</strong>
              </div>
              <div class="detail-block">
                <span>Priority</span>
                <strong>{{ selectedTask.priority }}</strong>
              </div>
              <div class="detail-block">
                <span>Status</span>
                <strong>{{ selectedTask.done ? 'Completed' : selectedTask.due < todayISO ? 'Overdue' : 'Active' }}</strong>
              </div>
            </div>

            <div class="detail-section">
              <p class="detail-label">Notes</p>
              <p class="detail-copy">{{ selectedTask.notes || 'No notes added.' }}</p>
            </div>

            <div class="detail-section">
              <p class="detail-label">Subtasks</p>
              <div v-if="selectedTask.subtasks?.length" class="detail-subtasks">
                <div v-for="s in selectedTask.subtasks" :key="s.id" class="detail-subtask" :class="{ done: s.done }">
                  <button class="task-cb" @click="tasks.toggleSubtask(selectedTask.id, s.id)">
                    <span v-if="s.done" class="cb-check">✓</span>
                  </button>
                  <div>
                    <div class="detail-sub-name">{{ s.title }}</div>
                    <div class="detail-sub-meta">{{ formatDate(s.date) }}{{ s.start ? `, ${s.start}` : '' }}{{ s.end ? ` - ${s.end}` : '' }}</div>
                  </div>
                </div>
              </div>
              <p v-else class="detail-copy">No subtasks for this task.</p>
            </div>

            <div class="detail-actions">
              <button class="btn btn-ghost" @click="selectedTask=null">Close</button>
              <button class="btn btn-primary" @click="tasks.toggleDone(selectedTask.id)">{{ selectedTask.done ? 'Mark incomplete' : 'Mark done' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="dash-wrap">
      <div class="dash-header">
        <div>
          <h1 class="dash-h">
            Good day, {{ auth.user?.name }} <Sparkle size="20" />
          </h1>
          <p class="dash-sub">
            {{ todayStr }} - {{ tasks.totalPending }} tasks pending
          </p>
        </div>
        <button class="btn btn-primary" @click="showModal = true">
          <Plus size="15" /> Add task
        </button>
      </div>

      <div class="dash-layout">
        <div class="dash-main">
          <!-- Week calendar -->
          <div class="card week-strip">
            <div class="ws-header">
              <button class="wsnav" :disabled="!canGoPrevious" @click="shiftWeek(-1)">&lt;<ChevronLeft /></button>
              <span class="ws-label">{{ weekLabel }}</span>
              <button class="wsnav" @click="shiftWeek(1)">&gt;<ChevronRight /></button>
            </div>
            <div class="ws-days">
              <button v-for="d in weekDays" :key="d.iso"
                      class="ws-day"
                      :disabled="d.isPast"
                      :class="{ today: d.isToday, selected: d.iso === selectedDate, 'has-task': d.hasTasks, past: d.isPast }"
                      @click="selectDate(d.iso)">
                <span class="wsd-dow">{{ d.dow }}</span>
                <span class="wsd-num">{{ d.num }}</span>
                <span class="wsd-note">{{ d.isToday ? 'Today' : d.isPast ? 'Past' : 'Available' }}</span>
                <span v-if="d.hasTasks" class="wsd-dot"></span>
              </button>
            </div>
          </div>

          <!-- Task filter -->
          <div class="filter-bar">
            <button
              v-for="f in filters"
              :key="f.key"
              class="fchip"
              :class="{ active: activeFilter === f.key }"
              @click="activeFilter = f.key"
            >
              {{ f.label }}
            </button>
          </div>

          <TransitionGroup name="task-list" tag="div" class="task-list">
            <div v-for="t in filteredTasks" :key="t.id" class="card task-item" :class="{ done: t.done }" @click="selectedTask=t">
              <button class="task-cb" @click.stop="tasks.toggleDone(t.id)">
                <span v-if="t.done" class="cb-check">✓</span>
              </button>
              <div class="task-body">
                <div class="task-name">{{ t.title }}</div>
                <div class="task-meta">
                  <span><Calendar size="12" /> {{ formatDate(t.due) }}</span>
                  <span v-if="t.type"> - {{ t.type }}</span>
                  <span v-if="t.subtasks?.length" class="pill pill-gray"
                    >{{ t.subtasks.length }} subtasks</span
                  >
                </div>
              </div>
              <span class="pill" :class="ppill[t.priority]">{{
                t.priority
              }}</span>
              <div class="task-acts">
                <button class="tact-del" @click="tasks.deleteTask(t.id)">
                  <X size="12" />
                </button>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="filteredTasks.length === 0" class="empty-state">
            <p class="es-icon"><ClipboardList /></p>
            <p class="es-text">No tasks here yet.</p>
            <button
              class="btn btn-primary"
              style="margin-top: 12px"
              @click="showModal = true"
            >
              Add your first task
            </button>
          </div>

          <button class="add-row" @click="showModal = true">
            + Add new task
          </button>
        </div>

        <aside class="dash-side">
          <div class="card side-card">
            <p class="sc-label">This week</p>
            <div class="stat-grid">
              <div class="stat-block">
                <div class="sn" style="color: var(--accent)">
                  {{ tasks.totalDone }}
                </div>
                <div class="sl">Done</div>
              </div>
              <div class="stat-block">
                <div class="sn" style="color: #e05a4e">
                  {{ tasks.totalPending }}
                </div>
                <div class="sl">Pending</div>
              </div>
              <div class="stat-block">
                <div class="sn" style="color: #d4933c">
                  {{ tasks.highPriority }}
                </div>
                <div class="sl">High priority</div>
              </div>
              <div class="stat-block">
                <div class="sn" style="color: #5a9aca">
                  {{ tasks.tasks.length }}
                </div>
                <div class="sl">Total</div>
              </div>
            </div>
          </div>

          <div class="card side-card">
            <p class="sc-label">Upcoming deadlines</p>
            <div class="deadline-list">
              <div v-for="t in upcomingDeadlines" :key="t.id" class="dl-item">
                <span class="dl-name">{{ t.title }}</span>
                <span class="pill" :class="ppill[t.priority]">{{
                  formatDate(t.due)
                }}</span>
              </div>
              <p
                v-if="!upcomingDeadlines.length"
                style="font-size: 12px; color: var(--muted)"
              >
                No upcoming deadlines.
              </p>
            </div>
          </div>

          <button
            class="btn btn-primary"
            style="width: 100%"
            @click="showModal = true"
          >
            + Add task
          </button>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import AppNavbar from "@/components/AppNavbar.vue";
import AddTaskModal from "@/components/AddTaskModal.vue";
import { useAuthStore } from "@/stores/index.js";
import { useTaskStore } from "@/stores/index.js";
import {
  Sparkle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  ClipboardList,
  X,
} from "@lucide/vue";

const auth = useAuthStore()
const tasks = useTaskStore()
const showModal = ref(false)
const activeFilter = ref('all')
const selectedDate = ref(toLocalISO(new Date()))
const weekOffset = ref(0)
const selectedTask = ref(null)

const ppill = { high:'pill-red', medium:'pill-amber', low:'pill-green', undefined:'pill-gray' }
const filters = [
  { key:'all', label:'All tasks' },
  { key:'today', label:'Today' },
  { key:'high', label:'High' },
  { key:'medium', label:'Medium' },
  { key:'low', label:'Low' },
  { key:'reading', label:'Reading' },
  { key:'studying', label:'Studying' },
  { key:'revision', label:'Revision' },
  { key:'assignment', label:'Assignment' },
  { key:'project', label:'Project' },
  { key:'other', label:'Other' },
  { key:'completed', label:'Completed' },
  { key:'incomplete', label:'Incomplete' },
]

function toLocalISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getWeekStart(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + offset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysBetween(fromISO, toISO) {
  if (!fromISO) return Number.POSITIVE_INFINITY
  return Math.floor((parseLocalDate(toISO) - parseLocalDate(fromISO)) / 86400000)
}

const todayISO = computed(() => toLocalISO(new Date()))
const todayStr = computed(() => new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))
const activeTasks = computed(() => tasks.tasks.filter(t => !t.done && t.due >= todayISO.value))
const recentCompletedTasks = computed(() => tasks.tasks.filter(t => t.done && daysBetween(t.due, todayISO.value) <= 7))

const weekDays = computed(() => {
  const start = getWeekStart(weekOffset.value)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = toLocalISO(d)
    return {
      iso,
      dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
      num: d.getDate(),
      isToday: iso === todayISO.value,
      isPast: iso < todayISO.value,
      hasTasks: tasks.tasksForDate(iso).length > 0
    }
  })
})

const canGoPrevious = computed(() => {
  const previousStart = getWeekStart(weekOffset.value - 1)
  const previousEnd = new Date(previousStart)
  previousEnd.setDate(previousStart.getDate() + 6)
  return toLocalISO(previousEnd) >= todayISO.value
})

const weekLabel = computed(() => {
  const s = parseLocalDate(weekDays.value[0].iso)
  const e = parseLocalDate(weekDays.value[6].iso)
  return `${s.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} - ${e.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}`
})

function shiftWeek(dir) {
  if (dir < 0 && !canGoPrevious.value) return
  weekOffset.value += dir
}

function selectDate(iso) {
  if (iso < todayISO.value) return
  selectedDate.value = iso
  activeFilter.value = 'selected'
}

function formatDate(iso) {
  if (!iso) return ''
  return parseLocalDate(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
}

// Filter tasks
const filteredTasks = computed(() => {
  let list = activeTasks.value
  switch(activeFilter.value) {
    case 'selected': list = activeTasks.value.filter(t => t.due === selectedDate.value); break
    case 'today': list = activeTasks.value.filter(t => t.due === todayISO.value); break
    case 'high': list = list.filter(t => t.priority === 'high'); break
    case 'medium': list = list.filter(t => t.priority === 'medium'); break
    case 'low': list = list.filter(t => t.priority === 'low'); break
    case 'reading': list = list.filter(t => t.type === 'reading'); break
    case 'studying': list = list.filter(t => t.type === 'studying'); break
    case 'revision': list = list.filter(t => t.type === 'revision'); break
    case 'assignment': list = list.filter(t => t.type === 'assignment'); break
    case 'project': list = list.filter(t => t.type === 'project'); break
    case 'other': list = list.filter(t => t.type === 'other'); break
    case 'completed': list = recentCompletedTasks.value; break
    case 'incomplete': list = activeTasks.value; break
  }
  return list;
});

const upcomingDeadlines = computed(() => activeTasks.value
  .sort((a,b) => a.due.localeCompare(b.due))
  .slice(0, 5)
)
</script>

<style scoped>
.dash-page { min-height:100vh;background:var(--bg); }
.dash-wrap { max-width:1100px;margin:0 auto;padding:80px 28px 40px; }
.dash-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px; }
.dash-h { font-family:'Instrument Serif',serif;font-size:30px;font-weight:400;color:var(--text); }
.dash-sub { font-size:13px;color:var(--muted2);margin-top:4px; }
.dash-layout { display:grid;grid-template-columns:1fr 270px;gap:20px; }
.week-strip { padding:14px 18px;margin-bottom:16px; }
.ws-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:12px; }
.ws-label { font-size:13px;font-weight:500;color:var(--text); }
.wsnav { background:none;border:1px solid var(--border2);color:var(--muted2);width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .15s; }
.wsnav:hover { color:var(--text);border-color:var(--muted); }
.wsnav:disabled { opacity:.35;cursor:not-allowed; }
.ws-days { display:grid;grid-template-columns:repeat(7,1fr);gap:6px; }
.ws-day { min-height:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 4px;border-radius:8px;border:1px solid transparent;background:var(--surface2);cursor:pointer;transition:all .15s;position:relative;font-family:'Geist',sans-serif; }
.ws-day:hover { background:var(--surface3);border-color:var(--border2); }
.ws-day.selected { background:var(--surface3);border-color:var(--accent-bd); }
.ws-day.today { background:var(--accent);border-color:var(--accent); }
.ws-day.past { opacity:.4;background:transparent;border-color:var(--border);cursor:not-allowed; }
.ws-day.past:hover { background:transparent;border-color:var(--border); }
.wsd-dow { font-size:10px;font-weight:500;color:var(--muted);letter-spacing:.04em; }
.wsd-num { font-size:16px;font-weight:700;color:var(--muted2); }
.wsd-note { font-size:9px;color:var(--muted); }
.ws-day.today .wsd-dow,.ws-day.today .wsd-num,.ws-day.today .wsd-note { color:#fff; }
.wsd-dot { position:absolute;bottom:6px;width:4px;height:4px;border-radius:50%;background:var(--accent); }
.ws-day.today .wsd-dot { background:rgba(255,255,255,.7); }
.filter-bar { display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px; }
.fchip { padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid var(--border2);color:var(--muted2);background:transparent;cursor:pointer;transition:all .15s;font-family:'Geist',sans-serif; }
.fchip:hover { color:var(--text);border-color:var(--muted); }
.fchip.active { background:var(--surface3);color:var(--text);border-color:var(--muted2); }
.task-list { display:flex;flex-direction:column;gap:6px; }
.task-item { padding:12px 14px;display:flex;align-items:center;gap:12px;transition:all .15s;cursor:pointer;border-radius:8px; }
.task-item:hover { border-color:var(--border2); }
.task-cb { width:20px;height:20px;border-radius:5px;border:1.5px solid var(--border2);flex-shrink:0;display:flex;align-items:center;justify-content:center;background:transparent;cursor:pointer;transition:all .15s; }
.task-item.done .task-cb { background:var(--accent);border-color:var(--accent); }
.cb-check { font-size:11px;color:#fff;font-weight:700; }
.task-body { flex:1;min-width:0; }
.task-name { font-size:13px;font-weight:500;color:var(--text);margin-bottom:2px; }
.task-item.done .task-name { text-decoration:line-through;color:var(--muted); }
.task-meta { font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
.task-acts { opacity:0;transition:opacity .15s; }
.task-item:hover .task-acts { opacity:1; }
.tact-del { background:var(--red-bg);border:1px solid var(--red-bd);color:#E05A4E;width:26px;height:26px;border-radius:5px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center; }
.empty-state { text-align:center;padding:40px 20px; }
.es-text { font-size:13px;color:var(--muted); }
.add-row { width:100%;padding:12px;border:1.5px dashed var(--border2);background:none;color:var(--muted);border-radius:8px;cursor:pointer;font-size:13px;font-family:'Geist',sans-serif;margin-top:8px;transition:all .15s; }
.add-row:hover { border-color:var(--accent);color:var(--accent); }
.dash-side { display:flex;flex-direction:column;gap:12px; }
.side-card { padding:16px; }
.sc-label { font-size:10px;font-weight:500;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;margin-bottom:12px; }
.stat-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px; }
.stat-block { background:var(--surface2);border-radius:7px;padding:10px 12px;border:1px solid var(--border); }
.sn { font-size:22px;font-weight:700; }
.sl { font-size:10px;color:var(--muted);margin-top:2px; }
.deadline-list { display:flex;flex-direction:column;gap:7px; }
.dl-item { display:flex;align-items:center;justify-content:space-between;gap:8px; }
.dl-name { font-size:12px;color:var(--text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.task-list-enter-active,.task-list-leave-active { transition:all .2s ease; }
.task-list-enter-from,.task-list-leave-to { opacity:0;transform:translateY(-4px); }
.detail-overlay { position:fixed;inset:0;z-index:600;background:rgba(0,0,0,.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px; }
.detail-modal { width:520px;max-width:100%;max-height:86vh;overflow:auto;background:var(--surface);border:1px solid var(--border2);border-radius:14px;padding:24px; }
.detail-head { display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px; }
.detail-kicker { font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px; }
.detail-title { font-size:20px;color:var(--text);font-weight:600; }
.detail-close { width:30px;height:30px;border-radius:7px;border:1px solid var(--border2);background:var(--surface2);color:var(--muted2);cursor:pointer;font-size:16px; }
.detail-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px; }
.detail-block { background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px; }
.detail-block span,.detail-label { display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:5px; }
.detail-block strong { font-size:13px;color:var(--text);text-transform:capitalize; }
.detail-section { margin-top:16px; }
.detail-copy { font-size:13px;color:var(--muted2);line-height:1.6; }
.detail-subtasks { display:flex;flex-direction:column;gap:8px; }
.detail-subtask { display:flex;align-items:center;gap:10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px; }
.detail-subtask.done .detail-sub-name { text-decoration:line-through;color:var(--muted); }
.detail-sub-name { font-size:13px;font-weight:600;color:var(--text); }
.detail-sub-meta { font-size:11px;color:var(--muted);margin-top:2px; }
.detail-actions { display:flex;gap:8px;margin-top:20px; }
.detail-actions .btn { flex:1; }
.detail-fade-enter-active,.detail-fade-leave-active { transition:opacity .18s ease; }
.detail-fade-enter-from,.detail-fade-leave-to { opacity:0; }
</style>
