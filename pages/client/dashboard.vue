<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })

const auth        = useAuthStore()
const mood        = useMood()
const appointments = useAppointments()
const homework    = useHomework()
const notifications = useNotifications()

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})

// Data
const todayMood        = ref<any>(null)
const moodStats        = ref<any>(null)
const upcomingAppts    = ref<any[]>([])
const pendingHomework  = ref<any[]>([])
const unreadCount      = ref(0)
const loadingMood      = ref(true)
const loadingAppts     = ref(true)
const loadingHomework  = ref(true)

// Check-in state
const checkInOpen  = ref(false)
const selectedMood = ref<number | null>(null)

async function loadDashboard() {
  // Parallel fetch everything
  await Promise.allSettled([
    mood.getTodaysMoodEntry().then(r => { todayMood.value = r.data }).catch(() => {}),
    mood.getMoodStats('week').then(r => { moodStats.value = r.data; loadingMood.value = false }).catch(() => { loadingMood.value = false }),
    appointments.getUpcomingAppointments().then(r => { upcomingAppts.value = r.data; loadingAppts.value = false }).catch(() => { loadingAppts.value = false }),
    homework.getMyAssignments().then(r => { pendingHomework.value = r.data?.items?.filter((h: any) => h.status !== 3) ?? []; loadingHomework.value = false }).catch(() => { loadingHomework.value = false }),
    notifications.getUnreadCount().then(r => { unreadCount.value = r.data?.count ?? 0 }).catch(() => {}),
  ])
}

async function submitCheckIn(score: number) {
  selectedMood.value = score
  checkInOpen.value = true
}

async function saveCheckIn(data: any) {
  await mood.createMoodEntry({ ...data, moodScore: selectedMood.value! })
  todayMood.value = { moodScore: selectedMood.value }
  checkInOpen.value = false
  mood.getMoodStats('week').then(r => { moodStats.value = r.data })
}

onMounted(loadDashboard)

const moodEmojis = [
  { score: 1, emoji: '😔', label: 'Very low' },
  { score: 2, emoji: '😕', label: 'Low' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😊', label: 'Great' },
]

const nextAppointment = computed(() => upcomingAppts.value[0] ?? null)
const dueTodayHomework = computed(() => {
  const today = new Date().toDateString()
  return pendingHomework.value.filter(h => new Date(h.dueDate).toDateString() === today)
})
</script>

<template>
  <div class="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <p class="font-body text-[var(--color-text-muted)] text-sm">{{ greeting }},</p>
        <h1 class="font-display text-3xl text-[var(--color-text)]">{{ auth.user?.firstName }} 👋</h1>
      </div>
      <NuxtLink to="/client/notifications" class="relative p-2.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
        <Icon name="heroicons:bell" class="w-6 h-6 text-[var(--color-text-muted)]" />
        <span v-if="unreadCount > 0"
          class="absolute top-1 right-1 w-5 h-5 rounded-full bg-terra-400 text-white text-[10px] font-bold flex items-center justify-center">
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </NuxtLink>
    </div>

    <!-- Daily Check-in -->
    <div class="relative overflow-hidden rounded-2xl p-6"
      :class="todayMood ? 'bg-[var(--color-surface-2)] border border-[var(--color-border)]' : 'bg-gradient-serenity'">
      <div v-if="!todayMood">
        <div class="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div class="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 pointer-events-none" />
        <div class="relative z-10">
          <p class="font-body text-white/70 text-sm mb-1">Daily Check-in</p>
          <h2 class="font-display text-2xl text-white mb-4">How are you feeling today?</h2>
          <div class="flex gap-3 flex-wrap">
            <button v-for="item in moodEmojis" :key="item.score"
              @click="submitCheckIn(item.score)"
              class="flex flex-col items-center gap-1 group">
              <span class="w-12 h-12 rounded-xl bg-white/15 hover:bg-white/30 flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95">
                {{ item.emoji }}
              </span>
              <span class="font-body text-[10px] text-white/60 group-hover:text-white/90 transition-colors">{{ item.label }}</span>
            </button>
          </div>
        </div>
      </div>
      <div v-else class="flex items-center gap-4">
        <span class="text-3xl">{{ moodEmojis.find(m => m.score === todayMood.moodScore)?.emoji ?? '😐' }}</span>
        <div>
          <p class="font-body text-sm font-medium text-[var(--color-text)]">Today's check-in done</p>
          <p class="font-body text-xs text-[var(--color-text-muted)]">
            Feeling {{ moodEmojis.find(m => m.score === todayMood.moodScore)?.label?.toLowerCase() ?? 'okay' }}
          </p>
        </div>
        <NuxtLink to="/client/mood" class="ml-auto font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">
          View mood →
        </NuxtLink>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="card-sm text-center">
        <p class="font-display text-2xl text-forest-500">
          {{ loadingMood ? '—' : (moodStats?.streakDays ?? 0) }}
        </p>
        <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Day Streak 🔥</p>
      </div>
      <div class="card-sm text-center">
        <p class="font-display text-2xl text-[var(--color-text)]">
          {{ loadingAppts ? '—' : upcomingAppts.length }}
        </p>
        <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Upcoming Sessions</p>
      </div>
      <div class="card-sm text-center">
        <p class="font-display text-2xl text-terra-500">
          {{ loadingHomework ? '—' : pendingHomework.length }}
        </p>
        <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Tasks Pending</p>
      </div>
      <div class="card-sm text-center">
        <p class="font-display text-2xl text-[var(--color-text)]">
          {{ loadingMood ? '—' : (moodStats?.average?.toFixed(1) ?? '—') }}
        </p>
        <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Avg Mood (7d)</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">

      <!-- Next Appointment -->
      <div class="lg:col-span-2 card space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-display text-lg text-[var(--color-text)]">Next Appointment</h3>
          <NuxtLink to="/client/appointments" class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">
            See all →
          </NuxtLink>
        </div>

        <SLoader v-if="loadingAppts" label="Loading appointments..." />

        <div v-else-if="!nextAppointment">
          <SEmpty icon="heroicons:calendar" title="No upcoming sessions"
            subtitle="Book a session with a therapist to get started">
            <NuxtLink to="/client/therapists" class="btn-primary mt-4 inline-flex text-sm">
              Find a therapist
            </NuxtLink>
          </SEmpty>
        </div>

        <div v-else class="space-y-3">
          <div class="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface-2)]">
            <SAvatar
              :src="nextAppointment.therapistProfile?.profilePictureUrl"
              :name="`${nextAppointment.therapistProfile?.firstName ?? 'T'} ${nextAppointment.therapistProfile?.lastName ?? ''}`"
              size="lg"
              color="bg-clay-500"
            />
            <div class="flex-1 min-w-0">
              <p class="font-body font-semibold text-[var(--color-text)] text-sm">
                Dr. {{ nextAppointment.therapistProfile?.lastName ?? '—' }}
              </p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">
                {{ formatDate(nextAppointment.scheduledDateTime, { weekday: 'short', month: 'short', day: 'numeric' }) }}
                · {{ formatTime(nextAppointment.scheduledDateTime) }}
              </p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">
                {{ nextAppointment.sessionFormat }} · {{ nextAppointment.durationMinutes }} min
              </p>
            </div>
            <div class="flex flex-col gap-2 items-end shrink-0">
              <SBadge variant="green">Confirmed</SBadge>
              <NuxtLink v-if="nextAppointment.sessionFormat === 'Online'"
                :to="`/client/sessions/${nextAppointment.appointmentId}/waiting-room`"
                class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">
                Join call →
              </NuxtLink>
            </div>
          </div>

          <!-- Rest of upcoming -->
          <div v-for="appt in upcomingAppts.slice(1, 3)" :key="appt.appointmentId"
            class="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)]">
            <SAvatar
              :src="appt.therapistProfile?.profilePictureUrl"
              :name="`${appt.therapistProfile?.firstName ?? 'T'} ${appt.therapistProfile?.lastName ?? ''}`"
              size="sm" color="bg-clay-400"
            />
            <div class="flex-1 min-w-0">
              <p class="font-body text-sm text-[var(--color-text)] truncate">
                Dr. {{ appt.therapistProfile?.lastName ?? '—' }}
              </p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">
                {{ formatDate(appt.scheduledDateTime, { weekday: 'short', month: 'short', day: 'numeric' }) }}
                · {{ formatTime(appt.scheduledDateTime) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Homework & Tasks -->
      <div class="card space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-display text-lg text-[var(--color-text)]">Homework</h3>
          <SBadge v-if="dueTodayHomework.length" variant="terra">{{ dueTodayHomework.length }} due today</SBadge>
        </div>

        <SLoader v-if="loadingHomework" />

        <SEmpty v-else-if="!pendingHomework.length"
          icon="heroicons:clipboard-document-check"
          title="All caught up!"
          subtitle="No pending homework assignments" />

        <div v-else class="space-y-3">
          <NuxtLink v-for="hw in pendingHomework.slice(0, 4)" :key="hw.assignmentId"
            :to="`/client/homework/${hw.assignmentId}`"
            :class="[
              'block p-3 rounded-xl border transition-colors',
              new Date(hw.dueDate) < new Date()
                ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                : new Date(hw.dueDate).toDateString() === new Date().toDateString()
                  ? 'border-terra-400/40 bg-terra-400/5'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
            ]">
            <p class="font-body text-sm font-medium text-[var(--color-text)] truncate">{{ hw.title }}</p>
            <p class="font-body text-xs text-[var(--color-text-muted)] mt-0.5">
              Due {{ formatDate(hw.dueDate, { weekday: 'short', month: 'short', day: 'numeric' }) }}
            </p>
          </NuxtLink>
          <NuxtLink v-if="pendingHomework.length > 4" to="/client/homework"
            class="block font-body text-xs text-center text-forest-500 hover:text-forest-600 transition-colors pt-1">
            +{{ pendingHomework.length - 4 }} more →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Mood Trend Mini -->
    <div v-if="moodStats?.entries?.length" class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display text-lg text-[var(--color-text)]">This Week's Mood</h3>
        <NuxtLink to="/client/mood" class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">
          Full stats →
        </NuxtLink>
      </div>
      <div class="flex items-end gap-2 h-16">
        <div v-for="entry in moodStats.entries.slice(-7)" :key="entry.moodId"
          class="flex-1 flex flex-col items-center gap-1">
          <div
            :style="{ height: `${(entry.moodScore / 5) * 48}px` }"
            :class="[
              'w-full rounded-t-lg transition-all',
              entry.moodScore >= 4 ? 'bg-forest-400' :
              entry.moodScore >= 3 ? 'bg-terra-400' : 'bg-clay-400'
            ]" />
          <p class="font-body text-[10px] text-[var(--color-text-muted)]">
            {{ new Date(entry.entryDate).toLocaleDateString('en-ZA', { weekday: 'narrow' }) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Check-in Detail Modal -->
    <SModal v-model="checkInOpen" title="How are you feeling?" max-width="max-w-md">
      <ClientMoodCheckInForm
        :initial-score="selectedMood"
        @submit="saveCheckIn"
        @cancel="checkInOpen = false"
      />
    </SModal>
  </div>
</template>
