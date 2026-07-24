<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const route          = useRoute()
const appointmentApi = useAppointments()
const id             = route.params.id as string

const appt    = ref<any>(null)
const loading = ref(true)
const error   = ref('')

const reviewModal  = ref(false)
const reviewForm   = reactive({ rating: 0, comment: '', isAnonymous: false })
const submittingRev= ref(false)

async function load() {
  loading.value = true; error.value = ''
  try {
    const res = await appointmentApi.getAppointmentById(id)
    appt.value = res.data
  } catch (e: any) { error.value = e.message }
  finally { loading.value = false }
}

async function submitReview() {
  submittingRev.value = true
  try {
    await appointmentApi.submitReview({
      appointmentId: id,
      therapistId: appt.value.therapistId,
      rating: reviewForm.rating,
      comment: reviewForm.comment || null,
      isAnonymous: reviewForm.isAnonymous,
    })
    reviewModal.value = false
    load()
  } finally { submittingRev.value = false }
}

onMounted(load)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-2xl mx-auto">
    <SPageHeader title="Appointment Details" back="/client/appointments" back-label="Appointments" />

    <SLoader v-if="loading" label="Loading appointment..." />
    <SError v-else-if="error" :message="error" :on-retry="load" />

    <div v-else-if="appt" class="space-y-6">
      <!-- Status banner -->
      <div :class="['flex items-center gap-3 p-4 rounded-xl border',
        appt.status === 'Confirmed' ? 'bg-forest-50 dark:bg-forest-900/20 border-forest-200 dark:border-forest-800' :
        appt.status === 'Completed' ? 'bg-[var(--color-surface-2)] border-[var(--color-border)]' :
        'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800']">
        <Icon :name="appt.status === 'Confirmed' ? 'heroicons:check-circle' :
                     appt.status === 'Completed' ? 'heroicons:clock' : 'heroicons:x-circle'"
          :class="['w-5 h-5',
            appt.status === 'Confirmed' ? 'text-forest-500' :
            appt.status === 'Completed' ? 'text-[var(--color-text-muted)]' : 'text-red-500']" />
        <div>
          <p class="font-body font-medium text-sm text-[var(--color-text)]">{{ appt.status }}</p>
          <p v-if="appt.cancellationReason" class="font-body text-xs text-[var(--color-text-muted)]">
            {{ appt.cancellationReason }}
          </p>
        </div>
      </div>

      <!-- Therapist info -->
      <div class="card">
        <div class="flex items-center gap-4">
          <SAvatar :src="appt.therapistProfile?.profilePictureUrl"
            :name="`${appt.therapistProfile?.firstName ?? 'T'} ${appt.therapistProfile?.lastName ?? ''}`"
            size="xl" color="bg-clay-500" />
          <div>
            <p class="font-body font-semibold text-[var(--color-text)] text-lg">
              Dr. {{ appt.therapistProfile?.firstName }} {{ appt.therapistProfile?.lastName }}
            </p>
            <p class="font-body text-sm text-[var(--color-text-muted)]">{{ appt.therapistProfile?.qualification }}</p>
            <NuxtLink :to="`/client/therapists/${appt.therapistId}`"
              class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors mt-1 inline-block">
              View profile →
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Session details -->
      <div class="card space-y-4">
        <h3 class="font-display text-lg text-[var(--color-text)]">Session Details</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)] mb-0.5">Date & Time</p>
            <p class="font-body text-sm font-medium text-[var(--color-text)]">
              {{ formatDate(appt.scheduledDateTime, { weekday:'long', month:'long', day:'numeric', year:'numeric' }) }}
            </p>
            <p class="font-body text-sm text-[var(--color-text-muted)]">
              {{ formatTime(appt.scheduledDateTime) }} · {{ appt.durationMinutes }} minutes
            </p>
          </div>
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)] mb-0.5">Format</p>
            <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ appt.sessionFormat }}</p>
            <p v-if="appt.locationName" class="font-body text-sm text-[var(--color-text-muted)]">{{ appt.locationName }}</p>
          </div>
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)] mb-0.5">Session type</p>
            <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ appt.appointmentType }}</p>
          </div>
          <div>
            <p class="font-body text-xs text-[var(--color-text-muted)] mb-0.5">Fee</p>
            <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ formatCurrency(appt.consultationFee) }}</p>
            <p class="font-body text-xs text-[var(--color-text-muted)]">{{ appt.paymentStatus }}</p>
          </div>
        </div>

        <div v-if="appt.appointmentNotes" class="pt-2 border-t border-[var(--color-border)]">
          <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Notes</p>
          <p class="font-body text-sm text-[var(--color-text)]">{{ appt.appointmentNotes }}</p>
        </div>

        <div v-if="appt.isCoveredByMedicalAid" class="flex items-center gap-2 p-3 rounded-lg bg-forest-50 dark:bg-forest-900/20">
          <Icon name="heroicons:shield-check" class="w-4 h-4 text-forest-500" />
          <p class="font-body text-xs text-forest-700 dark:text-forest-300">
            Medical aid claim · Copay: {{ formatCurrency(appt.clientCopay ?? 0) }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <NuxtLink v-if="appt.sessionFormat === 'Online' && appt.status === 'Confirmed'"
          :to="`/client/sessions/${appt.appointmentId}/waiting-room`"
          class="btn-primary flex-1 flex items-center justify-center gap-2">
          <Icon name="heroicons:video-camera" class="w-5 h-5" /> Join Video Session
        </NuxtLink>
        <button v-if="appt.status === 'Completed' && !appt.userRating"
          @click="reviewModal = true"
          class="btn-secondary flex-1 flex items-center justify-center gap-2">
          <Icon name="heroicons:star" class="w-5 h-5" /> Leave a review
        </button>
        <NuxtLink v-if="appt.status === 'Completed'"
          :to="`/client/messages?to=${appt.therapistId}`"
          class="btn-secondary flex items-center justify-center gap-2 px-4">
          <Icon name="heroicons:chat-bubble-left" class="w-5 h-5" />
        </NuxtLink>
      </div>

      <!-- Review already submitted -->
      <div v-if="appt.userRating" class="card">
        <p class="font-body text-sm font-medium text-[var(--color-text)] mb-2">Your review</p>
        <SRating :model-value="appt.userRating" :size="4" show-value />
        <p v-if="appt.userFeedback" class="font-body text-sm text-[var(--color-text-muted)] mt-2">
          {{ appt.userFeedback }}
        </p>
      </div>
    </div>

    <!-- Review Modal -->
    <SModal v-model="reviewModal" title="Rate your session" max-width="max-w-md">
      <div class="space-y-4">
        <div>
          <p class="font-body text-sm text-[var(--color-text-muted)] mb-3">
            How was your session with Dr. {{ appt?.therapistProfile?.lastName }}?
          </p>
          <SRating v-model="reviewForm.rating" :interactive="true" :size="8" />
        </div>
        <div>
          <label class="input-label">Comments (optional)</label>
          <textarea v-model="reviewForm.comment" class="input resize-none" rows="4"
            placeholder="Share your experience..." />
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="reviewForm.isAnonymous" class="rounded accent-forest-500" />
          <span class="font-body text-sm text-[var(--color-text-muted)]">Submit anonymously</span>
        </label>
        <div class="flex gap-3">
          <button @click="reviewModal = false" class="btn-secondary flex-1">Cancel</button>
          <button @click="submitReview" :disabled="submittingRev || !reviewForm.rating" class="btn-primary flex-1">
            <span v-if="submittingRev" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Submitting...
            </span>
            <span v-else>Submit review</span>
          </button>
        </div>
      </div>
    </SModal>
  </div>
</template>
