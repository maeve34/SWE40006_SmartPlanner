<template>
  <nav class="navbar">
    <div class="nav-brand">
      <span class="brand-dot"></span>
      SmartPlanner
    </div>
    <div class="nav-links">
      <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
      <RouterLink to="/schedule" class="nav-link">Schedule</RouterLink>
      <RouterLink to="/progress" class="nav-link">Progress</RouterLink>
    </div>
    <div class="nav-right">
      <div class="user-menu" @click="menuOpen = !menuOpen" ref="menuRef">
        <div class="avatar">{{ auth.user?.avatar }}</div>
        <span class="username">{{ auth.user?.name }}</span>
        <span class="chevron" :class="{ open: menuOpen }">▾</span>
        <Transition name="menu">
          <div class="dropdown" v-if="menuOpen">
            <div class="dropdown-info">
              <div class="di-name">{{ auth.user?.name }}</div>
              <div class="di-email">{{ auth.user?.email }}</div>
            </div>
            <hr
              style="
                border: none;
                border-top: 1px solid var(--border);
                margin: 4px 0;
              "
            />
            <button class="dropdown-item danger" @click="handleLogout">
              <LogOut size="12" />Log out
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/index.js";
import { LogOut } from "@lucide/vue";
const auth = useAuthStore();
const router = useRouter();
const menuOpen = ref(false);
const menuRef = ref(null);
function handleLogout() {
  menuOpen.value = false;
  auth.logout();
  router.push("/login");
}
function outside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target))
    menuOpen.value = false;
}
onMounted(() => document.addEventListener("click", outside));
onBeforeUnmount(() => document.removeEventListener("click", outside));
</script>
<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  height: 52px;
  background: rgba(15, 15, 15, 0.94);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 28px;
}
.nav-brand {
  font-family: "Instrument Serif", serif;
  font-size: 17px;
  color: var(--text);
  margin-right: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}
.brand-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px rgba(78, 124, 95, 0.6);
}
.nav-links {
  display: flex;
  gap: 2px;
}
.nav-link {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted2);
  text-decoration: none;
  transition: all 0.15s;
}
.nav-link:hover {
  color: var(--text);
  background: var(--surface2);
}
.nav-link.router-link-active {
  color: var(--text);
  background: var(--surface3);
  border: 1px solid var(--border2);
}
.nav-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-menu {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  position: relative;
  padding: 4px 10px 4px 4px;
  border-radius: 8px;
  transition: background 0.15s;
}
.user-menu:hover {
  background: var(--surface2);
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-bg);
  border: 1px solid var(--accent-bd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #6bb896;
}
.username {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}
.chevron {
  font-size: 11px;
  color: var(--muted);
  transition: transform 0.2s;
}
.chevron.open {
  transform: rotate(180deg);
}
.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 8px;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.dropdown-info {
  padding: 6px 8px 8px;
}
.di-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.di-email {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  font-family: "Geist", sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: background 0.15s;
  color: var(--muted2);
}
.dropdown-item:hover {
  background: var(--surface2);
  color: var(--text);
}
.dropdown-item.danger {
  color: #e05a4e;
}
.dropdown-item.danger:hover {
  background: var(--red-bg);
}
.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.menu-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
