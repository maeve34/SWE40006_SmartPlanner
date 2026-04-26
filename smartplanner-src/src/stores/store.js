import { reactive } from 'vue'

export const auth = reactive({
  user: null,   
  isLoggedIn: false,

  login(name, email) {
    this.user = { name, email }
    this.isLoggedIn = true
  },
  logout() {
    this.user = null
    this.isLoggedIn = false
  },
})

export const store = reactive({
  tasks: [
    {
      id: 1, name: 'Portfolio Report — Part 1', type: 'project',
      priority: 'high', due: '2026-04-19', done: false,
      subtasks: [
        { id: 11, name: 'Research & notes', est: '1.5hr', date: '2026-04-15', start: '14:00', end: '15:30', done: false },
        { id: 12, name: 'Coding & implementation', est: '3hr', date: '2026-04-16', start: '10:00', end: '13:00', done: false },
        { id: 13, name: 'Write-up & review', est: '1.5hr', date: '2026-04-17', start: '09:00', end: '10:30', done: false },
      ],
    },
    {
      id: 2, name: 'Read Chapter 7 — Networks', type: 'reading',
      priority: 'medium', due: '2026-04-17', done: false, subtasks: [],
    },
    {
      id: 3, name: 'Group meeting prep slides', type: 'project',
      priority: 'low', due: '2026-04-21', done: false, subtasks: [],
    },
    {
      id: 4, name: 'Lab report submission', type: 'assignment',
      priority: 'high', due: '2026-04-15', done: true, subtasks: [],
    },
  ],

  nextId: 100,

  addTask(task) {
    this.tasks.unshift({ ...task, id: this.nextId++, done: false })
  },

  toggleTask(id) {
    const t = this.tasks.find(t => t.id === id)
    if (t) t.done = !t.done
  },

  deleteTask(id) {
    const i = this.tasks.findIndex(t => t.id === id)
    if (i > -1) this.tasks.splice(i, 1)
  },

  toggleSubtask(taskId, subId) {
    const t = this.tasks.find(t => t.id === taskId)
    if (!t) return
    const s = t.subtasks.find(s => s.id === subId)
    if (s) s.done = !s.done
  },
})
