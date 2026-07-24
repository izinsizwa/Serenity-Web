<script setup lang="ts">
import { AppointmentStatus } from '~/types'
definePageMeta({ layout: 'client', middleware: 'auth' })

const appointmentApi = useAppointments()
const activeTab  = ref<string>('upcoming')
const page       = ref(1)
const loading    = ref(false)
const error      = ref('')
const items      = ref<any[]>([])
const totalPages = ref(1)
const cancelModal  = ref(false)
const cancelTarget = ref<any>(null)
const cancelReason = ref('')
const cancelling   = ref(false)

const statusMap: Record<string, { label: string; variant: any }> = {
  Pending:    { label: 'Pending',     variant: 'gray'  },
  Confirmed:  { label: 'Confirmed',   variant: 'green' },
  InProgress: { label: 'In Progress', variant: 'blue'  },
  Completed:  { label: 'Completed',   variant: 'clay'  },
  Cancelled:  { label: 'Cancelled',   variant: 'red'   },
  NoShow:     { label: 'No Show',     variant: 'red'   },
}

async function load() {
  loading.value = true; error.value = ''
  try {
    const statusFilter = activeTab.value === 'upcoming'
      ? AppointmentStatus.Confirmed
      : activeTab.value === 'past' ? AppointmentStatus.Completed : undefined
    const res = await appointmentApi.getMyAppointments({ status: statusFilter, page: page.value, pageSize: 10 })
    items.value      = res.data?.items ?? []
    totalPages.value = res.data?.totalPages ?? 1
  } catch (e: any) { error.value = e.message } finally { loading.value = false }
}

watch([activeTab], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

function openCancel(appt: any) { cancelTarget.value = appt; cancelModal.value = true; cancelReason.value = '' }

async function confirmCancel() {
  if (!cancelTarget.value) return
  cancelling.value = true
  try {
    await appointmentApi.cancelAppointment(cancelTarget.value.appointmentId, cancelReason.value)
    cancelModal.value = false
    load()
  } catch (e: any) { error.value = e.message }
  finally { cancelling.value = false }
}
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <SPageHeader title="Appointments" subtitle="Manage your therapy sessions">
      <template #actions>
        <NuxtLink to="/client/therapists" class="btn-primary flex items-center gap-2 text-sm">
          <Icon name="heroicons:plus" class="w-4 h-4" /> Book session
        </NuxtLink>
      </template>
    </SPageHeader>

    <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit mb-6">
      <button v-for="tab in [{ key:'upcoming',label:'Upcoming'},{ key:'past',label:'Past'},{ key:'all',label:'All'}]"
        :key="tab.key" @click="activeTab = tab.key"
        :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
          activeTab === tab.key
            ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
        {{ tab.label }}
      </button>
    </div>

    <SLoader v-if="loading" label="Loading appointments..." />
    <SError v-else-if="error" :message="error" :on-retry="load" />
    <SEmpty v-else-if="!items.length"
      icon="heroicons:calendar" title="No appointments found"
      :subtitle="activeTab === 'upcoming' ? 'Book a session with a therapist to get started' : 'No appointments in this period'">
      <NuxtLink v-if="activeTab === 'upcoming'" to="/client/therapists" class="btn-primary mt-4 inline-flex text-sm">
        Find a therapist
      </NuxtLink>
    </SEmpty>

    <div v-else class="space-y-4">
      <div v-for="appt in items" :key="appt.appointmentId" class="card hover:shadow-elevated transition-shadow">
        <div class="flex items-start gap-4">
          <SAvatar :src="appt.therapistProfile?.profilePictureUrl"
            :name="`${appt.therapistProfile?.firstName ?? 'T'} ${appt.therapistProfile?.lastName ?? ''}`"
            size="lg" color="bg-clay-500" />
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p class="font-body font-semibold text-[var(--color-text)]">
                  Dr. {{ appt.therapistProfile?.firstName }} {{ appt.therapistProfile?.lastName }}
                </p>
                <p class="font-body text-sm text-[var(--color-text-muted)]">{{ appt.therapistProfile?.qualification }}</p>
              </div>
              <SBadge :variant="statusMap[appt.status]?.variant ?? 'gray'">
                {{ statusMap[appt.status]?.label ?? appt.status }}
              </SBadge>
            </div>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span class="flex items-center gap-1 font-body text-xs text-[var(--color-text-muted)]">
                <Icon name="heroicons:calendar" class="w-3.5 h-3.5" />
                {{ formatDate(appt.scheduledDateTime, { weekday:'long', month:'long', day:'numeric', year:'numeric' }) }}
              </span>
              <span class="flex items-center gap-1 font-body text-xs text-[var(--color-text-muted)]">
                <Icon name="heroicons:clock" class="w-3.5 h-3.5" />
                {{ formatTime(appt.scheduledDateTime) }} · {{ appt.durationMinutes }} min
              </span>
              <span class="flex items-center gap-1 font-body text-xs text-[var(--color-text-muted)]">
                <Icon :name="appt.sessionFormat === 'Online' ? 'heroicons:video-camera' : 'heroicons:building-office'" class="w-3.5 h-3.5" />
                {{ appt.sessionFormat }}
              </span>
              <span class="flex items-center gap-1 font-body text-xs text-[var(--color-text-muted)]">
                <Icon name="heroicons:banknotes" class="w-3.5 h-3.5" />
                {{ formatCurrency(appt.consultationFee) }} · {{ appt.paymentStatus }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-3 flex-wrap">
              <NuxtLink :to="`/client/appointments/${appt.appointmentId}`" class="btn-secondary text-xs py-1.5 px-3">
                View details
              </NuxtLink>
              <NuxtLink v-if="appt.sessionFormat === 'Online' && appt.status === 'Confirmed'"
                :to="`/client/sessions/${appt.appointmentId}/waiting-room`"
                class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                <Icon name="heroicons:video-camera" class="w-3.5 h-3.5" /> Join session
              </NuxtLink>
              <button v-if="['Pending','Confirmed'].includes(appt.status)"
                @click="openCancel(appt)"
                class="font-body text-xs text-red-500 hover:text-red-600 transition-colors px-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <SPagination v-model:page="page" :total-pages="totalPages" />
    </div>

    <SModal v-model="cancelModal" title="Cancel appointment" max-width="max-w-md">
      <div class="space-y-4">
        <p class="font-body text-sm text-[var(--color-text-muted)]">
          Cancel appointment with <strong>Dr. {{ cancelTarget?.therapistProfile?.lastName }}</strong> on
          {{ cancelTarget ? formatDate(cancelTarget.scheduledDateTime, { weekday:'long', month:'long', day:'numeric' }) : '' }}?
        </p>
        <div>
          <label class="input-label">Reason for cancellation</label>
          <textarea v-model="cancelReason" class="input resize-none" rows="3"
            placeholder="Please let your therapist know why you're cancelling..." />
        </div>
        <div class="flex gap-3">
          <button @click="cancelModal = false" class="btn-secondary flex-1">Keep it</button>
          <button @click="confirmCancel" :disabled="cancelling || !cancelReason.trim()" class="btn-danger flex-1">
            <span v-if="cancelling" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Cancelling...
            </span>
            <span v-else>Cancel appointment</span>
          </button>
        </div>
      </div>
    </SModal>
  </div>
</template>
