<template>
  <div class="login-page">
    <div class="login-left">
      <div class="ll-content">
        <div class="brand">
          <span class="brand-dot"></span>
          <span class="brand-name">SmartPlanner</span>
        </div>
        <h1 class="ll-h">Plan smarter.<br/><em>Not harder.</em></h1>
        <p class="ll-p">An AI-assisted weekly planner that breaks your tasks into subtasks, tracks your progress, and keeps your deadlines in sight.</p>
        <div class="features">
          <div class="feat" v-for="f in features" :key="f.icon">
            <span class="feat-icon">{{ f.icon }}</span>
            <span class="feat-text">{{ f.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="form-card">
        <Transition name="tab" mode="out-in">
          <div v-if="mode === 'login'" key="login">
            <h2 class="fc-title">Welcome back</h2>
            <p class="fc-sub">Sign in to your account</p>
            <div class="fg">
              <label>Email address</label>
              <input v-model="email" type="email" placeholder="you@example.com" @keyup.enter="handleLogin"/>
            </div>
            <div class="fg">
              <label>Password</label>
              <input v-model="password" type="password" placeholder="••••••••" @keyup.enter="handleLogin"/>
            </div>
            <div v-if="error" class="err-msg">{{ error }}</div>
            <button class="btn btn-primary full-btn" @click="handleLogin">Sign in →</button>
            <p class="switch-text">Don't have an account? <button class="switch-btn" @click="mode='register'">Create one</button></p>
          </div>

          <div v-else key="register">
            <h2 class="fc-title">Create account</h2>
            <p class="fc-sub">Start planning your week today</p>
            <div class="fg">
              <label>Full name</label>
              <input v-model="name" type="text" placeholder="Aiman"/>
            </div>
            <div class="fg">
              <label>Email address</label>
              <input v-model="email" type="email" placeholder="you@example.com"/>
            </div>
            <div class="fg">
              <label>Password</label>
              <input v-model="password" type="password" placeholder="••••••••"/>
            </div>
            <div v-if="error" class="err-msg">{{ error }}</div>
            <button class="btn btn-primary full-btn" @click="handleRegister">Create account →</button>
            <p class="switch-text">Already have an account? <button class="switch-btn" @click="mode='login'">Sign in</button></p>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/index.js'
const auth = useAuthStore()
const router = useRouter()
const mode = ref('login')
const name = ref(''), email = ref(''), password = ref(''), error = ref('')
const features = [
  { icon: '📅', text: 'Weekly view — one week at a time' },
  { icon: '🧠', text: 'AI breaks tasks into subtasks automatically' },
  { icon: '📊', text: 'Progress charts powered by vue-chart.js' },
  { icon: '📄', text: 'Export your timetable to PDF instantly' },
]
function handleLogin() {
  error.value = ''
  if (!email.value || !password.value) { error.value = 'Please fill in all fields.'; return }
  auth.login(email.value.split('@')[0], email.value)
  router.push('/dashboard')
}
function handleRegister() {
  error.value = ''
  if (!name.value || !email.value || !password.value) { error.value = 'Please fill in all fields.'; return }
  auth.login(name.value, email.value)
  router.push('/dashboard')
}
</script>
<style scoped>
.login-page { display:grid;grid-template-columns:1fr 1fr;min-height:100vh; }
.login-left { background:linear-gradient(160deg,#0F1A14 0%,#111 60%,#0F1A14 100%);padding:60px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden; }
.login-left::before { content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,rgba(78,124,95,.15),transparent 60%); }
.ll-content { position:relative;z-index:1;max-width:420px; }
.brand { display:flex;align-items:center;gap:8px;margin-bottom:48px; }
.brand-dot { width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px rgba(78,124,95,.6); }
.brand-name { font-family:'Instrument Serif',serif;font-size:18px;color:var(--text); }
.ll-h { font-family:'Instrument Serif',serif;font-size:46px;line-height:1.08;color:var(--text);margin-bottom:18px; }
.ll-h em { color:var(--accent);font-style:italic; }
.ll-p { font-size:14px;color:var(--muted2);line-height:1.7;margin-bottom:36px; }
.features { display:flex;flex-direction:column;gap:12px; }
.feat { display:flex;align-items:center;gap:10px; }
.feat-icon { font-size:15px; }
.feat-text { font-size:13px;color:var(--muted2); }
.login-right { background:var(--bg);display:flex;align-items:center;justify-content:center;padding:40px; }
.form-card { background:var(--surface);border:1px solid var(--border2);border-radius:16px;padding:36px;width:380px;max-width:100%; }
.fc-title { font-family:'Instrument Serif',serif;font-size:24px;color:var(--text);margin-bottom:4px; }
.fc-sub { font-size:13px;color:var(--muted);margin-bottom:24px; }
.fg { margin-bottom:14px; }
.err-msg { font-size:12px;color:#E05A4E;background:var(--red-bg);border:1px solid var(--red-bd);border-radius:7px;padding:8px 12px;margin-bottom:12px; }
.full-btn { width:100%;padding:12px;font-size:13px;justify-content:center;border-radius:9px;margin-top:4px; }
.switch-text { font-size:12px;color:var(--muted);text-align:center;margin-top:16px; }
.switch-btn { background:none;border:none;color:var(--accent);cursor:pointer;font-size:12px;font-family:'Geist',sans-serif;font-weight:500; }
.switch-btn:hover { color:#6BB896; }
.tab-enter-active,.tab-leave-active { transition:opacity .15s ease,transform .15s ease; }
.tab-enter-from { opacity:0;transform:translateX(10px); }
.tab-leave-to { opacity:0;transform:translateX(-10px); }
</style>
