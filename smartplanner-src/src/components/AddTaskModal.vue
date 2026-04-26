<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="overlay" @click.self="$emit('close')">
        <Transition name="modal-slide" appear>
          <div class="modal" v-if="show">

            <template v-if="step === 1">
              <div class="mhead">
                <div><h2 class="mtitle">Add new task</h2><p class="msub">Step 1{{ isComplex ? ' of 3' : '' }} — Task details</p></div>
                <button class="xbtn" @click="$emit('close')">✕</button>
              </div>
              <div class="fg"><label>Task title</label><input v-model="form.title" type="text" placeholder="e.g. Portfolio – Part 1" autofocus/></div>
              <div class="frow">
                <div class="fg"><label>Due date</label><input v-model="form.due" type="date"/></div>
                <div class="fg"><label>Task type</label>
                  <select v-model="form.type">
                    <option value="">Select…</option>
                    <option value="reading">Reading</option>
                    <option value="studying">Studying</option>
                    <option value="revision">Revision</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project / Portfolio</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div class="fg"><label>Priority</label>
                <div class="rg">
                  <label class="ri" v-for="p in ['high','medium','low']" :key="p">
                    <input type="radio" v-model="form.priority" :value="p"/>
                    <span :class="['rl','rl-'+p]">{{ p[0].toUpperCase()+p.slice(1) }}</span>
                  </label>
                </div>
              </div>
              <div class="fg"><label>Notes <em style="text-transform:none;letter-spacing:0;color:var(--muted);font-style:normal;">(optional)</em></label>
                <textarea v-model="form.notes" rows="2" placeholder="Any extra details…"></textarea>
              </div>
              <div class="mactions">
                <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
                <button class="btn btn-primary" :disabled="!form.title || !form.due" @click="next">{{ isComplex ? 'Next — Subtasks →' : 'Save task ✓' }}</button>
              </div>
            </template>

            <template v-if="step === 2">
              <div class="mhead">
                <div><h2 class="mtitle">Subtasks</h2><p class="msub">Step 2 of 3 — Break down your task</p></div>
                <button class="xbtn" @click="$emit('close')">✕</button>
              </div>
              <div class="task-chip">
                <span class="tc-name">{{ form.title }}</span>
                <span class="pill" :class="ppill[form.priority]">{{ form.priority }}</span>
              </div>
              <div class="ai-box">
                <div class="ai-hd">
                  <span class="ai-tag">✦ AI SUBTASK GENERATOR</span>
                  <button class="ai-btn" :class="{loading:aiLoading}" @click="genAI">
                    <span v-if="!aiLoading">Generate with AI</span>
                    <span v-else class="spin">⟳</span>
                  </button>
                </div>
                <p class="ai-desc">Automatically breaks your task into subtasks with time estimates via OpenAI.</p>
                <div v-if="aiRows.length" class="ai-list">
                  <div v-for="(r,i) in aiRows" :key="i" class="ai-row">
                    <span class="ar-name">{{ r.name }}</span><span class="ar-est">{{ r.est }}</span>
                    <button class="ar-add" @click="addSub(r.name)">+</button>
                  </div>
                  <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px;margin-top:6px;" @click="acceptAll">Accept all →</button>
                </div>
              </div>
              <hr class="div"/>
              <div class="sub-list">
                <div v-for="(s,i) in form.subtasks" :key="i" class="sub-row">
                  <span class="sub-n">{{ i+1 }}</span>
                  <input v-model="form.subtasks[i]" class="sub-inp" :placeholder="'Subtask '+(i+1)"/>
                  <button class="sub-del" @click="form.subtasks.splice(i,1)">✕</button>
                </div>
              </div>
              <button class="add-sub" @click="form.subtasks.push('')">+ Add subtask manually</button>
              <div class="mactions">
                <button class="btn btn-ghost" @click="step=1">← Back</button>
                <button class="btn btn-primary" @click="next">Next — Schedule →</button>
              </div>
            </template>

            <template v-if="step === 3">
              <div class="mhead">
                <div><h2 class="mtitle">Schedule subtasks</h2><p class="msub">Step 3 of 3 — Assign dates & times</p></div>
                <button class="xbtn" @click="$emit('close')">✕</button>
              </div>
              <div class="ss-list">
                <div v-for="(s,i) in form.subtasks.filter(x=>x)" :key="i" class="ss-card">
                  <div class="ss-name">{{ s }}</div>
                  <div class="ss-row">
                    <div class="fg" style="flex:1.2"><label>Date</label><input type="date" v-model="sDates[i]"/></div>
                    <div class="fg" style="flex:1"><label>Start</label><input type="time" v-model="sStart[i]"/></div>
                    <div class="fg" style="flex:1"><label>End</label><input type="time" v-model="sEnd[i]"/></div>
                  </div>
                </div>
              </div>
              <div class="mactions">
                <button class="btn btn-ghost" @click="step=2">← Back</button>
                <button class="btn btn-primary" @click="save">Save task ✓</button>
              </div>
            </template>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { useTaskStore } from '@/stores/index.js'
const props = defineProps({ show: Boolean })
const emit  = defineEmits(['close'])
const tasks = useTaskStore()
const step = ref(1)
const form = ref(fresh())
const aiRows = ref([])
const aiLoading = ref(false)
const sDates = ref([]), sStart = ref([]), sEnd = ref([])
function fresh() { return { title:'', due:'', type:'', priority:'medium', notes:'', subtasks:[] } }
watch(() => props.show, v => { if(v){ step.value=1; form.value=fresh(); aiRows.value=[]; sDates.value=[]; sStart.value=[]; sEnd.value=[] } })
const isComplex = computed(() => ['assignment','project'].includes(form.value.type))
const ppill = { high:'pill-red', medium:'pill-amber', low:'pill-green' }
function next() {
  if(step.value===1 && isComplex.value){ step.value=2; return }
  if(step.value===1){ save(); return }
  if(step.value===2){
    form.value.subtasks.forEach((_, i) => {
      if (!sDates.value[i]) sDates.value[i] = form.value.due
    })
    step.value=3
    return
  }
}
async function genAI() {
  if(!form.value.title) return
  aiLoading.value=true
  await new Promise(r=>setTimeout(r,1100))
  aiRows.value=[{name:'📌 Research & planning',est:'~1.5 hr'},{name:'💻 Implementation',est:'~3 hr'},{name:'✍️ Write-up & review',est:'~1.5 hr'}]
  aiLoading.value=false
}
function addSub(n) { if(!form.value.subtasks.includes(n)) form.value.subtasks.push(n) }
function acceptAll() { aiRows.value.forEach(r=>addSub(r.name)) }
function save() {
  const cleanSubtasks = form.value.subtasks
    .map((title, i) => title.trim()
      ? { id: Date.now() + i, title: title.trim(), date: sDates.value[i] || form.value.due, start: sStart.value[i] || '', end: sEnd.value[i] || '', done: false }
      : null
    )
    .filter(Boolean)

  tasks.addTask({ ...form.value, subtasks: cleanSubtasks })
  emit('close')
}
</script>
<style scoped>
.overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;}
.modal{background:var(--surface);border:1px solid var(--border2);border-radius:14px;padding:28px;width:500px;max-width:100%;max-height:88vh;overflow-y:auto;}
.mhead{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;}
.mtitle{font-size:16px;font-weight:600;color:var(--text);}
.msub{font-size:11px;color:var(--muted);margin-top:3px;}
.xbtn{background:var(--surface2);border:1px solid var(--border2);color:var(--muted2);width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;}
.xbtn:hover{color:var(--text);}
.fg{margin-bottom:14px;}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.rg{display:flex;gap:12px;}
.ri{display:flex;align-items:center;gap:6px;cursor:pointer;}
.ri input{width:auto;accent-color:var(--accent);}
.rl{font-size:12px;font-weight:500;padding:3px 10px;border-radius:20px;border:1px solid var(--border2);color:var(--muted2);}
.rl-high{color:#E05A4E;border-color:var(--red-bd);background:var(--red-bg);}
.rl-medium{color:#D4933C;border-color:var(--amber-bd);background:var(--amber-bg);}
.rl-low{color:#6BB896;border-color:var(--accent-bd);background:var(--accent-bg);}
.mactions{display:flex;gap:8px;margin-top:22px;}
.mactions .btn:last-child{flex:2;}.mactions .btn:first-child{flex:1;}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.task-chip{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface2);border-radius:8px;margin-bottom:14px;}
.tc-name{font-size:13px;font-weight:500;color:var(--text);flex:1;}
.ai-box{background:linear-gradient(135deg,rgba(78,124,95,.1),rgba(78,124,95,.05));border:1px solid var(--accent-bd);border-radius:10px;padding:14px;margin-bottom:14px;}
.ai-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.ai-tag{font-size:10px;font-weight:700;letter-spacing:.08em;color:#6BB896;}
.ai-btn{font-size:11px;font-weight:500;padding:5px 12px;border-radius:6px;background:var(--accent);color:#fff;border:none;cursor:pointer;transition:all .15s;font-family:'Geist',sans-serif;}
.ai-btn:hover{background:var(--accent-d);}
.ai-btn.loading{opacity:.7;cursor:wait;}
.spin{display:inline-block;animation:spin .6s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.ai-desc{font-size:11px;color:var(--muted);margin-bottom:10px;}
.ai-list{border-top:1px solid var(--accent-bd);padding-top:10px;}
.ai-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(78,124,95,.1);}
.ai-row:last-of-type{border-bottom:none;}
.ar-name{font-size:12px;color:var(--text);flex:1;}
.ar-est{font-size:11px;color:#6BB896;font-weight:500;}
.ar-add{width:22px;height:22px;border-radius:5px;background:var(--accent-bg);border:1px solid var(--accent-bd);color:#6BB896;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.ar-add:hover{background:var(--accent);color:#fff;}
.sub-list{display:flex;flex-direction:column;gap:6px;margin-bottom:8px;}
.sub-row{display:flex;align-items:center;gap:8px;}
.sub-n{width:22px;height:22px;border-radius:50%;background:var(--surface3);border:1px solid var(--border2);font-size:10px;font-weight:600;color:var(--muted2);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sub-inp{flex:1;font-size:12px;padding:7px 10px;}
.sub-del{background:var(--red-bg);border:1px solid var(--red-bd);color:#E05A4E;width:26px;height:26px;border-radius:5px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.add-sub{font-size:12px;color:var(--accent);background:none;border:none;cursor:pointer;padding:4px 0;font-family:'Geist',sans-serif;transition:color .15s;}
.add-sub:hover{color:#6BB896;}
.ss-list{display:flex;flex-direction:column;gap:10px;margin-bottom:4px;}
.ss-card{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;}
.ss-name{font-size:12px;font-weight:600;color:var(--text);margin-bottom:10px;}
.ss-row{display:flex;gap:8px;}
.ss-row .fg{margin-bottom:0;}
.modal-fade-enter-active,.modal-fade-leave-active{transition:opacity .2s ease;}
.modal-fade-enter-from,.modal-fade-leave-to{opacity:0;}
.modal-slide-enter-active,.modal-slide-leave-active{transition:opacity .2s ease,transform .2s ease;}
.modal-slide-enter-from{opacity:0;transform:translateY(14px) scale(.97);}
.modal-slide-leave-to{opacity:0;transform:translateY(14px) scale(.97);}
</style>
