<script setup lang="ts">
definePageMeta({ layout: 'therapist', middleware: 'auth' })
const calendarApi = useTherapistCalendar()

const sessions   = ref<any[]>([])
const loading    = ref(true)
const activeTab  = ref('upcoming')

async function load() {
  loading.value = true
  try {
    const now   = new Date()
    const from  = activeTab.value === 'upcoming' ? now.toISOString() : new Date(now.getTime() - 30 * 86400000).toISOString()
    const to    = activeTab.value === 'upcoming' ? new Date(now.getTime() + 30 * 86400000).toISOString() : now.toISOString()
    const res   = await calendarApi.getAppointments(from, to)
    sessions.value = (res.data ?? []).filter((s: any) =>
      activeTab.value === 'upcoming'
        ? ['Pending','Confirmed'].includes(s.status)
        : ['Completed','Cancelled'].includes(s.status)
    )
  } finally { loading.value = false }
}

watch(activeTab, load)
onMounted(load)

const statusColors: Record<string,any> = {
  Confirmed: 'green', InProgress: 'blue', Completed: 'clay', Cancelled: 'red', Pending: 'gray'
}
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <SPageHeader title="Sessions" subtitle="Your therapy sessions" />

    <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit mb-6">
      <button v-for="tab in [{key:'upcoming',label:'Upcoming'},{key:'past',label:'Past'}]"
        :key="tab.key" @click="activeTab = tab.key"
        :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
          activeTab === tab.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
        {{ tab.label }}
      </button>
    </div>

    <SLoader v-if="loading" label="Loading sessions..." />
    <SEmpty v-else-if="!sessions.length"
      icon="heroicons:video-camera"
      :title="activeTab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'"
      subtitle="" />

    <div v-else class="space-y-4">
      <div v-for="session in sessions" :key="session.appointmentId" class="card hover:shadow-elevated transition-shadow">
        <div class="flex items-start gap-4">
          <SAvatar :src="session.clientProfile?.profilePictureUrl"
            :name="`${session.clientProfile?.firstName ?? 'C'} ${session.clientProfile?.lastName ?? ''}`"
            size="lg" color="bg-forest-500" />
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p class="font-body font-semibold text-[var(--color-text)]">
                  {{ session.clientProfile?.firstName }} {{ session.clientProfile?.lastName }}
                </p>
                <p class="font-body text-sm text-[var(--color-text-muted)]">
                  {{ formatDate(session.scheduledDateTime, { weekday:'long', month:'long', day:'numeric', year:'numeric' }) }}
                  · {{ formatTime(session.scheduledDateTime) }}
                </p>
              </div>
              <SBadge :variant="statusColors[session.status] ?? 'gray'">{{ session.status }}</SBadge>
            </div>

            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span class="flex items-center gap-1 font-body text-xs text-[var(--color-text-muted)]">
                <Icon :name="session.sessionFormat === 'Online' ? 'heroicons:video-camera' : 'heroicons:building-office'" class="w-3.5 h-3.5" />
                {{ session.sessionFormat }}
              </span>
              <span class="flex items-center gap-1 font-body text-xs text-[var(--color-text-muted)]">
                <Icon name="heroicons:clock" class="w-3.5 h-3.5" />
                {{ session.durationMinutes }} min
              </span>
              <span class="flex items-center gap-1 font-body text-xs text-[var(--color-text-muted)]">
                <Icon name="heroicons:banknotes" class="w-3.5 h-3.5" />
                {{ formatCurrency(session.consultationFee) }} · {{ session.paymentStatus }}
              </span>
            </div>

            <div v-if="session.sessionNotes" class="mt-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
              <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Session notes</p>
              <p class="font-body text-sm text-[var(--color-text)] line-clamp-2">{{ session.sessionNotes }}</p>
            </div>

            <div class="flex gap-2 mt-3 flex-wrap">
              <NuxtLink v-if="session.sessionFormat === 'Online' && session.status === 'Confirmed'"
                :to="`/therapist/sessions/${session.appointmentId}`"
                class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                <Icon name="heroicons:video-camera" class="w-3.5 h-3.5" /> Join session
              </NuxtLink>
              <NuxtLink :to="`/therapist/clients/${session.clientId}`"
                class="btn-secondary text-xs py-1.5 px-3">
                View client
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
