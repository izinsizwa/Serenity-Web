<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
const route       = useRoute()
const calendarApi = useTherapistCalendar()
const crisis      = useCrisis()
const id          = route.params.id as string

const session      = ref<any>(null)
const loading      = ref(true)
const muted        = ref(false)
const cameraOff    = ref(false)
const controlsVis  = ref(true)
const notesOpen    = ref(false)
const sessionNotes = ref('')
const endModal     = ref(false)
const crisisModal  = ref(false)
const duration     = ref(0)
const savingNotes  = ref(false)
let hideTimer: any
let durationTimer: any

async function load() {
  try {
    const res = await calendarApi.getAppointmentById(id)
    session.value      = res.data
    sessionNotes.value = res.data?.sessionNotes ?? ''
  } finally { loading.value = false }
}

function showControls() {
  controlsVis.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { controlsVis.value = false }, 3000)
}

async function saveNotes() {
  savingNotes.value = true
  try { await calendarApi.updateSessionNotes(id, sessionNotes.value) }
  finally { savingNotes.value = false }
}

async function endAndComplete() {
  await calendarApi.completeSession(id, {
    sessionNotes: sessionNotes.value,
    requiresFollowUp: false,
  })
  navigateTo('/therapist/sessions')
}

const durationFormatted = computed(() => {
  const m = Math.floor(duration.value / 60)
  const s = duration.value % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
})

onMounted(() => {
  load()
  showControls()
  durationTimer = setInterval(() => { duration.value++ }, 1000)
})
onUnmounted(() => { clearTimeout(hideTimer); clearInterval(durationTimer) })
</script>

<template>
  <div class="fixed inset-0 bg-forest-950 flex flex-col" @mousemove="showControls" @touchstart="showControls">
    <SLoader v-if="loading" label="Starting session..." />

    <div v-else class="flex-1 relative overflow-hidden">
      <!-- Main video (client) -->
      <div class="absolute inset-0 bg-forest-900 flex items-center justify-center">
        <div class="text-center">
          <SAvatar
            :src="session?.clientProfile?.profilePictureUrl"
            :name="`${session?.clientProfile?.firstName ?? 'C'} ${session?.clientProfile?.lastName ?? ''}`"
            size="xl" color="bg-forest-500" class="mx-auto mb-3" />
          <p class="font-body text-white/70 text-sm">
            Waiting for {{ session?.clientProfile?.firstName }}...
          </p>
        </div>
      </div>

      <!-- Self PIP -->
      <div class="absolute bottom-24 right-6 w-36 h-28 bg-forest-800 rounded-xl overflow-hidden border-2 border-forest-700 flex items-center justify-center">
        <Icon name="heroicons:user" class="w-10 h-10 text-white/30" />
        <div v-if="cameraOff" class="absolute inset-0 bg-forest-900 flex items-center justify-center">
          <Icon name="heroicons:video-camera-slash" class="w-6 h-6 text-white/40" />
        </div>
      </div>

      <!-- Timer -->
      <div class="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse-soft" />
        <p class="font-body text-white text-sm font-medium">{{ durationFormatted }}</p>
      </div>

      <!-- Client info top-left -->
      <div class="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-sm">
        <SAvatar :src="session?.clientProfile?.profilePictureUrl"
          :name="`${session?.clientProfile?.firstName ?? 'C'} ${session?.clientProfile?.lastName ?? ''}`"
          size="xs" color="bg-forest-500" />
        <p class="font-body text-white text-sm">
          {{ session?.clientProfile?.firstName }} {{ session?.clientProfile?.lastName }}
        </p>
      </div>

      <!-- Notes panel -->
      <Transition name="slide-right">
        <div v-if="notesOpen"
          class="absolute right-0 top-0 bottom-0 w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col z-20">
          <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <p class="font-body font-medium text-[var(--color-text)]">Session Notes</p>
            <div class="flex items-center gap-2">
              <button @click="saveNotes" :disabled="savingNotes" class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">
                {{ savingNotes ? 'Saving...' : 'Save' }}
              </button>
              <button @click="notesOpen = false" class="text-[var(--color-text-muted)]">
                <Icon name="heroicons:x-mark" class="w-5 h-5" />
              </button>
            </div>
          </div>
          <textarea v-model="sessionNotes"
            class="flex-1 p-4 bg-transparent font-body text-sm text-[var(--color-text)] resize-none focus:outline-none"
            placeholder="Clinical notes, observations, interventions used..." />
        </div>
      </Transition>

      <!-- Controls -->
      <Transition name="fade">
        <div v-if="controlsVis"
          class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-sm">
          <button @click="muted = !muted"
            :class="['w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              muted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20']">
            <Icon :name="muted ? 'heroicons:microphone-slash' : 'heroicons:microphone'" class="w-5 h-5 text-white" />
          </button>
          <button @click="cameraOff = !cameraOff"
            :class="['w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              cameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20']">
            <Icon :name="cameraOff ? 'heroicons:video-camera-slash' : 'heroicons:video-camera'" class="w-5 h-5 text-white" />
          </button>
          <button @click="notesOpen = !notesOpen"
            :class="['w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              notesOpen ? 'bg-clay-500 hover:bg-clay-600' : 'bg-white/10 hover:bg-white/20']">
            <Icon name="heroicons:pencil-square" class="w-5 h-5 text-white" />
          </button>
          <NuxtLink :to="`/therapist/clients/${session?.clientId}`" target="_blank"
            class="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <Icon name="heroicons:user" class="w-5 h-5 text-white" />
          </NuxtLink>
          <button @click="endModal = true"
            class="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
            <Icon name="heroicons:phone-x-mark" class="w-5 h-5 text-white" />
          </button>
        </div>
      </Transition>
    </div>

    <!-- End session modal -->
    <SModal v-model="endModal" title="End session?" max-width="max-w-sm">
      <div class="space-y-4">
        <p class="font-body text-sm text-[var(--color-text-muted)]">
          Mark session as complete and save your notes?
        </p>
        <div>
          <label class="input-label">Final session notes</label>
          <textarea v-model="sessionNotes" class="input resize-none" rows="4"
            placeholder="Final observations, homework assigned..." />
        </div>
        <div class="flex gap-3">
          <button @click="endModal = false" class="btn-secondary flex-1">Stay in call</button>
          <button @click="endAndComplete" class="btn-primary flex-1">Complete session</button>
        </div>
      </div>
    </SModal>
  </div>
</template>

<style scoped>
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
