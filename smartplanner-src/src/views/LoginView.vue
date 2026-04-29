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
            <ul>
              <li class="feat-text">{{ f.text }}</li>
            </ul>
          </div>
        </div>  
      </div>
    </div>

    <div class="login-right">
      <div class="form-card">
        <Transition name="tab" mode="out-in">
          <!-- Login -->
          <div v-if="mode === 'login'" key="login">
            <h2 class="fc-title">Welcome back</h2>
            <p class="fc-sub">Sign in to your account</p>
            <div class="fg">
              <label>Email address or username</label>
              <input v-model="email" type="text" placeholder="you@example.com or meiqi" @keyup.enter="handleLogin"/>
              <div v-if="error.email" class="err-msg">{{ error.email }}</div>
            </div>
            <div class="fg">
              <label>Password</label>
              <div class="password-field">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  @keyup.enter="handleLogin"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" size="16" />
                  <Eye v-else size="16" />
                </button>
              </div>
              <div v-if="error.password" class="err-msg">{{ error.password }}</div>
            </div>
            <div v-if="error.all" class="err-msg">{{ error.all }}</div>
            <div v-if="success" class="success-msg">{{ success }}</div>
            <button class="btn btn-primary full-btn" @click="handleLogin">Sign in <ArrowRight size="17" /></button>
            <p class="switch-text">Don't have an account? <button class="switch-btn" @click="mode='register', resetErrors()">Create one</button></p>
          </div>

          <!-- Register -->
          <div v-else key="register">
            <h2 class="fc-title">Create account</h2>
            <p class="fc-sub">Start planning your week today</p>
            <div class="fg">
              <label>Name</label>
              <input v-model="name" type="text" placeholder="Aiman"/>
              <div v-if="error.name" class="err-msg">{{ error.name }}</div>
            </div>
            <div class="fg">
              <label>Email address</label>
              <input v-model="email" type="email" placeholder="you@example.com"/>
              <div v-if="error.email" class="err-msg">{{ error.email }}</div>
            </div>
            <div class="fg">
              <label>Password</label>
              <div class="password-field">
                <input
                  v-model="password"
                  :type="showRegisterPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showRegisterPassword ? 'Hide password' : 'Show password'"
                  @click="showRegisterPassword = !showRegisterPassword"
                >
                  <EyeOff v-if="showRegisterPassword" size="16" />
                  <Eye v-else size="16" />
                </button>
              </div>
              <div v-if="error.password" class="err-msg">{{ error.password}}</div>
            </div>
            <div class="fg">
              <label>Confirm Password</label>
              <div class="password-field">
                <input
                  v-model="cfmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <EyeOff v-if="showConfirmPassword" size="16" />
                  <Eye v-else size="16" />
                </button>
              </div>
              <div v-if="error.cfmPassword" class="err-msg">{{ error.cfmPassword }}</div>
            </div>

            <div v-if="error.all" class="err-msg">{{ error.all }}</div>
            <button class="btn btn-primary full-btn" @click="handleRegister">Create account <ArrowRight size="17"/></button>
            <p class="switch-text">Already have an account? <button class="switch-btn" @click="mode='login', resetErrors()">Sign in</button></p>
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
  import { ArrowRight, Eye, EyeOff } from '@lucide/vue';
  const auth = useAuthStore()
  const router = useRouter()
  const mode = ref('login')
  const success = ref('')
  const error = ref({
    all: '',
    name: '',
    email: '',
    password: '',
    cfmPassword: ''
  })
  const name = ref('')
  const email = ref('')
  const password = ref('')
  const cfmPassword = ref('')
  const showPassword = ref(false)
  const showRegisterPassword = ref(false)
  const showConfirmPassword = ref(false)
  const passwordSymbolPattern = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/
  const features = [
    { text: 'Weekly view — one week at a time' },
    { text: 'AI breaks tasks into subtasks automatically' },
    { text: 'Progress charts powered by vue-chart.js' },
  ]
  // reset errors
  function resetErrors() {
    error.value = {
      all: '',
      name: '',
      email: '',
      password: '',
      cfmPassword: ''
    }
    success.value = ''
  }
  function validateLoginIdentifier(value) {
    if (!value) return 'Please fill in your email address or username.'
    if (value.includes('@')) {
      return /^\S+@\S+\.\S+$/.test(value) ? '' : 'Enter a valid email address, for example you@example.com.'
    }
    return /^[A-Za-z0-9._-]{3,}$/.test(value)
      ? ''
      : 'Username must be at least 3 characters and use only letters, numbers, dots, dashes, or underscores.'
  }
  function validatePassword(value) {
    if (!value) return 'Please fill in your password.'
    if (value.length < 8) return 'Password must be at least 8 characters long.'
    if (!passwordSymbolPattern.test(value)) {
      return 'Password must include at least one symbol, for example ! @ # $ % ^ & * ? _ - .'
    }
    return ''
  }
  function handleLogin() {
    resetErrors()
    if (!email.value && !password.value) { 
      error.value.all = 'Please fill in all fields.'; 
      return
    }
    
    error.value.email = validateLoginIdentifier(email.value)
    error.value.password = validatePassword(password.value)

    // stop if any field 
    if (error.value.email || error.value.password) return

    const result = auth.login(email.value, password.value)
    if (!result.ok) {
      error.value.all = result.message
      return
    }
    router.push('/dashboard')
  }
  function handleRegister() {
    resetErrors()
    if (!name.value && !email.value && !password.value && !cfmPassword.value) { 
      error.value.all = 'Please fill in all fields.'; 
      return 
    } 
    if (!name.value){
      error.value.name = 'Please fill in your name.';
    } 

    if (!email.value){
      error.value.email = 'Please fill in your email.';
    }else if(!/^\S+@\S+\.\S+$/.test(email.value)) {
      error.value.email = 'Invalid email format.';
    } 

    error.value.password = validatePassword(password.value)

    if (!cfmPassword.value){
      error.value.cfmPassword = 'Please confirm your password.';
    } else if (password.value !== cfmPassword.value){
      error.value.cfmPassword = 'Passwords do not match.'
    }
    
    if (
      error.value.name ||
      error.value.email ||
      error.value.password ||
      error.value.cfmPassword
    ) return

    const result = auth.register(name.value, email.value, password.value)
    if (!result.ok) {
      error.value.email = result.message
      return
    }

    // switch mode back to prompt user to login after successful registration
    success.value = 'Account created! Please sign in.'
    setTimeout(() => success.value = '', 3000)
    mode.value = 'login'
    password.value = ''
    cfmPassword.value = ''
  }
</script>
<style scoped>
.login-page { 
  display:grid;
  grid-template-columns:1fr 1fr;
  min-height:100vh; 
}
.login-left { 
  background:linear-gradient(160deg,#0F1A14 0%,#111 60%,#0F1A14 100%);
  padding:60px;
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;
  overflow:hidden; 
}
.login-left::before { 
  content:'';
  position:absolute;
  inset:0;
  background:radial-gradient(ellipse at 30% 50%,rgba(78,124,95,.15),
  transparent 60%); 
}
.ll-content {
  position:relative;
  z-index:1;
  max-width:420px; 
}
.brand {
  display:flex;
  align-items:center;
  gap:8px;
  margin-bottom:48px; 
}
.brand-dot { 
  width:8px;
  height:8px;
  border-radius:50%;
  background:var(--accent);
  box-shadow:0 0 12px rgba(78,124,95,.6); 
}
.brand-name { 
  font-family:'Instrument Serif',serif;
  font-size:18px;
  color:var(--text); 
}
.ll-h { 
  font-family:'Instrument Serif',serif;
  font-size:46px;
  line-height:1.08;
  color:var(--text);
  margin-bottom:18px; 
}
.ll-h em { 
  color:var(--accent);
  font-style:italic; 
}
.ll-p { 
  font-size:14px;
  color:var(--muted2);
  line-height:1.7;
  margin-bottom:36px; 
}
.features { 
  display:flex;
  flex-direction:column;
  gap:12px; 
}
.feat { 
  display:flex;
  align-items:center;
  gap:10px; 
}
.feat-icon { 
  font-size:15px; 
}
.feat-text { 
  font-size:13px;
  color:var(--muted2); 
}
.login-right { 
  background:var(--bg);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:40px; 
}
.form-card { 
  background:var(--surface);
  border:1px solid var(--border2);
  border-radius:16px;
  padding:36px;
  width:380px;
  max-width:100%; 
}
.fc-title { 
  font-family:'Instrument Serif',serif;
  font-size:24px;
  color:var(--text);
  margin-bottom:4px; 
}
.fc-sub { 
  font-size:13px;
  color:var(--muted);
  margin-bottom:24px; 
}
.fg { 
  margin-bottom:14px; 
}
.password-field {
  position: relative;
}
.password-field input {
  padding-right: 42px;
}
.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--muted2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 5px;
}
.password-toggle:hover,
.password-toggle:focus-visible {
  color: var(--text);
  background: var(--surface3);
  outline: none;
}
.err-msg { 
  font-size:12px;
  color:#E05A4E;
  background:var(--red-bg);
  border:1px solid var(--red-bd);
  border-radius:7px;
  padding:8px 12px;
  margin-bottom:12px; 
}
.success-msg {
  font-size: 12px;
  color: #86c688;
  background: var(--green);
  border: 1px solid var(--green-bd);
  border-radius: 7px;
  padding: 8px 12px;
  margin-bottom: 12px;
}
.full-btn { 
  width:100%;
  padding:12px;
  font-size:13px;
  justify-content:center;
  border-radius:9px;
  margin-top:4px; 
}
.switch-text { 
  font-size:12px;
  color:var(--muted);
  text-align:center;
  margin-top:16px; 
}
.switch-btn {
  background:none;
  border:none;
  color:var(--accent);
  cursor:pointer;
  font-size:12px;
  font-family:'Geist',sans-serif;
  font-weight:500; }
.switch-btn:hover { 
  color:#6BB896; 
}
.tab-enter-active,.tab-leave-active { 
  transition:opacity .15s ease,
  transform .15s ease; 
}
.tab-enter-from { 
  opacity:0;
  transform:translateX(10px); 
}
.tab-leave-to { 
  opacity:0;
  transform:translateX(-10px); 
}
</style>
