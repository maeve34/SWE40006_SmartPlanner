import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('sp_user') || 'null'))

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

  const seed = [
    { id: 1,  title: 'Portfolio — Part 1',         type: 'project',    priority: 'high',   due: '2026-04-19', done: false, subtasks: [
      { id: 11, title: 'Research & notes', date: '2026-04-15', start: '14:00', end: '15:30', done: false },
      { id: 12, title: 'Coding', date: '2026-04-16', start: '10:00', end: '13:00', done: false },
      { id: 13, title: 'Write-up & review', date: '2026-04-17', start: '09:00', end: '10:30', done: false },
    ], notes: 'Main semester project' },
    { id: 2,  title: 'Read Chapter 7 — Networks',  type: 'reading',    priority: 'medium', due: '2026-04-17', done: false, subtasks: [], notes: '' },
    { id: 3,  title: 'Group meeting prep',          type: 'studying',   priority: 'low',    due: '2026-04-21', done: false, subtasks: [], notes: 'Prepare 5 slides' },
    { id: 4,  title: 'Lab report submission',       type: 'assignment', priority: 'high',   due: '2026-04-15', done: true,  subtasks: [], notes: '' },
    { id: 5,  title: 'Revise OS lecture notes',     type: 'revision',   priority: 'medium', due: '2026-04-16', done: false, subtasks: [], notes: '' },
  ]

  const savedTasks = JSON.parse(localStorage.getItem('sp_tasks') || 'null')
  const tasks = ref((savedTasks || seed).map(normalizeTask))

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
    localStorage.setItem('sp_tasks', JSON.stringify(tasks.value))
  }

  function addTask(task) {
    tasks.value.unshift(normalizeTask({ id: Date.now(), done: false, ...task }))
    persist()
  }

  function updateTask(id, patch) {
    const i = tasks.value.findIndex(t => t.id === id)
    if (i > -1) { tasks.value[i] = { ...tasks.value[i], ...patch }; persist() }
  }

  function deleteTask(id) {
    tasks.value = tasks.value.filter(t => t.id !== id)
    persist()
  }

  function toggleDone(id) {
    const t = tasks.value.find(t => t.id === id)
    if (t) { t.done = !t.done; persist() }
  }

  function toggleSubtask(taskId, subtaskId) {
    const t = tasks.value.find(t => t.id === taskId)
    const s = t?.subtasks.find(s => s.id === subtaskId)
    if (s) { s.done = !s.done; persist() }
  }

  const totalDone    = computed(() => tasks.value.filter(t => t.done).length)
  const totalPending = computed(() => tasks.value.filter(t => !t.done).length)
  const highPriority = computed(() => tasks.value.filter(t => t.priority === 'high' && !t.done).length)

  function tasksForDate(date) {
    return tasks.value.filter(t => t.due === date)
  }

  return { tasks, addTask, updateTask, deleteTask, toggleDone, toggleSubtask, totalDone, totalPending, highPriority, tasksForDate }
})
