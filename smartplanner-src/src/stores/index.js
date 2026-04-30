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
  const accountStorageKey = 'sp_accounts'
  const user = ref(readJSON('sp_user', null))
  const accounts = ref(readJSON(accountStorageKey, []))

  const isLoggedIn = computed(() =>
    !!user.value && !!findAccount(user.value.email || user.value.username || user.value.name)
  )

  function normalizeIdentifier(value) {
    return value.trim().toLowerCase()
  }

  function persistAccounts() {
    localStorage.setItem(accountStorageKey, JSON.stringify(accounts.value))
  }

  function findAccount(identifier) {
    const normalized = normalizeIdentifier(identifier)
    return accounts.value.find(account =>
      account.email.toLowerCase() === normalized ||
      account.username.toLowerCase() === normalized
    )
  }

  function register(name, email, password) {
    const cleanName = name.trim()
    const cleanEmail = email.trim()
    const username = cleanEmail.split('@')[0]

    if (findAccount(cleanEmail) || findAccount(username)) {
      return { ok: false, message: 'An account with this email or username already exists.' }
    }

    accounts.value = [
      ...accounts.value,
      { name: cleanName, email: cleanEmail, username, password }
    ]
    persistAccounts()
    return { ok: true }
  }

  function login(identifier, password) {
    const account = findAccount(identifier)
    if (!account) {
      return { ok: false, message: 'No account found with that email address or username.' }
    }
    if (account.password !== password) {
      return { ok: false, message: 'Incorrect password for this account.' }
    }

    const name = account.name || account.username
    user.value = {
      name,
      email: account.email,
      username: account.username,
      avatar: name.charAt(0).toUpperCase()
    }
    localStorage.setItem('sp_user', JSON.stringify(user.value))
    return { ok: true }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('sp_user')
  }

  return { user, isLoggedIn, register, login, logout }
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

  // delete main tasks
  function deleteTask(id) {
    tasks.value = tasks.value.filter(t => t.id !== id)
    persist()
  }

  // delete subtasks
  function deleteSubtask(parentId, subtaskId) {
    const task = tasks.value.find(t => t.id === parentId);
    if (!task) return;

    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    persist();
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

  // consider both main tasks and subtasks when returning total tasks
  function getWeekWorkItems(start, end) {
    const taskItems = tasks.value
      .filter(t => t.due >= start && t.due <= end)
      .map(t => ({
        date: t.due,
        done: t.done,
        priority: t.priority,
        type: t.type || "other"
      }));

    const subtaskItems = tasks.value.flatMap(t =>
      (t.subtasks || [])
        .filter(s => s.date && s.date >= start && s.date <= end)
        .map(s => ({
          date: s.date,
          done: s.done,
          priority: t.priority,
          type: t.type || "other"
        }))
    );

  return [...taskItems, ...subtaskItems];
}

  return { tasks, addTask, updateTask, deleteTask, deleteSubtask, toggleDone, toggleSubtask, totalDone, totalPending, highPriority, tasksForDate, getWeekWorkItems}
})
