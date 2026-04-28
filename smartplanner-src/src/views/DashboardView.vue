<template>
  <div class="dash-page">
    <AppNavbar />
    <AddTaskModal :show="showModal" @close="showModal = false" />

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
              <button class="wsnav" @click="shiftWeek(-1)">
                <ChevronLeft />
              </button>
              <span class="ws-label">{{ weekLabel }}</span>
              <button class="wsnav" @click="shiftWeek(1)">
                <ChevronRight />
              </button>
            </div>
            <div class="ws-days">
              <div
                v-for="d in weekDays"
                :key="d.iso"
                class="ws-day"
                :class="{
                  today: d.isToday,
                  selected: d.iso === selectedDate,
                  'has-task': d.hasTasks,
                }"
                @click="selectDate(d.iso)"
              >
                <span class="wsd-dow">{{ d.dow }}</span>
                <span class="wsd-num">{{ d.num }}</span>
                <span v-if="d.hasTasks" class="wsd-dot"></span>
              </div>
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
            <div
              v-for="t in filteredTasks"
              :key="t.id"
              class="card task-item"
              :class="{ done: t.done }"
            >
              <button class="task-cb" @click="tasks.toggleDone(t.id)">
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

const auth = useAuthStore();
const tasks = useTaskStore();
const showModal = ref(false);
const activeFilter = ref("all");
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const weekOffset = ref(0);

// pill color
const ppill = {
  high: "pill-red",
  medium: "pill-amber",
  low: "pill-green",
  undefined: "pill-gray",
};

const filters = [
  { key: "all", label: "All tasks" },
  { key: "today", label: "Today" },
  { key: "high", label: "🔴 High" },
  { key: "medium", label: "🟡 Medium" },
  { key: "low", label: "🟢 Low" },
  { key: "reading", label: "Reading" },
  { key: "studying", label: "Studying" },
  { key: "revision", label: "Revision" },
  { key: "assignment", label: "Assignment" },
  { key: "project", label: "Project" },
  { key: "other", label: "Other" },
  { key: "completed", label: "Completed" },
  { key: "incomplete", label: "Incomplete" },
];

function getWeekStart(offset = 0) {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

const weekDays = computed(() => {
  const start = getWeekStart(weekOffset.value);
  const today = new Date().toISOString().split("T")[0];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    return {
      iso,
      dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
      num: d.getDate(),
      isToday: iso === today,
      hasTasks: tasks.tasksForDate(iso).length > 0,
    };
  });
});

const weekLabel = computed(() => {
  const days = weekDays.value;
  const s = new Date(days[0].iso);
  const e = new Date(days[6].iso);
  return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
});

function shiftWeek(dir) {
  weekOffset.value += dir;
}

function selectDate(iso) {
  selectedDate.value = iso;
  activeFilter.value = "selected";
}

const todayStr = computed(() =>
  new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
);

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Filter tasks
const filteredTasks = computed(() => {
  let list = tasks.tasks;
  const today = new Date().toISOString().split("T")[0];
  switch (activeFilter.value) {
    case "selected":
      list = list.filter((t) => t.due === selectedDate.value);
      break;
    case "today":
      list = list.filter((t) => t.due === today);
      break;
    case "high":
      list = list.filter((t) => t.priority === "high");
      break;
    case "medium":
      list = list.filter((t) => t.priority === "medium");
      break;
    case "low":
      list = list.filter((t) => t.priority === "low");
      break;
    case "reading":
      list = list.filter((t) => t.type === "reading");
      break;
    case "studying":
      list = list.filter((t) => t.type === "studying");
      break;
    case "revision":
      list = list.filter((t) => t.type === "revision");
      break;
    case "assignment":
      list = list.filter((t) => t.type === "assignment");
      break;
    case "project":
      list = list.filter((t) => t.type === "project");
      break;
    case "other":
      list = list.filter((t) => t.type === "other");
      break;
    case "completed":
      list = list.filter((t) => t.done);
      break;
    case "incomplete":
      list = list.filter((t) => !t.done);
      break;
  }
  return list;
});

const upcomingDeadlines = computed(() => {
  const today = new Date();
  return tasks.tasks
    .filter((t) => !t.done && t.due)
    .sort((a, b) => new Date(a.due) - new Date(b.due))
    .slice(0, 5);
});
</script>
<style scoped>
.dash-page {
  min-height: 100vh;
  background: var(--bg);
}
.dash-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 28px 40px;
}
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.dash-h {
  font-family: "Instrument Serif", serif;
  font-size: 30px;
  font-weight: 400;
  color: var(--text);
}
.dash-sub {
  font-size: 13px;
  color: var(--muted2);
  margin-top: 4px;
}
.dash-layout {
  display: grid;
  grid-template-columns: 1fr 270px;
  gap: 20px;
}
.week-strip {
  padding: 14px 18px;
  margin-bottom: 16px;
}
.ws-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.ws-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}
.wsnav {
  background: none;
  border: 1px solid var(--border2);
  color: var(--muted2);
  width: 26px;
  height: 26px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.wsnav:hover {
  color: var(--text);
  border-color: var(--muted);
}
.ws-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}
.ws-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.ws-day:hover {
  background: var(--surface2);
}
.ws-day.selected {
  background: var(--surface3);
  border: 1px solid var(--border2);
}
.ws-day.today {
  background: var(--accent);
}
.wsd-dow {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.04em;
}
.ws-day.today .wsd-dow {
  color: rgba(255, 255, 255, 0.7);
}
.wsd-num {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted2);
}
.ws-day.today .wsd-num {
  color: #fff;
}
.wsd-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
}
.ws-day.today .wsd-dot {
  background: rgba(255, 255, 255, 0.6);
}
.filter-bar {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.fchip {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border2);
  color: var(--muted2);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  font-family: "Geist", sans-serif;
}
.fchip:hover {
  color: var(--text);
  border-color: var(--muted);
}
.fchip.active {
  background: var(--surface3);
  color: var(--text);
  border-color: var(--muted2);
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.task-item {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.15s;
  cursor: default;
  border-radius: 8px;
}
.task-item:hover {
  border-color: var(--border2);
}
.task-cb {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 1.5px solid var(--border2);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}
.task-item.done .task-cb {
  background: var(--accent);
  border-color: var(--accent);
}
.cb-check {
  font-size: 11px;
  color: #fff;
  font-weight: 700;
}
.task-body {
  flex: 1;
  min-width: 0;
}
.task-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 2px;
}
.task-item.done .task-name {
  text-decoration: line-through;
  color: var(--muted);
}
.task-meta {
  font-size: 11px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.task-acts {
  opacity: 0;
  transition: opacity 0.15s;
}
.task-item:hover .task-acts {
  opacity: 1;
}
.tact-del {
  background: var(--red-bg);
  border: 1px solid var(--red-bd);
  color: #e05a4e;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-state {
  text-align: center;
  padding: 40px 20px;
}
.es-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.es-text {
  font-size: 13px;
  color: var(--muted);
}
.add-row {
  width: 100%;
  padding: 12px;
  border: 1.5px dashed var(--border2);
  background: none;
  color: var(--muted);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-family: "Geist", sans-serif;
  margin-top: 8px;
  transition: all 0.15s;
}
.add-row:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.dash-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.side-card {
  padding: 16px;
}
.sc-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.stat-block {
  background: var(--surface2);
  border-radius: 7px;
  padding: 10px 12px;
  border: 1px solid var(--border);
}
.sn {
  font-size: 22px;
  font-weight: 700;
}
.sl {
  font-size: 10px;
  color: var(--muted);
  margin-top: 2px;
}
.deadline-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.dl-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.dl-name {
  font-size: 12px;
  color: var(--text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.2s ease;
}
.task-list-enter-from,
.task-list-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
