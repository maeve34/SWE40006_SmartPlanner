<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="overlay" @click.self="$emit('close')">
        <Transition name="modal-slide" appear>
          <div class="modal" v-if="show">
            <template v-if="step === 1">
              <div class="mhead">
                <div>
                  <h2 class="mtitle">Add new task</h2>
                  <p class="msub">
                    Step 1{{ isComplex ? " of 3" : "" }} — Task details
                  </p>
                </div>
                <button class="xbtn" @click="$emit('close')">
                  <X size="13" />
                </button>
              </div>
              <div class="fg">
                <label>Task title</label
                ><input
                  v-model="form.title"
                  type="text"
                  placeholder="e.g. Portfolio - Part 1"
                  autofocus
                />
              </div>
              <div class="frow">
                <div class="fg">
                  <label>Due date</label>
                  <input v-model="form.due" type="date" :min="todayISO" />
                  <p v-if="error" class="error-text">{{ error }}</p>
                </div>
                <div class="fg">
                  <label>Task type</label>
                  <select v-model="form.type">
                    <option value="">Select…</option>
                    <option value="reading">Reading</option>
                    <option value="studying">Studying</option>
                    <option value="revision">Revision</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project / Portfolio</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div class="fg">
                <label>Priority</label>
                <div class="rg">
                  <label
                    class="ri"
                    v-for="p in ['high', 'medium', 'low']"
                    :key="p"
                  >
                    <input type="radio" v-model="form.priority" :value="p" />
                    <span :class="['rl', 'rl-' + p]">{{
                      p[0].toUpperCase() + p.slice(1)
                    }}</span>
                  </label>
                </div>
              </div>
              <div class="fg">
                <label
                  >Notes
                  <em
                    style="
                      text-transform: none;
                      letter-spacing: 0;
                      color: var(--muted);
                      font-style: normal;
                    "
                    >(optional)</em
                  >
                </label>
                <textarea
                  v-model="form.notes"
                  rows="2"
                  placeholder="Any extra details…"
                ></textarea>
              </div>
              <div class="mactions">
                <button class="btn btn-ghost" @click="$emit('close')">
                  Cancel
                </button>
                <button
                  class="btn btn-primary"
                  :disabled="!form.title || !form.due"
                  @click="next"
                >
                  {{ isComplex ? "Add subtasks" : "Save task" }}
                </button>
              </div>
            </template>

            <template v-if="step === 2">
              <div class="mhead">
                <div>
                  <h2 class="mtitle">Subtasks</h2>
                  <p class="msub">Step 2 of 3 — Break down your task</p>
                </div>
                <button class="xbtn" @click="$emit('close')">
                  <X size="13" />
                </button>
              </div>
              <div class="task-chip">
                <span class="tc-name">{{ form.title }}</span>
                <span class="pill" :class="ppill[form.priority]">{{
                  form.priority
                }}</span>
              </div>
              <div class="prompt-container">
                <label>Describe your task</label>
                <textarea v-model="aiPrompt" placeholder="eg: This assignment requires the development of a DevOps pipeline.."></textarea>
              </div>
              <p v-if="aiError" class="error-text">{{ aiError }}</p>
              <div class="ai-box">
                <div class="ai-hd">
                  <span class="ai-tag"><Sparkle size="10" /> AI SUBTASK GENERATOR</span>
                  <button
                    class="ai-btn"
                    :class="{ loading: aiLoading }"
                    @click="genAI"
                  >
                    <span v-if="!aiLoading">Generate with AI</span>
                    <span v-else class="spin"><RotateCcw size="12" /></span>
                  </button>
                </div>
                <p class="ai-desc">
                  Automatically breaks your task into subtasks with time estimates via OpenAI.
                </p>
                <div v-if="aiRows.length" class="ai-list">
                  <div v-for="(r, i) in aiRows" :key="i" class="ai-row">
                    <span class="ar-name">{{ r.name }}</span
                    ><span class="ar-est">{{ r.est }}</span>
                    <button class="ar-add" @click="addSub(r.name)">
                      <Plus size="13" />
                    </button>
                  </div>
                  <button
                    class="btn btn-ghost"
                    style="font-size: 11px; padding: 5px 12px; margin-top: 6px"
                    @click="acceptAll"
                  >
                    Accept all <ArrowRight size="13" />
                  </button>
                </div>
              </div>
              <hr class="div" />
              <div class="sub-list">
                <div v-for="(s, i) in form.subtasks" :key="i" class="sub-row">
                  <span class="sub-n">{{ i + 1 }}</span>
                  <input
                    v-model="form.subtasks[i]"
                    class="sub-inp"
                    :placeholder="'Subtask ' + (i + 1)"
                  />
                  <button class="sub-del" @click="form.subtasks.splice(i, 1)">
                    <X size="13" />
                  </button>
                </div>
              </div>
              <button class="add-sub" @click="form.subtasks.push('')">
                <Plus size="13" /> Add subtask manually
              </button>
              <div class="mactions">
                <button class="btn btn-ghost" @click="step = 1">
                  <ChevronLeft size="13" />Back
                </button>

                <!-- Show add subtask schedule button if subtask is not empty -->
                <button
                  v-if="form.subtasks.some((s) => s.trim())"
                  class="btn btn-primary"
                  @click="next"
                >
                  Add subtask schedule <ArrowRight size="13" />
                </button>
                <button v-else class="btn btn-primary" @click="save">
                  Save task <Check size="13" />
                </button>
              </div>
            </template>

            <!-- only direct user to schedule sub task if subtask is not empty -->
            <template v-if="step === 3 && form.subtasks.some((s) => s.trim())">
              <div class="mhead">
                <div>
                  <h2 class="mtitle">Schedule subtasks</h2>
                  <p class="msub">Step 3 of 3 — Assign dates & times</p>
                </div>
                <button class="xbtn" @click="$emit('close')">
                  <X size="13" />
                </button>
              </div>
              <div class="ss-list">
                <div
                  v-for="item in scheduledSubtasks"
                  :key="item.index"
                  class="ss-card"
                >
                  <div class="ss-name">{{ item.title }}</div>
                  <div class="ss-row">
                    <div class="fg" style="flex: 1.2">
                      <label>Date</label>
                      <input
                        type="date"
                        v-model="sDates[item.index]"
                        :min="todayISO"
                        :max="form.due"
                      />
                    </div>
                    <div class="fg" style="flex: 1">
                      <label>Start</label>
                      <input
                        type="time"
                        v-model="sStart[item.index]"
                        :min="minSubtaskTime(sDates[item.index])"
                      />
                    </div>
                    <div class="fg" style="flex: 1">
                      <label>End</label
                      ><input
                        type="time"
                        v-model="sEnd[item.index]"
                        :min="minSubtaskEndTime(item.index)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <p v-if="scheduleError" class="error-text">
                {{ scheduleError }}
              </p>
              <div class="mactions">
                <button class="btn btn-ghost" @click="step = 2">
                  <ChevronLeft size="13" /> Back
                </button>
                <button class="btn btn-primary" @click="save">
                  Save task <Check size="13" />
                </button>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
import { ref, computed, watch } from "vue";
import { useTaskStore } from "@/stores/index.js";
import {
  Check,
  ChevronLeft,
  ArrowRight,
  X,
  Sparkle,
  RotateCcw,
  Plus,
  Calendar,
} from "@lucide/vue";
const props = defineProps({ show: Boolean, defaultDate: String });
const emit = defineEmits(["close", "saved"]);
const tasks = useTaskStore();
const step = ref(1);
const error = ref("");
const aiRows = ref([]);
const aiLoading = ref(false);
const aiPrompt = ref();
const aiError = ref("");
const scheduleError = ref("");
const sDates = ref([]),
  sStart = ref([]),
  sEnd = ref([]);
const todayISO = toLocalISO(new Date());
function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function fresh(date) {
  return {
    title: "",
    due: date || todayISO,
    type: "",
    priority: "medium",
    notes: "",
    subtasks: [],
  };
}
const form = ref(fresh());
watch(
  () => props.show,
  (v) => {
    if (v) {
      step.value = 1;
      form.value = fresh(props.defaultDate);
      aiRows.value = [];
      scheduleError.value = "";
      sDates.value = [];
      sStart.value = [];
      sEnd.value = [];
    }
  },
);
watch(
  () => form.value.due,
  (due) => {
    sDates.value = sDates.value.map((date) =>
      date && date > due ? due : date,
    );
  },
);

// clear error message when user re-pick valid date
watch(
  () => form.value.due,
  (val) => {
    if (val >= todayISO) {
      error.value = "";
    }
  },
);
const isComplex = computed(() =>
  ["assignment", "project"].includes(form.value.type),
);
const scheduledSubtasks = computed(() =>
  form.value.subtasks
    .map((title, index) => ({ title: title.trim(), index }))
    .filter((item) => item.title),
);
const ppill = { high: "pill-red", medium: "pill-amber", low: "pill-green" };

// Display invalid date error message on step 1
function validateStep1Date() {
  if (form.value.due < todayISO) {
    error.value = "Due date cannot be in the past.";
    return false;
  }

  error.value = "";
  return true;
}

// control modal flow
function next() {
  // step 1 validation
  if (step.value === 1) {
    if (!validateStep1Date()) return;

    // simple task: save
    if (!isComplex.value) {
      save();
      return;
    }

    // complex task: go step 2 ONLY if valid
    step.value = 2;
    return;
  }

  // step 2 validation
  if (step.value === 2) {
    const hasSubtasks = form.value.subtasks.some((s) => s.trim());

    // save if no subtasks
    if (!hasSubtasks) {
      save();
      return;
    }
    scheduledSubtasks.value.forEach(({ index }) => {
      if (!sDates.value[index]) sDates.value[index] = form.value.due;
    });
    scheduleError.value = "";
    step.value = 3;
    return;
  }
}

let lastCall = 0;

// use Github OpenAI gpt-4o model to breakdown tasks
async function genAI() {
  // prevent spam of concurrent use of the service
  const now = Date.now();
  if (now - lastCall < 3000) return; // 3s cooldown

  aiError.value = "";

  lastCall = now;
    if (!form.value.title) {
    aiError.value = "Task title is required.";
    return;
  }

  // error validation for task description
  if (!aiPrompt.value || !aiPrompt.value.trim()) {
    aiError.value = "Please describe your task before generating AI subtasks.";
    return;
  }

  aiLoading.value = true; 

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/subtasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: form.value.title,
        description: aiPrompt.value,
      }),
    });

    const data = await res.json();
    console.log("AI response:", data); // debug

    // debug
    if (!Array.isArray(data)) {
      aiError.value = data.error || "Invalid AI response";
      aiRows.value = [];
      return;
    }

    aiRows.value = data;
  } catch (err) {
    console.error(err);
  }

  aiLoading.value = false;
}

// add subtasks ONLY IF subtask doesnt already exists
function addSub(n) {
  if (!form.value.subtasks.includes(n)) form.value.subtasks.push(n);
}
function acceptAll() {
  aiRows.value.forEach((r) => addSub(r.name));
}

// Display error message when selected due date is already past when user try to save task
function save() {
  if (form.value.due < todayISO) {
    error.value = "Due date cannot be in the past.";
    return;
  }

  error.value = "";
  scheduleError.value = "";

  if (!validateSubtaskSchedule()) return;

  const cleanSubtasks = form.value.subtasks
    .map((title, i) =>
      title.trim()
        ? {
            id: Date.now() + i,
            title: title.trim(),
            date: clampSubtaskDate(sDates.value[i]),
            start: sStart.value[i] || "",
            end: sEnd.value[i] || "",
            done: false,
          }
        : null,
    )
    .filter(Boolean);

  tasks.addTask({ ...form.value, subtasks: cleanSubtasks });
  emit("saved");
  emit("close");
}

// ensure no invalid subtask dates
function clampSubtaskDate(date) {
  // if no date or past dates, use subtask's due date
  if (!date || date < todayISO) return form.value.due;

  // if date is after due date, use subtask's due date
  if (date > form.value.due) return form.value.due;

  return date;
}

function currentTimeHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

function minSubtaskTime(date) {
  return date === todayISO ? currentTimeHHMM() : undefined;
}

function minSubtaskEndTime(index) {
  const date = sDates.value[index];
  const start = sStart.value[index];
  const todayMin = minSubtaskTime(date);

  if (start && todayMin) return start > todayMin ? start : todayMin;
  return start || todayMin;
}

function validateSubtaskSchedule() {
  const nowTime = currentTimeHHMM();

  for (const { title, index } of scheduledSubtasks.value) {
    const date = clampSubtaskDate(sDates.value[index]);
    const start = sStart.value[index] || "";
    const end = sEnd.value[index] || "";

    if (date === todayISO && start && start < nowTime) {
      scheduleError.value = `"${title}" cannot start in the past.`;
      return false;
    }

    if (date === todayISO && end && end < nowTime) {
      scheduleError.value = `"${title}" cannot end in the past.`;
      return false;
    }

    if (start && end && end <= start) {
      scheduleError.value = `"${title}" must end after it starts.`;
      return false;
    }
  }

  return true;
}
</script>
<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 14px;
  padding: 28px;
  width: 500px;
  max-width: 100%;
  max-height: 88vh;
  overflow-y: auto;
}
.mhead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22px;
}
.mtitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}
.msub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 3px;
}
.xbtn {
  background: var(--surface2);
  border: 1px solid var(--border2);
  color: var(--muted2);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.xbtn:hover {
  color: var(--text);
}
.fg {
  margin-bottom: 14px;
}
.frow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.rg {
  display: flex;
  gap: 12px;
}
.ri {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.ri input {
  width: auto;
  accent-color: var(--accent);
}
.rl {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid var(--border2);
  color: var(--muted2);
}
.rl-high {
  color: #e05a4e;
  border-color: var(--red-bd);
  background: var(--red-bg);
}
.rl-medium {
  color: #d4933c;
  border-color: var(--amber-bd);
  background: var(--amber-bg);
}
.rl-low {
  color: #6bb896;
  border-color: var(--accent-bd);
  background: var(--accent-bg);
}
.mactions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}
.mactions .btn:last-child {
  flex: 2;
}
.mactions .btn:first-child {
  flex: 1;
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.task-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface2);
  border-radius: 8px;
  margin-bottom: 14px;
}
.tc-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  flex: 1;
}
.prompt-container{
  margin-bottom: 15px;
}
.ai-box {
  background: linear-gradient(
    135deg,
    rgba(78, 124, 95, 0.1),
    rgba(78, 124, 95, 0.05)
  );
  border: 1px solid var(--accent-bd);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
}
.ai-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ai-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #6bb896;
}
.ai-btn {
  font-size: 11px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  font-family: "Geist", sans-serif;
}
.ai-btn:hover {
  background: var(--accent-d);
}
.ai-btn {
  opacity: 0.7;
  cursor: pointer;
}
.spin {
  display: inline-block;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.ai-desc {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 10px;
}
.ai-list {
  border-top: 1px solid var(--accent-bd);
  padding-top: 10px;
}
.ai-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(78, 124, 95, 0.1);
}
.ai-row:last-of-type {
  border-bottom: none;
}
.ar-name {
  font-size: 12px;
  color: var(--text);
  flex: 1;
}
.ar-est {
  font-size: 11px;
  color: #6bb896;
  font-weight: 500;
}
.ar-add {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-bd);
  color: #6bb896;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.ar-add:hover {
  background: var(--accent);
  color: #fff;
}
.sub-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.sub-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sub-n {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface3);
  border: 1px solid var(--border2);
  font-size: 10px;
  font-weight: 600;
  color: var(--muted2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sub-inp {
  flex: 1;
  font-size: 12px;
  padding: 7px 10px;
}
.sub-del {
  background: var(--red-bg);
  border: 1px solid var(--red-bd);
  color: #e05a4e;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.add-sub {
  font-size: 12px;
  color: var(--accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  font-family: "Geist", sans-serif;
  transition: color 0.15s;
}
.add-sub:hover {
  color: #6bb896;
}
.ss-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 4px;
}
.ss-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}
.ss-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 10px;
}
.ss-row {
  display: flex;
  gap: 8px;
}
.ss-row .fg {
  margin-bottom: 0;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.modal-slide-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.97);
}
.modal-slide-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.97);
}
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}
.error-text {
  font-size: 12px;
  color: #e05a4e;
  background: var(--red-bg);
  border: 1px solid var(--red-bd);
  border-radius: 7px;
  padding: 8px 12px;
  margin-bottom: 12px;
}
</style>
