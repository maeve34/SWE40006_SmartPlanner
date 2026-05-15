import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../stores/index.js'

// Prevent the store's watch from firing a real fetch
global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve([]) }))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// Seed helper — sets tasks directly on the store
function seed(store, tasks) {
  store.tasks = tasks
}

const TASK_BASE = {
  id: 1,
  userId: 1,
  title: 'Write report',
  type: 'assignment',
  priority: 'high',
  done: false,
  subtasks: [],
}

// ─── getWeekWorkItems ─────────────────────────────────────────────────────────

describe('getWeekWorkItems', () => {
  it('returns main tasks whose due date falls within the range', () => {
    const store = useTaskStore()
    seed(store, [
      { ...TASK_BASE, id: 1, due: '2025-06-03' },
      { ...TASK_BASE, id: 2, due: '2025-06-10' }, // outside range
    ])

    const result = store.getWeekWorkItems('2025-06-01', '2025-06-07')

    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2025-06-03')
  })

  it('includes subtasks whose date falls within the range', () => {
    const store = useTaskStore()
    seed(store, [
      {
        ...TASK_BASE,
        due: '2025-06-10', // parent is outside range
        subtasks: [
          { id: 10, title: 'Read chapter', date: '2025-06-04', done: false },
          { id: 11, title: 'Take notes',  date: '2025-06-12', done: false }, // outside
        ],
      },
    ])

    const result = store.getWeekWorkItems('2025-06-01', '2025-06-07')

    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2025-06-04')
  })

  it('subtasks inherit priority and type from their parent task', () => {
    const store = useTaskStore()
    seed(store, [
      {
        ...TASK_BASE,
        priority: 'high',
        type: 'project',
        due: '2025-06-10',
        subtasks: [{ id: 10, title: 'Sub', date: '2025-06-03', done: false }],
      },
    ])

    const result = store.getWeekWorkItems('2025-06-01', '2025-06-07')

    expect(result[0].priority).toBe('high')
    expect(result[0].type).toBe('project')
  })

  it('returns an empty array when no tasks fall in range', () => {
    const store = useTaskStore()
    seed(store, [{ ...TASK_BASE, due: '2025-07-01', subtasks: [] }])

    const result = store.getWeekWorkItems('2025-06-01', '2025-06-07')

    expect(result).toHaveLength(0)
  })
})

// ─── totalDone / totalPending ─────────────────────────────────────────────────

describe('totalDone and totalPending', () => {
  it('counts done and pending tasks correctly', () => {
    const store = useTaskStore()
    seed(store, [
      { ...TASK_BASE, id: 1, done: true,  subtasks: [] },
      { ...TASK_BASE, id: 2, done: true,  subtasks: [] },
      { ...TASK_BASE, id: 3, done: false, subtasks: [] },
    ])

    expect(store.totalDone).toBe(2)
    expect(store.totalPending).toBe(1)
  })

  it('returns 0 for both when there are no tasks', () => {
    const store = useTaskStore()
    seed(store, [])

    expect(store.totalDone).toBe(0)
    expect(store.totalPending).toBe(0)
  })
})
