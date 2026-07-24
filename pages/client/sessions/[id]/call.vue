<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
const route   = useRoute()
const apptApi = useAppointments()
const crisis  = useCrisis()
const id      = route.params.id as string

const appt         = ref<any>(null)
const loading      = ref(true)
const muted        = ref(false)
const cameraOff    = ref(false)
const controlsVisible = ref(true)
const duration     = ref(0)
const crisisModal  = ref(false)
const endModal     = ref(false)
const notesOpen    = ref(false)
const sessionNotes = ref('')
const pipPosition  = ref({ bottom: '24px', right: '24px' })
let hideTimer: any
let durationTimer: any

async function load() {
  try {
    const res = await apptApi.getAppointmentById(id)
    appt.value = res.data
  } finally { loading.value = false }
}

function showControls() {
  controlsVisible.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { controlsVisible.value = false }, 3000)
}

async function triggerCrisis() {
  await crisis.triggerAlert({ type: 1, severity: 3, clientMessage: 'Client triggered SOS during video session' })
  crisisModal.value = false
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
    <SLoader v-if="loading" label="Connecting..." />

    <div v-else class="flex-1 relative overflow-hidden">
      <!-- Main video area (therapist) -->
      <div class="absolute inset-0 bg-forest-900 flex items-center justify-center">
        <div class="text-center">
          <SAvatar :src="appt?.therapistProfile?.profilePictureUrl"
            :name="`${appt?.therapistProfile?.firstName ?? 'T'} ${appt?.therapistProfile?.lastName ?? ''}`"
            size="xl" color="bg-clay-500" class="mx-auto mb-3" />
          <p class="font-body text-white/70 text-sm">Waiting for Dr. {{ appt?.therapistProfile?.lastName }}...</p>
        </div>
      </div>

      <!-- Self PIP -->
      <div class="absolute w-32 h-24 bg-forest-800 rounded-xl overflow-hidden border-2 border-forest-700 flex items-center justify-center cursor-move"
        :style="pipPosition">
        <Icon name="heroicons:user" class="w-8 h-8 text-white/40" />
        <div v-if="cameraOff" class="absolute inset-0 bg-forest-900 flex items-center justify-center">
          <Icon name="heroicons:video-camera-slash" class="w-6 h-6 text-white/40" />
        </div>
      </div>

      <!-- Timer -->
      <div class="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
        <p class="font-body text-white text-sm font-medium">{{ durationFormatted }}</p>
      </div>

      <!-- Always-visible SOS -->
      <button @click="crisisModal = true"
        class="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors">
        <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-white" />
      </button>

      <!-- Notes panel -->
      <Transition name="slide-right">
        <div v-if="notesOpen"
          class="absolute right-0 top-0 bottom-0 w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col">
          <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <p class="font-body font-medium text-[var(--color-text)]">Session Notes</p>
            <button @click="notesOpen = false" class="text-[var(--color-text-muted)]">
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>
          <textarea v-model="sessionNotes" class="flex-1 p-4 bg-transparent font-body text-sm text-[var(--color-text)] resize-none focus:outline-none"
            placeholder="Take notes during your session..." />
        </div>
      </Transition>

      <!-- Controls bar -->
      <Transition name="fade">
        <div v-if="controlsVisible"
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
              notesOpen ? 'bg-forest-500 hover:bg-forest-600' : 'bg-white/10 hover:bg-white/20']">
            <Icon name="heroicons:pencil-square" class="w-5 h-5 text-white" />
          </button>
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
        <p class="font-body text-sm text-[var(--color-text-muted)]">Are you sure you want to end this session?</p>
        <div class="flex gap-3">
          <button @click="endModal = false" class="btn-secondary flex-1">Stay in call</button>
          <NuxtLink :to="`/client/appointments/${id}`" class="btn-danger flex-1 text-center">End session</NuxtLink>
        </div>
      </div>
    </SModal>

    <!-- Crisis modal -->
    <SModal v-model="crisisModal" title="Are you safe?" max-width="max-w-sm">
      <div class="space-y-4">
        <p class="font-body text-sm text-[var(--color-text-muted)]">
          Tapping "I need help" will immediately alert your therapist and our crisis team.
        </p>
        <div class="flex gap-3">
          <button @click="crisisModal = false" class="btn-secondary flex-1">I'm okay</button>
          <button @click="triggerCrisis" class="btn-danger flex-1">I need help</button>
        </div>
        <p class="font-body text-xs text-[var(--color-text-muted)] text-center">
          For immediate emergencies call 10111 or 0800 567 567 (SADAG)
        </p>
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
