import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000'

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

  async function register(name, email, password) {
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      })

      return await res.json()

    } catch (err) {
      console.error(err)

      return {
        ok: false,
        message: 'Unable to connect to server.'
      }
    }
  }

  async function login(identifier, password) {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier,
          password
        })
      })

      const data = await res.json()

      if (!data.ok) {
        return data
      }

      user.value = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        username: data.user.username,
        avatar: data.user.name.charAt(0).toUpperCase()
      }

      localStorage.setItem('sp_user', JSON.stringify(user.value))

      return { ok: true }

    } catch (err) {
      console.error(err)

      return {
        ok: false,
        message: 'Unable to connect to server.'
      }
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('sp_user')
  }

  return {
    user,
    isLoggedIn,
    register,
    login,
    logout
  }
})

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])

  const auth = useAuthStore()

  async function fetchTasks() {
    if (!auth.user) return
    try {
      const res = await fetch(`${API}/api/tasks?userId=${auth.user.id}`)
      tasks.value = await res.json()
    } catch (err) {
      console.error(err)
    }
  }

  // Auto-fetch when user logs in; clear when user logs out
  watch(() => auth.user, (user) => {
    if (user) fetchTasks()
    else tasks.value = []
  }, { immediate: true })

  async function addTask(task) {
    if (!auth.user) return
    try {
      const res = await fetch(`${API}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, userId: auth.user.id }),
      })
      const data = await res.json()
      if (data.ok) tasks.value = [data.task, ...tasks.value]
    } catch (err) {
      console.error(err)
    }
  }

  async function updateTask(id, patch) {
    try {
      const res = await fetch(`${API}/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (data.ok) {
        const i = tasks.value.findIndex(t => t.id === id)
        if (i > -1) tasks.value[i] = data.task
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function deleteTask(id) {
    try {
      await fetch(`${API}/api/tasks/${id}`, { method: 'DELETE' })
      tasks.value = tasks.value.filter(t => t.id !== id)
    } catch (err) {
      console.error(err)
    }
  }

  async function deleteSubtask(parentId, subtaskId) {
    try {
      await fetch(`${API}/api/tasks/${parentId}/subtasks/${subtaskId}`, { method: 'DELETE' })
      const task = tasks.value.find(t => t.id === parentId)
      if (task) task.subtasks = task.subtasks.filter(s => s.id !== subtaskId)
    } catch (err) {
      console.error(err)
    }
  }

  async function toggleDone(id) {
    try {
      const res = await fetch(`${API}/api/tasks/${id}/toggle`, { method: 'PATCH' })
      const data = await res.json()
      if (data.ok) {
        const i = tasks.value.findIndex(t => t.id === id)
        if (i > -1) tasks.value[i] = data.task
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function toggleSubtask(taskId, subtaskId) {
    try {
      const res = await fetch(`${API}/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`, { method: 'PATCH' })
      const data = await res.json()
      if (data.ok) {
        const i = tasks.value.findIndex(t => t.id === taskId)
        if (i > -1) tasks.value[i] = data.task
      }
    } catch (err) {
      console.error(err)
    }
  }

  const totalDone = computed(() => tasks.value.filter(t => t.done).length)
  const totalPending = computed(() => tasks.value.filter(t => !t.done).length)
  const highPriority = computed(() => tasks.value.filter(t => t.priority === 'high' && !t.done).length)

  function tasksForDate(date) {
    return tasks.value.filter(t => t.due === date)
  }

  function getWeekWorkItems(start, end) {
    const taskItems = tasks.value
      .filter(t => t.due >= start && t.due <= end)
      .map(t => ({ date: t.due, done: t.done, priority: t.priority, type: t.type || 'other' }))

    const subtaskItems = tasks.value.flatMap(t =>
      (t.subtasks || [])
        .filter(s => s.date && s.date >= start && s.date <= end)
        .map(s => ({ date: s.date, done: s.done, priority: t.priority, type: t.type || 'other' }))
    )

    return [...taskItems, ...subtaskItems]
  }

  return { tasks, fetchTasks, addTask, updateTask, deleteTask, deleteSubtask, toggleDone, toggleSubtask, totalDone, totalPending, highPriority, tasksForDate, getWeekWorkItems }
})
