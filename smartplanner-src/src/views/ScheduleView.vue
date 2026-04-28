<template>
  <div class="sched-page">
    <AppNavbar />
    <AddTaskModal :show="showModal" @close="showModal = false" />

    <div class="sched-wrap">
      <div class="sched-header">
        <div>
          <p class="sh-eye">Timetable</p>
          <h1 class="sh-h">{{ weekLabel }}</h1>
        </div>
        <div class="sched-actions">
          <button class="btn btn-ghost" @click="weekOffset--">
            <ChevronLeft size="13" />Prev
          </button>
          <button class="btn btn-ghost" @click="weekOffset++">
            Next <ChevronRight size="13" />
          </button>
          <button class="btn btn-primary" @click="showModal = true">
            <Plus size="13" /> Add task
          </button>
        </div>
      </div>

      <div class="week-grid" id="week-grid">
        <div class="wg-row wg-head-row">
          <div class="wg-time-label"></div>
          <div
            v-for="d in weekDays"
            :key="d.iso"
            class="wg-head-cell"
            :class="{ today: d.isToday }"
          >
            <span class="whc-dow">{{ d.dow }}</span>
            <span class="whc-num">{{ d.num }}</span>
            <span v-if="d.hasTasks" class="whc-count">{{ d.taskCount }}</span>
          </div>
        </div>

        <div class="wg-tasks-row">
          <div class="wg-time-label task-label">Tasks</div>
          <div
            v-for="d in weekDays"
            :key="d.iso"
            class="wg-day-col"
            :class="{ today: d.isToday }"
          >
            <div
              v-for="t in d.tasks"
              :key="t.id"
              class="wg-event"
              :class="typeClass(t.type)"
            >
              <span class="ev-name">{{ t.title }}</span>
              <span class="pill ev-pill" :class="ppill[t.priority]">{{
                t.priority
              }}</span>
            </div>
            <div
              v-for="s in d.subtasks"
              :key="s.key"
              class="wg-event ev-subtask"
            >
              <span class="ev-name">{{ s.title }}</span>
              <span class="ev-time"
                >{{ s.start || "--:--" }}{{ s.end ? ` - ${s.end}` : "" }}</span
              >
            </div>
            <div
              v-if="d.tasks.length === 0 && d.subtasks.length === 0"
              class="wg-empty"
              @click="showModal = true"
            >
              <span>+</span>
            </div>
          </div>
        </div>
      </div>

      <div class="legend">
        <div v-for="l in legend" :key="l.label" class="leg-item">
          <div class="leg-dot" :style="{ background: l.color }"></div>
          {{ l.label }}
        </div>
      </div>

      <div class="week-task-list">
        <h2 class="wtl-title">All tasks this week</h2>
        <div
          v-for="d in weekDays.filter(
            (d) => d.tasks.length || d.subtasks.length,
          )"
          :key="d.iso"
          class="wtl-day"
        >
          <div class="wtl-day-label">
            <span :class="{ today: d.isToday }">{{ d.dow }} {{ d.num }}</span>
            <span v-if="d.isToday" class="today-badge">Today</span>
          </div>
          <div v-for="t in d.tasks" :key="t.id" class="card wtl-task">
            <div class="wt-dot" :class="typeClass(t.type)"></div>
            <div class="wt-body">
              <div class="wt-name">{{ t.title }}</div>
              <div class="wt-meta">
                {{ t.type }} - {{ t.notes || "No notes" }}
              </div>
              <div v-if="t.subtasks?.length" class="wt-subs">
                <span v-for="s in t.subtasks" :key="s.id" class="wt-sub">
                  {{ s.title }}{{ s.start ? `, ${s.start}` : ""
                  }}{{ s.end ? `-${s.end}` : "" }}
                </span>
              </div>
            </div>
            <span class="pill" :class="ppill[t.priority]">{{
              t.priority
            }}</span>
            <button
              v-if="!t.done"
              class="wt-done-btn"
              @click="tasks.toggleDone(t.id)"
            >
              Mark done
            </button>
          </div>
          <div
            v-for="s in d.subtasks"
            :key="s.key"
            class="card wtl-task subtask-task"
          >
            <div class="wt-dot ev-subtask"></div>
            <div class="wt-body">
              <div class="wt-name">{{ s.title }}</div>
              <div class="wt-meta">
                {{ s.parentTitle }} - {{ s.start || "No start time"
                }}{{ s.end ? ` - ${s.end}` : "" }}
              </div>
            </div>
            <button
              class="wt-done-btn"
              @click="tasks.toggleSubtask(s.parentId, s.id)"
            >
              {{ s.done ? "Undo" : "Done" }}
            </button>
          </div>
        </div>
        <div
          v-if="!weekDays.some((d) => d.tasks.length || d.subtasks.length)"
          class="empty-week"
        >
          <p>No tasks scheduled this week.</p>
          <button
            class="btn btn-primary"
            style="margin-top: 12px"
            @click="showModal = true"
          >
            Add a task
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import AppNavbar from "@/components/AppNavbar.vue";
import AddTaskModal from "@/components/AddTaskModal.vue";
import { useTaskStore } from "@/stores/index.js";
import { ChevronLeft, ChevronRight, Plus } from "@lucide/vue";

const tasks = useTaskStore();
const showModal = ref(false);
const weekOffset = ref(0);

const ppill = {
  high: "pill-red",
  medium: "pill-amber",
  low: "pill-green",
  undefined: "pill-gray",
};
const legend = [
  { label: "Assignment", color: "rgba(78,124,95,.6)" },
  { label: "Reading", color: "rgba(58,107,154,.6)" },
  { label: "Project", color: "rgba(123,94,167,.6)" },
  { label: "Revision", color: "rgba(196,131,44,.6)" },
  { label: "Subtask", color: "rgba(58,107,154,.6)" },
  { label: "Other", color: "rgba(106,106,106,.6)" },
];

function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function typeClass(type) {
  const map = {
    assignment: "ev-assign",
    reading: "ev-read",
    project: "ev-project",
    revision: "ev-revision",
    studying: "ev-studying",
    other: "ev-other",
  };
  return map[type] || "ev-other";
}

const weekDays = computed(() => {
  const today = new Date();
  const todayISO = toLocalISO(today);
  const base = new Date(today);
  base.setDate(today.getDate() - today.getDay() + weekOffset.value * 7);
  base.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = toLocalISO(d);
    const dayTasks = tasks.tasks.filter((t) => t.due === iso);
    const daySubtasks = tasks.tasks.flatMap((t) =>
      (t.subtasks || [])
        .filter((s) => s.date === iso)
        .map((s) => ({
          ...s,
          key: `${t.id}-${s.id}`,
          parentId: t.id,
          parentTitle: t.title,
        })),
    );

    return {
      iso,
      isToday: iso === todayISO,
      dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
      num: d.getDate(),
      hasTasks: dayTasks.length + daySubtasks.length > 0,
      taskCount: dayTasks.length + daySubtasks.length,
      tasks: dayTasks,
      subtasks: daySubtasks,
    };
  });
});

const weekLabel = computed(() => {
  const s = parseLocalDate(weekDays.value[0].iso);
  const e = parseLocalDate(weekDays.value[6].iso);
  return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
});
</script>
<style scoped>
.sched-page {
  min-height: 100vh;
  background: var(--bg);
}
.sched-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 28px 60px;
}
.sched-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 22px;
}
.sh-eye {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.sh-h {
  font-family: "Instrument Serif", serif;
  font-size: 26px;
  font-weight: 400;
  color: var(--text);
}
.sched-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
.week-grid {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  margin-bottom: 16px;
}
.wg-row {
  display: grid;
  grid-template-columns: 76px repeat(7, minmax(112px, 1fr));
  min-width: 860px;
}
.wg-head-row {
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
}
.wg-time-label {
  border-right: 1px solid var(--border);
  padding: 10px 8px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  text-align: center;
}
.task-label {
  font-size: 11px;
  color: var(--muted);
}
.wg-head-cell {
  padding: 12px 8px;
  text-align: center;
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.wg-head-cell.today {
  background: rgba(78, 124, 95, 0.08);
}
.whc-dow {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.04em;
}
.whc-num {
  font-size: 18px;
  font-weight: 600;
  color: var(--muted2);
}
.wg-head-cell.today .whc-num {
  color: var(--accent);
}
.whc-count {
  font-size: 10px;
  background: var(--accent-bg);
  color: #6bb896;
  border: 1px solid var(--accent-bd);
  padding: 1px 6px;
  border-radius: 10px;
}
.wg-tasks-row {
  display: grid;
  grid-template-columns: 76px repeat(7, minmax(112px, 1fr));
  min-width: 860px;
  min-height: 160px;
}
.wg-day-col {
  border-left: 1px solid var(--border);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 160px;
}
.wg-day-col.today {
  background: rgba(78, 124, 95, 0.04);
}
.wg-event {
  border-radius: 6px;
  padding: 5px 7px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: default;
}
.ev-name {
  font-size: 10px;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ev-pill {
  font-size: 9px;
  padding: 1px 5px;
}
.ev-assign {
  background: rgba(78, 124, 95, 0.18);
  border-left: 2px solid var(--accent);
  color: #6bb896;
}
.ev-read {
  background: rgba(58, 107, 154, 0.18);
  border-left: 2px solid var(--blue);
  color: #5a9aca;
}
.ev-project {
  background: rgba(123, 94, 167, 0.18);
  border-left: 2px solid var(--purple);
  color: #9b7ec7;
}
.ev-revision {
  background: rgba(196, 131, 44, 0.18);
  border-left: 2px solid var(--amber);
  color: #d4933c;
}
.ev-studying {
  background: rgba(78, 124, 95, 0.18);
  border-left: 2px solid var(--accent);
  color: #6bb896;
}
.ev-other {
  background: var(--surface2);
  border-left: 2px solid var(--border2);
  color: var(--muted2);
}
.ev-subtask {
  background: rgba(58, 107, 154, 0.14);
  border-left: 2px solid var(--blue);
  color: #5a9aca;
}
.ev-time {
  font-size: 9px;
  color: var(--muted2);
}
.wg-empty {
  min-height: 126px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--border2);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}
.wg-empty:hover {
  background: var(--surface2);
  color: var(--muted);
}
.legend {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.leg-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--muted2);
}
.leg-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.week-task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.wtl-title {
  font-family: "Instrument Serif", serif;
  font-size: 20px;
  font-weight: 400;
  color: var(--text);
  margin-bottom: 16px;
}
.wtl-day {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wtl-day-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.wtl-day-label .today {
  color: var(--accent);
}
.today-badge {
  background: var(--accent-bg);
  color: #6bb896;
  border: 1px solid var(--accent-bd);
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 10px;
}
.wtl-task {
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.subtask-task {
  background: var(--surface2);
}
.wt-dot {
  width: 3px;
  border-radius: 2px;
  align-self: stretch;
  flex-shrink: 0;
  min-height: 16px;
}
.wt-body {
  flex: 1;
  min-width: 0;
}
.wt-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 2px;
}
.wt-meta {
  font-size: 11px;
  color: var(--muted);
}
.wt-subs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.wt-sub {
  background: var(--surface2);
  border: 1px solid var(--border2);
  color: var(--muted2);
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
}
.wt-done-btn {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-bd);
  color: #6bb896;
  cursor: pointer;
  font-family: "Geist", sans-serif;
  flex-shrink: 0;
  white-space: nowrap;
}
.empty-week {
  text-align: center;
  padding: 40px;
  color: var(--muted);
  font-size: 13px;
}
</style>
