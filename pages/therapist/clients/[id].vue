<script setup lang="ts">
definePageMeta({ layout: 'therapist', middleware: 'auth' })
const route      = useRoute()
const clientsApi = useTherapistClients()
const id         = route.params.id as string

const client      = ref<any>(null)
const moodHistory = ref<any>(null)
const appointments= ref<any[]>([])
const goals       = ref<any[]>([])
const journal     = ref<any[]>([])
const loading     = ref(true)
const activeTab   = ref('overview')
const moodPeriod  = ref('month')

const notesModal  = ref(false)
const notes       = ref('')
const savingNotes = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await clientsApi.getClientById(id)
    client.value = res.data
    notes.value  = res.data?.treatmentNotes ?? ''
  } finally { loading.value = false }
}

async function loadMood() {
  const res = await clientsApi.getClientMoodHistory(id, moodPeriod.value)
  moodHistory.value = res.data
}

async function loadAppointments() {
  const res = await clientsApi.getClientAppointments(id)
  appointments.value = res.data ?? []
}

async function loadGoals() {
  const res = await clientsApi.getClientGoals(id)
  goals.value = res.data ?? []
}

async function loadJournal() {
  const res = await clientsApi.getClientJournalEntries(id)
  journal.value = res.data ?? []
}

async function saveNotes() {
  savingNotes.value = true
  try {
    await clientsApi.updateTreatmentNotes(id, notes.value)
    notesModal.value = false
  } finally { savingNotes.value = false }
}

watch(activeTab, (tab) => {
  if (tab === 'mood' && !moodHistory.value) loadMood()
  if (tab === 'appointments' && !appointments.value.length) loadAppointments()
  if (tab === 'goals' && !goals.value.length) loadGoals()
  if (tab === 'journal' && !journal.value.length) loadJournal()
})

watch(moodPeriod, loadMood)
onMounted(load)

const moodColors: Record<number,string> = { 1:'bg-red-400',2:'bg-orange-400',3:'bg-yellow-400',4:'bg-lime-400',5:'bg-forest-400' }
const moodLabels: Record<number,string> = { 1:'Very Low',2:'Low',3:'Neutral',4:'Good',5:'Great' }
</script>

<template>
  <div class="p-6 lg:p-8 max-w-5xl mx-auto">
    <SPageHeader title="" back="/therapist/clients" back-label="Clients" />
    <SLoader v-if="loading" label="Loading client profile..." />

    <div v-else-if="client" class="space-y-6">
      <!-- Hero card -->
      <div class="card">
        <div class="flex flex-col sm:flex-row items-start gap-5">
          <SAvatar :src="client.profilePictureUrl"
            :name="`${client.firstName ?? ''} ${client.lastName ?? ''}`"
            size="xl" color="bg-forest-500" />
          <div class="flex-1">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="font-display text-2xl text-[var(--color-text)]">
                {{ client.firstName }} {{ client.lastName }}
              </h1>
              <SBadge v-if="client.hasCrisisAlert" variant="red">⚠ Crisis Alert</SBadge>
            </div>
            <p class="font-body text-[var(--color-text-muted)] text-sm mt-0.5">
              {{ client.email }} · {{ client.phoneNumber }}
            </p>
            <div class="flex flex-wrap gap-2 mt-3">
              <SBadge variant="gray">{{ client.totalSessions ?? 0 }} sessions</SBadge>
              <SBadge v-if="client.hasMedicalAid" variant="green">Medical Aid</SBadge>
              <SBadge variant="clay">
                Client since {{ formatDate(client.createdAt, { month: 'short', year: 'numeric' }) }}
              </SBadge>
            </div>
          </div>
          <div class="flex gap-2 shrink-0">
            <NuxtLink :to="`/therapist/messages?to=${client.userId}`" class="btn-secondary text-sm flex items-center gap-1">
              <Icon name="heroicons:chat-bubble-left" class="w-4 h-4" /> Message
            </NuxtLink>
            <button @click="notesModal = true" class="btn-primary text-sm flex items-center gap-1">
              <Icon name="heroicons:pencil" class="w-4 h-4" /> Notes
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit overflow-x-auto">
        <button v-for="tab in [
          {key:'overview',label:'Overview'},
          {key:'mood',label:'Mood'},
          {key:'appointments',label:'Sessions'},
          {key:'goals',label:'Goals'},
          {key:'journal',label:'Journal'},
        ]" :key="tab.key" @click="activeTab = tab.key"
          :class="['px-4 py-2 rounded-lg font-body text-sm font-medium whitespace-nowrap transition-all',
            activeTab === tab.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
          {{ tab.label }}
        </button>
      </div>

      <!-- Overview tab -->
      <div v-if="activeTab === 'overview'" class="grid sm:grid-cols-2 gap-5">
        <div class="card space-y-3">
          <h3 class="font-display text-lg text-[var(--color-text)]">Clinical Info</h3>
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)]">Presenting Concerns</p>
            <p class="font-body text-sm text-[var(--color-text)] mt-0.5">{{ client.presentingConcerns || '—' }}</p>
          </div>
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)]">Mental Health History</p>
            <p class="font-body text-sm text-[var(--color-text)] mt-0.5">{{ client.mentalHealthHistory || '—' }}</p>
          </div>
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)]">Current Medications</p>
            <p class="font-body text-sm text-[var(--color-text)] mt-0.5">{{ client.currentMedications || 'None reported' }}</p>
          </div>
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)]">Allergies</p>
            <p class="font-body text-sm text-[var(--color-text)] mt-0.5">{{ client.allergies || 'None reported' }}</p>
          </div>
        </div>
        <div class="card space-y-3">
          <h3 class="font-display text-lg text-[var(--color-text)]">Emergency Contact</h3>
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)]">Name</p>
            <p class="font-body text-sm text-[var(--color-text)]">{{ client.emergencyContactName || '—' }}</p>
          </div>
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)]">Phone</p>
            <p class="font-body text-sm text-[var(--color-text)]">{{ client.emergencyContactPhone || '—' }}</p>
          </div>
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)]">Relationship</p>
            <p class="font-body text-sm text-[var(--color-text)]">{{ client.emergencyContactRelationship || '—' }}</p>
          </div>
          <div class="divider" />
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)]">Medical Aid</p>
            <p class="font-body text-sm text-[var(--color-text)]">
              {{ client.hasMedicalAid ? `${client.medicalAidPlan ?? ''} · ${client.medicalAidNumber ?? ''}` : 'None' }}
            </p>
          </div>
        </div>
        <div v-if="client.treatmentNotes" class="sm:col-span-2 card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-display text-lg text-[var(--color-text)]">Treatment Notes</h3>
            <button @click="notesModal = true" class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">Edit →</button>
          </div>
          <p class="font-body text-sm text-[var(--color-text-muted)] whitespace-pre-wrap leading-relaxed">{{ client.treatmentNotes }}</p>
        </div>
      </div>

      <!-- Mood tab -->
      <div v-else-if="activeTab === 'mood'" class="space-y-5">
        <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit">
          <button v-for="p in [{key:'week',label:'7d'},{key:'month',label:'30d'},{key:'3months',label:'3m'}]"
            :key="p.key" @click="moodPeriod = p.key"
            :class="['px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-all',
              moodPeriod === p.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
            {{ p.label }}
          </button>
        </div>
        <SLoader v-if="!moodHistory" label="Loading mood data..." />
        <div v-else-if="moodHistory?.entries?.length" class="space-y-5">
          <!-- Summary -->
          <div class="grid grid-cols-3 gap-4">
            <div class="card-sm text-center">
              <p class="font-display text-2xl" :class="moodHistory.average >= 4 ? 'text-forest-500' : moodHistory.average >= 3 ? 'text-yellow-500' : 'text-red-500'">
                {{ moodHistory.average?.toFixed(1) }}
              </p>
              <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Avg Mood</p>
            </div>
            <div class="card-sm text-center">
              <p class="font-display text-2xl text-[var(--color-text)]">{{ moodHistory.entries.length }}</p>
              <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Check-ins</p>
            </div>
            <div class="card-sm text-center">
              <div class="flex items-center justify-center">
                <Icon :name="moodHistory.trend === 'improving' ? 'heroicons:arrow-trending-up' : moodHistory.trend === 'declining' ? 'heroicons:arrow-trending-down' : 'heroicons:minus'"
                  :class="['w-7 h-7', moodHistory.trend === 'improving' ? 'text-forest-500' : moodHistory.trend === 'declining' ? 'text-red-500' : 'text-[var(--color-text-muted)]']" />
              </div>
              <p class="font-body text-xs text-[var(--color-text-muted)] mt-1 capitalize">{{ moodHistory.trend ?? 'Stable' }}</p>
            </div>
          </div>
          <!-- Bar chart -->
          <div class="card">
            <h3 class="font-display text-lg text-[var(--color-text)] mb-4">Mood History</h3>
            <div class="flex items-end gap-1 h-20">
              <div v-for="entry in moodHistory.entries" :key="entry.moodId"
                class="flex-1 group relative">
                <div :style="{ height: `${(entry.moodScore / 5) * 64}px` }"
                  :class="['w-full rounded-t-md transition-all cursor-pointer hover:opacity-80', moodColors[entry.moodScore]]">
                  <div class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none whitespace-nowrap">
                    <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 shadow-elevated text-center">
                      <p class="font-body text-xs font-medium text-[var(--color-text)]">{{ moodLabels[entry.moodScore] }}</p>
                      <p class="font-body text-[10px] text-[var(--color-text-muted)]">{{ formatDate(entry.entryDate, { month:'short', day:'numeric' }) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SEmpty v-else icon="heroicons:heart" title="No mood data" subtitle="Client hasn't logged any mood entries yet" />
      </div>

      <!-- Sessions tab -->
      <div v-else-if="activeTab === 'appointments'" class="space-y-3">
        <SLoader v-if="!appointments.length && loading" />
        <SEmpty v-else-if="!appointments.length" icon="heroicons:calendar" title="No sessions yet" subtitle="" />
        <div v-else class="space-y-3">
          <div v-for="appt in appointments" :key="appt.appointmentId"
            class="card-sm flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
              <Icon :name="appt.sessionFormat === 'Online' ? 'heroicons:video-camera' : 'heroicons:building-office'" class="w-5 h-5 text-[var(--color-text-muted)]" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-body text-sm font-medium text-[var(--color-text)]">
                {{ formatDate(appt.scheduledDateTime, { weekday:'short', month:'short', day:'numeric', year:'numeric' }) }}
                · {{ formatTime(appt.scheduledDateTime) }}
              </p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">{{ appt.sessionFormat }} · {{ appt.durationMinutes }}min · {{ formatCurrency(appt.consultationFee) }}</p>
            </div>
            <SBadge :variant="appt.status === 'Completed' ? 'clay' : appt.status === 'Cancelled' ? 'red' : 'green'">
              {{ appt.status }}
            </SBadge>
          </div>
        </div>
      </div>

      <!-- Goals tab -->
      <div v-else-if="activeTab === 'goals'" class="space-y-3">
        <SLoader v-if="!goals.length && loading" />
        <SEmpty v-else-if="!goals.length" icon="heroicons:flag" title="No goals set" subtitle="Goals assigned to this client will appear here" />
        <div v-else class="space-y-3">
          <div v-for="goal in goals" :key="goal.goalId" class="card space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-body font-semibold text-sm text-[var(--color-text)]">{{ goal.title }}</p>
                <p v-if="goal.description" class="font-body text-xs text-[var(--color-text-muted)] mt-0.5">{{ goal.description }}</p>
              </div>
              <SBadge :variant="goal.isCompleted ? 'green' : 'clay'">
                {{ goal.isCompleted ? 'Completed' : `${goal.progressPercentage}%` }}
              </SBadge>
            </div>
            <div class="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
              <div class="h-full bg-forest-400 rounded-full" :style="{width: `${goal.progressPercentage}%`}" />
            </div>
          </div>
        </div>
      </div>

      <!-- Journal tab -->
      <div v-else-if="activeTab === 'journal'" class="space-y-3">
        <SLoader v-if="!journal.length && loading" />
        <SEmpty v-else-if="!journal.length" icon="heroicons:book-open" title="No shared journal entries" subtitle="Only entries the client chose to share will appear here" />
        <div v-else class="space-y-3">
          <div v-for="entry in journal" :key="entry.entryId" class="card">
            <div class="flex items-start justify-between gap-2 mb-2">
              <p class="font-body font-semibold text-sm text-[var(--color-text)]">{{ entry.title || 'Untitled' }}</p>
              <p class="font-body text-xs text-[var(--color-text-muted)] shrink-0">{{ formatDate(entry.entryDate, { month:'short', day:'numeric' }) }}</p>
            </div>
            <p class="font-body text-sm text-[var(--color-text-muted)] line-clamp-3">{{ entry.content }}</p>
            <div v-if="entry.moodRating" class="mt-2 flex items-center gap-2">
              <span class="font-body text-xs text-[var(--color-text-muted)]">Mood:</span>
              <SRating :model-value="entry.moodRating" :size="3" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes modal -->
    <SModal v-model="notesModal" title="Treatment Notes" max-width="max-w-lg">
      <div class="space-y-4">
        <textarea v-model="notes" class="input resize-none" rows="10"
          placeholder="Clinical notes, treatment progress, observations..." />
        <div class="flex gap-3">
          <button @click="notesModal = false" class="btn-secondary flex-1">Cancel</button>
          <button @click="saveNotes" :disabled="savingNotes" class="btn-primary flex-1">
            <span v-if="savingNotes" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Saving...
            </span>
            <span v-else>Save notes</span>
          </button>
        </div>
      </div>
    </SModal>
  </div>
</template>
