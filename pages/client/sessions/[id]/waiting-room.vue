<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
const route   = useRoute()
const apptApi = useAppointments()
const id      = route.params.id as string

const appt    = ref<any>(null)
const loading = ref(true)
const joining = ref(false)
const error   = ref('')
const now     = ref(new Date())
let interval: any

async function load() {
  try {
    const res = await apptApi.getAppointmentById(id)
    appt.value = res.data
  } catch (e: any) { error.value = e.message }
  finally { loading.value = false }
}

async function joinCall() {
  joining.value = true
  try {
    const res = await apptApi.joinVideoCall(id)
    window.location.href = res.data.videoCallLink
  } catch (e: any) { error.value = e.message; joining.value = false }
}

const minutesUntil = computed(() => {
  if (!appt.value) return null
  return Math.max(0, Math.floor((new Date(appt.value.scheduledDateTime).getTime() - now.value.getTime()) / 60000))
})
const canJoin = computed(() => minutesUntil.value !== null && minutesUntil.value <= 5)

onMounted(() => { load(); interval = setInterval(() => { now.value = new Date() }, 1000) })
onUnmounted(() => clearInterval(interval))
</script>

<template>
  <div class="min-h-screen bg-serenity flex flex-col items-center justify-center p-6">
    <NuxtLink to="/client/appointments"
      class="flex items-center gap-1 font-body text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-8 self-start max-w-md w-full transition-colors">
      <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Back to appointments
    </NuxtLink>
    <div class="w-full max-w-md space-y-5">
      <SLoader v-if="loading" label="Loading session..." />
      <SError v-else-if="error" :message="error" />
      <div v-else-if="appt" class="space-y-5">
        <div class="card text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-forest-100 dark:bg-forest-900/40 flex items-center justify-center mx-auto">
            <Icon name="heroicons:video-camera" class="w-8 h-8 text-forest-500" />
          </div>
          <div>
            <h1 class="font-display text-2xl text-[var(--color-text)]">Waiting Room</h1>
            <p class="font-body text-[var(--color-text-muted)] mt-1">Session with Dr. {{ appt.therapistProfile?.lastName }}</p>
          </div>
          <div class="p-4 rounded-xl bg-[var(--color-surface-2)]">
            <p class="font-body text-sm text-[var(--color-text-muted)]">Scheduled for</p>
            <p class="font-body font-semibold text-[var(--color-text)]">
              {{ formatDate(appt.scheduledDateTime, { weekday:'long', month:'long', day:'numeric' }) }}
            </p>
            <p class="font-display text-3xl text-forest-500 mt-1">{{ formatTime(appt.scheduledDateTime) }}</p>
          </div>
          <div v-if="minutesUntil !== null">
            <div v-if="!canJoin" class="space-y-2">
              <p class="font-body text-sm text-[var(--color-text-muted)]">Session starts in</p>
              <p class="font-display text-4xl text-[var(--color-text)]">{{ minutesUntil }}m</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">Join button appears 5 minutes before</p>
            </div>
            <div v-else class="space-y-3">
              <div class="flex items-center justify-center gap-2 p-3 rounded-xl bg-forest-50 dark:bg-forest-900/30">
                <span class="w-2 h-2 rounded-full bg-forest-500 animate-pulse-soft" />
                <p class="font-body text-sm text-forest-700 dark:text-forest-300">Your session is ready</p>
              </div>
              <button @click="joinCall" :disabled="joining" class="btn-primary w-full flex items-center justify-center gap-2">
                <Icon v-if="joining" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
                <Icon v-else name="heroicons:video-camera" class="w-5 h-5" />
                {{ joining ? 'Connecting...' : 'Join Video Session' }}
              </button>
            </div>
          </div>
        </div>
        <div class="card space-y-3">
          <h3 class="font-display text-lg text-[var(--color-text)]">Before you join</h3>
          <div v-for="item in [
            { icon:'heroicons:wifi', text:'Check your internet connection' },
            { icon:'heroicons:microphone', text:'Test your microphone' },
            { icon:'heroicons:video-camera', text:'Enable your camera' },
            { icon:'heroicons:speaker-wave', text:'Use headphones if possible' },
          ]" :key="item.text" class="flex items-center gap-3">
            <Icon :name="item.icon" class="w-5 h-5 text-forest-400 shrink-0" />
            <p class="font-body text-sm text-[var(--color-text-muted)]">{{ item.text }}</p>
          </div>
        </div>
        <p class="font-body text-xs text-[var(--color-text-muted)] text-center px-4">
          All video sessions are end-to-end encrypted and confidential.
        </p>
      </div>
    </div>
  </div>
</template>
