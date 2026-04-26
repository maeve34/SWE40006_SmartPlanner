<template>
  <nav class="navbar">
    <div class="nav-brand serif">
      <div class="brand-dot"></div>
      SmartPlanner
    </div>

    <div class="nav-links">
      <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
      <router-link to="/schedule"  class="nav-link">Schedule</router-link>
      <router-link to="/progress"  class="nav-link">Progress</router-link>
    </div>

    <div class="nav-right">
      <button class="btn btn-primary" style="font-size:12px; padding:6px 14px;" @click="$emit('open-add')">
        + Add task
      </button>

      <div class="avatar-wrap" ref="avatarRef">
        <button class="avatar-btn" @click="dropOpen = !dropOpen">
          <span class="avatar-initials">{{ initials }}</span>
        </button>
        <transition name="drop">
          <div v-if="dropOpen" class="avatar-drop">
            <div class="drop-user">
              <div class="drop-name">{{ auth.user.name }}</div>
              <div class="drop-email">{{ auth.user.email }}</div>
            </div>
            <hr class="hr" />
            <button class="drop-item danger" @click="doLogout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign out
            </button>
          </div>
        </transition>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { auth } from '../stores/store.js'

const emit = defineEmits(['open-add', 'logout'])

const dropOpen  = ref(false)
const avatarRef = ref(null)

const initials = computed(() => {
  if (!auth.user?.name) return '?'
  return auth.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
})

function doLogout() {
  dropOpen.value = false
  emit('logout')
}

function handleOutside(e) {
  if (avatarRef.value && !avatarRef.value.contains(e.target)) dropOpen.value = false
}
onMounted(()  => document.addEventListener('mousedown', handleOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleOutside))
</script>

<style scoped>
.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  height: 54px;
  background: rgba(12,12,12,.92); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center;
  padding: 0 28px; gap: 0;
}

.nav-brand {
  font-size: 17px; color: var(--text);
  display: flex; align-items: center; gap: 8px;
  margin-right: 36px; flex-shrink: 0;
}
.brand-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }

.nav-links { display: flex; gap: 2px; }
.nav-link {
  padding: 6px 14px; border-radius: 7px;
  font-size: 13px; font-weight: 500; color: var(--muted2);
  text-decoration: none; transition: all .15s;
}
.nav-link:hover { color: var(--text); background: var(--surface2); }
.nav-link.router-link-active { color: var(--text); background: var(--surface3); border: 1px solid var(--border2); }

.nav-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

.avatar-wrap { position: relative; }
.avatar-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--accent-l); border: 1px solid rgba(74,123,95,.4);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.avatar-initials { font-size: 11px; font-weight: 600; color: #6BB896; }

.avatar-drop {
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 200px;
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: 10px; padding: 6px;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
}
.drop-user { padding: 8px 10px 10px; }
.drop-name  { font-size: 13px; font-weight: 600; color: var(--text); }
.drop-email { font-size: 11px; color: var(--muted2); margin-top: 1px; }
.drop-item {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 7px; border: none; cursor: pointer;
  font-family: var(--font-body); font-size: 13px; font-weight: 500;
  background: transparent; color: var(--muted2); transition: all .15s;
}
.drop-item:hover { background: var(--surface2); color: var(--text); }
.drop-item.danger { color: #E05A4A; }
.drop-item.danger:hover { background: var(--red-bg); }

.drop-enter-active { animation: dropIn .15s ease; }
.drop-leave-active { animation: dropIn .1s ease reverse; }
@keyframes dropIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
</style>
