import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(readJSON('sp_user', null))

  const isLoggedIn = computed(() => !!user.value)

  function login(name, email) {
    user.value = { name, email, avatar: name.charAt(0).toUpperCase() }
    localStorage.setItem('sp_user', JSON.stringify(user.value))
  }

  function logout() {
    user.value = null
    localStorage.removeItem('sp_user')
  }

  return { user, isLoggedIn, login, logout }
})

export const useTaskStore = defineStore('tasks', () => {
  const taskStorageKey = 'sp_tasks_v2'
  const savedTasks = readJSON(taskStorageKey, [])
  const tasks = ref(Array.isArray(savedTasks) ? savedTasks.map(normalizeTask) : [])

  function normalizeTask(task) {
    return {
      ...task,
      subtasks: (task.subtasks || []).map((sub, index) => typeof sub === 'string'
        ? { id: Number(`${task.id}${index}`), title: sub, date: task.due, start: '', end: '', done: false }
        : { id: sub.id || Date.now() + index, title: sub.title || sub.name || '', date: sub.date || task.due, start: sub.start || '', end: sub.end || '', done: !!sub.done }
      )
    }
  }

  function persist() {
    localStorage.setItem(taskStorageKey, JSON.stringify(tasks.value))
  }

  function addTask(task) {
    const nextTask = normalizeTask({ id: Date.now(), done: false, ...task })
    tasks.value = [nextTask, ...tasks.value]
    persist()
  }

  function updateTask(id, patch) {
    const i = tasks.value.findIndex(t => t.id === id)
    if (i > -1) {
      tasks.value[i] = { ...tasks.value[i], ...patch }
      persist()
    }
  }

  function deleteTask(id) {
    tasks.value = tasks.value.filter(t => t.id !== id)
    persist()
  }

  function toggleDone(id) {
    const t = tasks.value.find(t => t.id === id)
    if (t) {
      t.done = !t.done
      t.subtasks = (t.subtasks || []).map(s => ({ ...s, done: t.done }))
      persist()
    }
  }

  function toggleSubtask(taskId, subtaskId) {
    const t = tasks.value.find(t => t.id === taskId)
    const s = t?.subtasks.find(s => s.id === subtaskId)
    if (s) {
      s.done = !s.done
      if (t.subtasks.length) {
        t.done = t.subtasks.every(s => s.done)
      }
      persist()
    }
  }

  const totalDone = computed(() => tasks.value.filter(t => t.done).length)
  const totalPending = computed(() => tasks.value.filter(t => !t.done).length)
  const highPriority = computed(() => tasks.value.filter(t => t.priority === 'high' && !t.done).length)

  function tasksForDate(date) {
    return tasks.value.filter(t => t.due === date)
  }

  return { tasks, addTask, updateTask, deleteTask, toggleDone, toggleSubtask, totalDone, totalPending, highPriority, tasksForDate }
})
