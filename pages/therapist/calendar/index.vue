<script setup lang="ts">
definePageMeta({ layout: 'therapist', middleware: 'auth' })
const calendarApi = useTherapistCalendar()

const currentDate    = ref(new Date())
const appointments   = ref<any[]>([])
const availability   = ref<any[]>([])
const loading        = ref(true)
const selectedAppt   = ref<any>(null)
const apptModal      = ref(false)
const sessionNotes   = ref('')
const savingNotes    = ref(false)
const availModal     = ref(false)

// Build week range
const weekStart = computed(() => {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() - d.getDay() + 1) // Monday
  d.setHours(0, 0, 0, 0)
  return d
})
const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(weekStart.value.getDate() + i)
    return d
  })
})

const weekLabel = computed(() => {
  const start = weekDays.value[0]
  const end   = weekDays.value[6]
  return `${formatDate(start, { month: 'long', day: 'numeric' })} – ${formatDate(end, { day: 'numeric', year: 'numeric' })}`
})

async function load() {
  loading.value = true
  const from = weekStart.value.toISOString()
  const to   = new Date(weekStart.value.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  try {
    const [apptRes, availRes] = await Promise.all([
      calendarApi.getAppointments(from, to),
      calendarApi.getAvailability(),
    ])
    appointments.value = apptRes.data ?? []
    availability.value = availRes.data ?? []
  } finally { loading.value = false }
}

function prevWeek() { currentDate.value = new Date(currentDate.value.getTime() - 7 * 86400000); load() }
function nextWeek() { currentDate.value = new Date(currentDate.value.getTime() + 7 * 86400000); load() }
function goToday()  { currentDate.value = new Date(); load() }

function getAppointmentsForDay(day: Date) {
  return appointments.value.filter(a => {
    const d = new Date(a.scheduledDateTime)
    return d.toDateString() === day.toDateString()
  }).sort((a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime())
}

function openAppt(appt: any) {
  selectedAppt.value = appt
  sessionNotes.value = appt.sessionNotes ?? ''
  apptModal.value = true
}

async function saveSessionNotes() {
  savingNotes.value = true
  try {
    await calendarApi.updateSessionNotes(selectedAppt.value.appointmentId, sessionNotes.value)
    selectedAppt.value.sessionNotes = sessionNotes.value
    apptModal.value = false
  } finally { savingNotes.value = false }
}

async function completeSession() {
  savingNotes.value = true
  try {
    await calendarApi.completeSession(selectedAppt.value.appointmentId, {
      sessionNotes: sessionNotes.value,
      requiresFollowUp: false,
    })
    apptModal.value = false
    load()
  } finally { savingNotes.value = false }
}

const isToday = (day: Date) => day.toDateString() === new Date().toDateString()
const statusColors: Record<string,string> = {
  Confirmed:  'bg-forest-100 dark:bg-forest-900/40 border-l-2 border-l-forest-400',
  InProgress: 'bg-blue-100 dark:bg-blue-900/30 border-l-2 border-l-blue-400',
  Completed:  'bg-[var(--color-surface-2)] border-l-2 border-l-[var(--color-border)]',
  Cancelled:  'bg-red-50 dark:bg-red-900/10 border-l-2 border-l-red-300 opacity-60',
  Pending:    'bg-warm-50 dark:bg-warm-900/20 border-l-2 border-l-warm-400',
}
const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

onMounted(load)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-7xl mx-auto">
    <SPageHeader title="Calendar" subtitle="Manage your weekly schedule">
      <template #actions>
        <button @click="availModal = true" class="btn-secondary text-sm flex items-center gap-2">
          <Icon name="heroicons:clock" class="w-4 h-4" /> Availability
        </button>
      </template>
    </SPageHeader>

    <!-- Week navigation -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <button @click="prevWeek" class="p-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
          <Icon name="heroicons:chevron-left" class="w-5 h-5 text-[var(--color-text-muted)]" />
        </button>
        <button @click="nextWeek" class="p-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
          <Icon name="heroicons:chevron-right" class="w-5 h-5 text-[var(--color-text-muted)]" />
        </button>
        <p class="font-body font-medium text-[var(--color-text)] text-sm">{{ weekLabel }}</p>
      </div>
      <button @click="goToday" class="btn-secondary text-sm">Today</button>
    </div>

    <SLoader v-if="loading" label="Loading calendar..." />

    <div v-else class="grid grid-cols-7 gap-2">
      <!-- Day headers -->
      <div v-for="(day, i) in weekDays" :key="i"
        :class="['text-center p-2 rounded-xl mb-1', isToday(day) ? 'bg-forest-500' : '']">
        <p :class="['font-body text-xs font-medium', isToday(day) ? 'text-white' : 'text-[var(--color-text-muted)]']">
          {{ dayNames[i] }}
        </p>
        <p :class="['font-display text-lg', isToday(day) ? 'text-white' : 'text-[var(--color-text)]']">
          {{ day.getDate() }}
        </p>
      </div>

      <!-- Day columns -->
      <div v-for="(day, i) in weekDays" :key="`col-${i}`"
        :class="['min-h-40 p-1 rounded-xl space-y-1', isToday(day) ? 'bg-forest-50 dark:bg-forest-900/10' : 'bg-[var(--color-surface-2)]']">
        <div v-if="!getAppointmentsForDay(day).length" class="h-full flex items-center justify-center">
          <p class="font-body text-[10px] text-[var(--color-text-muted)] text-center">Free</p>
        </div>
        <button v-for="appt in getAppointmentsForDay(day)" :key="appt.appointmentId"
          @click="openAppt(appt)"
          :class="['w-full text-left p-2 rounded-lg text-xs transition-all hover:scale-[1.02]', statusColors[appt.status] ?? 'bg-[var(--color-surface)]']">
          <p class="font-body font-semibold text-[var(--color-text)] truncate">
            {{ formatTime(appt.scheduledDateTime) }}
          </p>
          <p class="font-body text-[var(--color-text-muted)] truncate text-[10px]">
            {{ appt.clientProfile?.firstName }} {{ appt.clientProfile?.lastName }}
          </p>
          <div class="flex items-center gap-1 mt-0.5">
            <Icon :name="appt.sessionFormat === 'Online' ? 'heroicons:video-camera' : 'heroicons:building-office'" class="w-3 h-3 text-[var(--color-text-muted)]" />
            <span class="font-body text-[9px] text-[var(--color-text-muted)]">{{ appt.durationMinutes }}m</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Appointment detail modal -->
    <SModal v-model="apptModal" :title="selectedAppt ? `Session — ${formatTime(selectedAppt.scheduledDateTime)}` : ''" max-width="max-w-lg">
      <div v-if="selectedAppt" class="space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
          <SAvatar :src="selectedAppt.clientProfile?.profilePictureUrl"
            :name="`${selectedAppt.clientProfile?.firstName ?? 'C'} ${selectedAppt.clientProfile?.lastName ?? ''}`"
            size="md" color="bg-forest-500" />
          <div>
            <p class="font-body font-semibold text-sm text-[var(--color-text)]">
              {{ selectedAppt.clientProfile?.firstName }} {{ selectedAppt.clientProfile?.lastName }}
            </p>
            <p class="font-body text-xs text-[var(--color-text-muted)]">
              {{ formatDate(selectedAppt.scheduledDateTime, { weekday:'long', month:'long', day:'numeric' }) }}
              · {{ formatTime(selectedAppt.scheduledDateTime) }}
              · {{ selectedAppt.durationMinutes }}min
              · {{ selectedAppt.sessionFormat }}
            </p>
          </div>
        </div>

        <div>
          <label class="input-label">Session Notes</label>
          <textarea v-model="sessionNotes" class="input resize-none" rows="6"
            placeholder="Record session notes, observations, homework assigned..." />
        </div>

        <div class="flex gap-2 flex-wrap">
          <NuxtLink v-if="selectedAppt.sessionFormat === 'Online' && selectedAppt.status !== 'Completed'"
            :to="`/therapist/sessions/${selectedAppt.appointmentId}`"
            class="btn-primary text-sm flex items-center gap-1">
            <Icon name="heroicons:video-camera" class="w-4 h-4" /> Join session
          </NuxtLink>
          <NuxtLink :to="`/therapist/clients/${selectedAppt.clientId}`"
            class="btn-secondary text-sm">
            View client
          </NuxtLink>
          <button @click="saveSessionNotes" :disabled="savingNotes" class="btn-secondary text-sm">
            <span v-if="savingNotes" class="flex items-center gap-1">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Saving...
            </span>
            <span v-else>Save notes</span>
          </button>
          <button v-if="selectedAppt.status === 'Confirmed' || selectedAppt.status === 'InProgress'"
            @click="completeSession" :disabled="savingNotes" class="btn-primary text-sm">
            Mark complete
          </button>
        </div>
      </div>
    </SModal>

    <!-- Availability modal -->
    <SModal v-model="availModal" title="Manage Availability" max-width="max-w-lg">
      <TherapistAvailabilityForm :initial="availability" @saved="availModal = false; load()" @cancel="availModal = false" />
    </SModal>
  </div>
</template>
