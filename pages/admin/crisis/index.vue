<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const crisisApi = useAdminCrisis()

const alerts      = ref<any[]>([])
const loading     = ref(true)
const statusFilter= ref<number | null>(null)
const resolveModal= ref(false)
const resolveTarget=ref<any>(null)
const resolveNotes= ref('')
const resolving   = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await crisisApi.getAlerts(statusFilter.value ?? undefined)
    alerts.value = res.data ?? []
  } finally { loading.value = false }
}

async function confirmResolve() {
  if (!resolveTarget.value) return
  resolving.value = true
  try {
    await crisisApi.resolveAlert(resolveTarget.value.crisisId, resolveNotes.value)
    resolveModal.value = false; resolveNotes.value = ''; load()
  } finally { resolving.value = false }
}

async function escalate(alert: any) {
  await crisisApi.escalate(alert.crisisId)
  load()
}

watch(statusFilter, load)
onMounted(load)

const severityLabels: Record<number,string> = { 1:'Low',2:'Moderate',3:'High',4:'Critical' }
const severityVariants: Record<number,any>  = { 1:'gray',2:'terra',3:'red',4:'red' }
const typeLabels: Record<number,string>     = { 1:'Self Harm',2:'Suicidal',3:'Panic Attack',4:'Substance Use',5:'Other' }
const statusLabels: Record<number,string>   = { 0:'Active',1:'In Progress',2:'Resolved',3:'Escalated' }
const statusVariants: Record<number,any>    = { 0:'red',1:'terra',2:'green',3:'clay' }
</script>

<template>
  <div class="p-6 lg:p-8 max-w-5xl mx-auto">
    <SPageHeader title="Crisis Alerts" subtitle="Monitor and respond to client crisis situations" />

    <!-- Status filter -->
    <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit mb-6">
      <button v-for="f in [{val:null,label:'All'},{val:0,label:'Active'},{val:1,label:'In Progress'},{val:2,label:'Resolved'}]"
        :key="String(f.val)" @click="statusFilter = f.val"
        :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
          statusFilter === f.val ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
        {{ f.label }}
      </button>
    </div>

    <SLoader v-if="loading" label="Loading crisis alerts..." />
    <SEmpty v-else-if="!alerts.length"
      icon="heroicons:shield-check" title="No crisis alerts"
      :subtitle="statusFilter === null ? 'No crisis events on the platform' : 'No alerts with this status'" />

    <div v-else class="space-y-4">
      <div v-for="alert in alerts" :key="alert.crisisId"
        :class="['card border-l-4 transition-shadow hover:shadow-elevated',
          alert.status === 0 ? 'border-l-red-500' :
          alert.status === 1 ? 'border-l-orange-400' :
          alert.status === 3 ? 'border-l-clay-500' : 'border-l-[var(--color-border)]']">
        <div class="flex items-start gap-4">
          <div :class="['w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            alert.status === 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-[var(--color-surface-2)]']">
            <Icon name="heroicons:exclamation-triangle"
              :class="['w-6 h-6', alert.status === 0 ? 'text-red-500' : 'text-[var(--color-text-muted)]']" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="font-body font-semibold text-[var(--color-text)]">
                    {{ alert.clientName ?? 'Unknown Client' }}
                  </p>
                  <SBadge :variant="severityVariants[alert.severity] ?? 'gray'">
                    {{ severityLabels[alert.severity] ?? 'Unknown' }} severity
                  </SBadge>
                  <SBadge :variant="statusVariants[alert.status] ?? 'gray'">
                    {{ statusLabels[alert.status] ?? 'Unknown' }}
                  </SBadge>
                </div>
                <p class="font-body text-sm text-[var(--color-text-muted)] mt-0.5">
                  {{ typeLabels[alert.type] ?? 'Crisis event' }} ·
                  {{ formatDate(alert.createdAt, { weekday:'short', month:'short', day:'numeric' }) }}
                  · {{ formatTime(alert.createdAt) }}
                </p>
              </div>
            </div>

            <div v-if="alert.clientMessage" class="mt-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
              <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Client's message</p>
              <p class="font-body text-sm text-[var(--color-text)]">{{ alert.clientMessage }}</p>
            </div>

            <div v-if="alert.locationAddress" class="mt-2 flex items-center gap-1">
              <Icon name="heroicons:map-pin" class="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <p class="font-body text-xs text-[var(--color-text-muted)]">{{ alert.locationAddress }}</p>
            </div>

            <div v-if="alert.resolutionNotes" class="mt-3 p-3 rounded-xl bg-forest-50 dark:bg-forest-900/20">
              <p class="font-body text-xs text-forest-700 dark:text-forest-400 mb-1">Resolution notes</p>
              <p class="font-body text-sm text-[var(--color-text)]">{{ alert.resolutionNotes }}</p>
            </div>

            <div v-if="alert.status !== 2" class="flex gap-2 mt-3 flex-wrap">
              <button @click="resolveTarget = alert; resolveNotes = ''; resolveModal = true"
                class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                <Icon name="heroicons:check" class="w-3.5 h-3.5" /> Mark resolved
              </button>
              <button v-if="!alert.isEscalated" @click="escalate(alert)"
                class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                <Icon name="heroicons:arrow-up" class="w-3.5 h-3.5" /> Escalate
              </button>
              <NuxtLink :to="`/admin/users?search=${alert.clientName}`"
                class="btn-secondary text-xs py-1.5 px-3">
                View client
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SModal v-model="resolveModal" title="Resolve Crisis Alert" max-width="max-w-md">
      <div class="space-y-4">
        <div class="p-3 rounded-xl bg-[var(--color-surface-2)]">
          <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ resolveTarget?.clientName }}</p>
          <p class="font-body text-xs text-[var(--color-text-muted)]">{{ typeLabels[resolveTarget?.type] }} — {{ severityLabels[resolveTarget?.severity] }} severity</p>
        </div>
        <div>
          <label class="input-label">Resolution notes</label>
          <textarea v-model="resolveNotes" class="input resize-none" rows="4"
            placeholder="Describe how this crisis was resolved, actions taken, referrals made..." />
        </div>
        <div class="flex gap-3">
          <button @click="resolveModal = false" class="btn-secondary flex-1">Cancel</button>
          <button @click="confirmResolve" :disabled="resolving || !resolveNotes.trim()" class="btn-primary flex-1">
            <span v-if="resolving" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Resolving...
            </span>
            <span v-else>Confirm resolution</span>
          </button>
        </div>
      </div>
    </SModal>
  </div>
</template>
