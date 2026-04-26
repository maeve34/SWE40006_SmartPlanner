<template>
  <div class="login-card">
    <div class="login-brand">
      <div class="brand-dot"></div>
      <span class="serif">SmartPlanner</span>
    </div>
    <p class="login-sub">Plan smarter. Never miss a deadline.</p>

    <hr class="hr" style="margin: 20px 0;" />

    <form @submit.prevent="handleLogin">
      <div class="tab-row">
        <button type="button" :class="['tab-btn', { active: mode === 'login' }]" @click="mode = 'login'">Sign in</button>
        <button type="button" :class="['tab-btn', { active: mode === 'register' }]" @click="mode = 'register'">Create account</button>
      </div>

      <div v-if="mode === 'register'" class="form-group">
        <label class="form-label">Full name</label>
        <input v-model="form.name" class="form-input" type="text" placeholder="Your name" required />
      </div>

      <div class="form-group">
        <label class="form-label">Email</label>
        <input v-model="form.email" class="form-input" type="email" placeholder="you@example.com" required />
      </div>

      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Password</label>
        <div class="pw-row">
          <input v-model="form.password" class="form-input" :type="showPw ? 'text' : 'password'" placeholder="••••••••" required />
          <button type="button" class="pw-eye" @click="showPw = !showPw">{{ showPw ? '🙈' : '👁' }}</button>
        </div>
      </div>

      <p v-if="error" class="login-error">{{ error }}</p>

      <button type="submit" class="btn btn-primary" style="width:100%; padding:11px;">
        {{ mode === 'login' ? 'Sign in →' : 'Create account →' }}
      </button>
    </form>

    <p class="login-hint">
      {{ mode === 'login' ? 'Demo: any email + password' : 'Fill all fields to register' }}
    </p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { auth } from '../stores/store.js'

const mode   = ref('login')
const showPw = ref(false)
const error  = ref('')
const form   = reactive({ name: '', email: '', password: '' })

function handleLogin() {
  error.value = ''
  if (!form.email || !form.password) { error.value = 'Please fill all fields.'; return }
  if (mode.value === 'register' && !form.name) { error.value = 'Please enter your name.'; return }
  const name = mode.value === 'register' ? form.name : form.email.split('@')[0]
  auth.login(name, form.email)
}
</script>

<style scoped>
.login-card {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 18px;
  padding: 36px 32px;
  width: 400px;
  max-width: 95vw;
  box-shadow: 0 24px 80px rgba(0,0,0,.5);
}

.login-brand {
  display: flex; align-items: center; gap: 10px;
  font-size: 20px; color: var(--text); margin-bottom: 6px;
}
.brand-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
}
.login-sub { font-size: 13px; color: var(--muted2); }

.tab-row {
  display: flex; gap: 4px;
  background: var(--surface2); border-radius: 8px; padding: 3px;
  margin-bottom: 18px;
}
.tab-btn {
  flex: 1; padding: 7px; border-radius: 6px; border: none;
  font-family: var(--font-body); font-size: 13px; font-weight: 500;
  color: var(--muted2); background: transparent; cursor: pointer; transition: all .15s;
}
.tab-btn.active { background: var(--surface3); color: var(--text); border: 1px solid var(--border2); }

.pw-row { position: relative; }
.pw-eye {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; font-size: 14px;
}

.login-error {
  font-size: 12px; color: #E05A4A;
  background: var(--red-bg); border: 1px solid rgba(192,60,44,.2);
  border-radius: 6px; padding: 7px 10px; margin-bottom: 12px;
}

.login-hint {
  text-align: center; font-size: 11px; color: var(--muted); margin-top: 12px;
}
</style>
