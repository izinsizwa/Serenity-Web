<script setup lang="ts">
definePageMeta({ layout: 'therapist', middleware: 'auth' })
const auth      = useAuthStore()
const dashboard = useTherapistDashboard()

const stats    = ref<any>(null)
const schedule = ref<any[]>([])
const actions  = ref<any>(null)
const loading  = ref(true)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})

async function load() {
  loading.value = true
  await Promise.allSettled([
    dashboard.getDashboardStats().then(r => { stats.value = r.data }),
    dashboard.getTodaysSchedule().then(r => { schedule.value = r.data ?? [] }),
    dashboard.getPendingActions().then(r => { actions.value = r.data }),
  ])
  loading.value = false
}

onMounted(load)

const sessionStatusClass = (status: string) => ({
  Completed:  'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
  InProgress: 'bg-forest-50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800',
  Confirmed:  'bg-[var(--color-surface-2)]',
  Pending:    'bg-[var(--color-surface-2)]',
}[status] ?? 'bg-[var(--color-surface-2)]')
</script>

<template>
  <div class="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <p class="font-body text-[var(--color-text-muted)] text-sm">{{ greeting }},</p>
        <h1 class="font-display text-3xl text-[var(--color-text)]">Dr. {{ auth.user?.lastName }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/therapist/profile"
          class="relative p-2.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
          <Icon name="heroicons:bell" class="w-6 h-6 text-[var(--color-text-muted)]" />
          <span v-if="actions?.crisisAlerts?.length"
            class="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {{ actions.crisisAlerts.length }}
          </span>
        </NuxtLink>
      </div>
    </div>

    <!-- Crisis Alert Banner -->
    <div v-if="actions?.crisisAlerts?.length"
      class="flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
      <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
        <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-red-500" />
      </div>
      <div class="flex-1">
        <p class="font-body font-semibold text-sm text-red-700 dark:text-red-400">
          {{ actions.crisisAlerts.length }} active crisis alert{{ actions.crisisAlerts.length > 1 ? 's' : '' }}
        </p>
        <p class="font-body text-xs text-red-600 dark:text-red-500">Immediate attention required</p>
      </div>
      <NuxtLink to="/therapist/clients" class="btn-danger text-sm">View alerts</NuxtLink>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card-sm">
        <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Today's Sessions</p>
        <p class="font-display text-2xl text-[var(--color-text)]">{{ loading ? '—' : (stats?.todaysSessions ?? 0) }}</p>
        <p class="font-body text-xs text-forest-500 mt-1">{{ schedule.filter(s => s.status === 'Confirmed').length }} remaining</p>
      </div>
      <div class="card-sm">
        <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Active Clients</p>
        <p class="font-display text-2xl text-[var(--color-text)]">{{ loading ? '—' : (stats?.activeClients ?? 0) }}</p>
        <NuxtLink to="/therapist/clients" class="font-body text-xs text-forest-500 mt-1 inline-block hover:underline">View all →</NuxtLink>
      </div>
      <div class="card-sm">
        <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Pending Reviews</p>
        <p class="font-display text-2xl text-terra-500">{{ loading ? '—' : (stats?.pendingHomework ?? 0) }}</p>
        <NuxtLink to="/therapist/homework" class="font-body text-xs text-[var(--color-text-muted)] mt-1 inline-block hover:text-forest-500 transition-colors">Homework →</NuxtLink>
      </div>
      <div class="card-sm">
        <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">This Month</p>
        <p class="font-display text-2xl text-[var(--color-text)]">{{ loading ? '—' : formatCurrency(stats?.monthlyEarnings ?? 0) }}</p>
        <NuxtLink to="/therapist/earnings" class="font-body text-xs text-forest-500 mt-1 inline-block hover:underline">Earnings →</NuxtLink>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Today's schedule -->
      <div class="lg:col-span-2 card space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-display text-lg text-[var(--color-text)]">Today's Schedule</h3>
          <NuxtLink to="/therapist/calendar" class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">
            Full calendar →
          </NuxtLink>
        </div>

        <SLoader v-if="loading" label="Loading schedule..." />
        <SEmpty v-else-if="!schedule.length"
          icon="heroicons:calendar" title="No sessions today"
          subtitle="Your schedule is clear for today" />

        <div v-else class="space-y-2">
          <div v-for="appt in schedule" :key="appt.appointmentId"
            :class="['flex items-center gap-4 p-3 rounded-xl transition-colors', sessionStatusClass(appt.status)]">
            <p class="font-body text-sm text-[var(--color-text-muted)] w-14 shrink-0 font-medium">
              {{ formatTime(appt.scheduledDateTime) }}
            </p>
            <SAvatar :src="appt.clientProfile?.profilePictureUrl"
              :name="`${appt.clientProfile?.firstName ?? 'C'} ${appt.clientProfile?.lastName ?? ''}`"
              size="sm" color="bg-forest-500" />
            <div class="flex-1 min-w-0">
              <p class="font-body text-sm font-medium text-[var(--color-text)] truncate">
                {{ appt.clientProfile?.firstName }} {{ appt.clientProfile?.lastName }}
              </p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">
                {{ appt.sessionFormat }} · {{ appt.durationMinutes }}min
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <SBadge :variant="appt.status === 'Completed' ? 'gray' : appt.status === 'InProgress' ? 'green' : 'clay'">
                {{ appt.status === 'InProgress' ? 'Now' : appt.status }}
              </SBadge>
              <NuxtLink v-if="appt.sessionFormat === 'Online' && appt.status !== 'Completed'"
                :to="`/therapist/sessions/${appt.appointmentId}`"
                class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">
                Join →
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending actions -->
      <div class="card space-y-4">
        <h3 class="font-display text-lg text-[var(--color-text)]">Pending Actions</h3>
        <SLoader v-if="loading" />
        <div v-else class="space-y-3">
          <NuxtLink to="/therapist/messages"
            class="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors">
            <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5 text-[var(--color-text-muted)]" />
            <div class="flex-1">
              <p class="font-body text-sm font-medium text-[var(--color-text)]">Messages</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">{{ stats?.unreadMessages ?? 0 }} unread</p>
            </div>
            <span v-if="stats?.unreadMessages"
              class="w-6 h-6 rounded-full bg-forest-500 text-white text-xs font-bold flex items-center justify-center">
              {{ stats.unreadMessages > 9 ? '9+' : stats.unreadMessages }}
            </span>
          </NuxtLink>

          <NuxtLink to="/therapist/homework"
            class="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors">
            <Icon name="heroicons:clipboard-document-list" class="w-5 h-5 text-[var(--color-text-muted)]" />
            <div class="flex-1">
              <p class="font-body text-sm font-medium text-[var(--color-text)]">Homework Reviews</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">{{ actions?.homeworkToReview ?? 0 }} awaiting review</p>
            </div>
            <SBadge v-if="actions?.homeworkToReview" variant="terra">{{ actions.homeworkToReview }}</SBadge>
          </NuxtLink>

          <NuxtLink to="/therapist/calendar"
            class="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors">
            <Icon name="heroicons:calendar" class="w-5 h-5 text-[var(--color-text-muted)]" />
            <div class="flex-1">
              <p class="font-body text-sm font-medium text-[var(--color-text)]">Upcoming this week</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">Manage your schedule</p>
            </div>
            <Icon name="heroicons:chevron-right" class="w-4 h-4 text-[var(--color-text-muted)]" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
