<script setup lang="ts">
import { SessionFormat } from '~/types'
definePageMeta({ layout: 'client', middleware: 'auth' })

const route        = useRoute()
const therapistApi = useTherapists()
const apptApi      = useAppointments()
const paymentsApi  = usePayments()
const id           = route.params.id as string

const therapist     = ref<any>(null)
const availability  = ref<any[]>([])
const payMethods    = ref<any[]>([])
const loading       = ref(true)
const error         = ref('')
const activeTab     = ref<'overview' | 'reviews' | 'book'>('overview')

// Booking state
const bookingStep      = ref<1 | 2 | 3>(1)
const selectedDate     = ref('')
const selectedSlot     = ref('')
const availableSlots   = ref<string[]>([])
const loadingSlots     = ref(false)
const bookingFormat    = ref<SessionFormat>(SessionFormat.Online)
const bookingNotes     = ref('')
const selectedPayMethod= ref('')
const bookingLoading   = ref(false)
const bookingSuccess   = ref(false)
const bookingError     = ref('')

// Calendar: build next 14 days
const dateOptions = computed(() => {
  const days = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      value: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' }),
      dayName: d.toLocaleDateString('en-ZA', { weekday: 'short' }),
      dayNum: d.getDate(),
    })
  }
  return days
})

async function load() {
  loading.value = true; error.value = ''
  try {
    const [tRes, aRes, pRes] = await Promise.all([
      therapistApi.getTherapistById(id),
      therapistApi.getTherapistAvailability(id),
      paymentsApi.getPaymentMethods(),
    ])
    therapist.value    = tRes.data
    availability.value = aRes.data
    payMethods.value   = pRes.data
    if (payMethods.value.length) selectedPayMethod.value = payMethods.value.find(p => p.isDefault)?.paymentMethodId ?? payMethods.value[0].paymentMethodId
  } catch (e: any) { error.value = e.message }
  finally { loading.value = false }
}

async function selectDate(date: string) {
  selectedDate.value = date; selectedSlot.value = ''
  loadingSlots.value = true
  try {
    const res = await apptApi.getAvailableSlots(id, date)
    availableSlots.value = res.data ?? []
  } catch { availableSlots.value = [] }
  finally { loadingSlots.value = false }
}

async function confirmBooking() {
  if (!selectedSlot.value || !selectedPayMethod.value) return
  bookingLoading.value = true; bookingError.value = ''
  try {
    await apptApi.bookAppointment({
      therapistId:           id,
      scheduledDateTime:     selectedSlot.value,
      durationMinutes:       60,
      appointmentType:       'Initial Consultation',
      sessionFormat:         bookingFormat.value,
      appointmentNotes:      bookingNotes.value || null,
      paymentMethodId:       selectedPayMethod.value,
      isCoveredByMedicalAid: payMethods.value.find(p => p.paymentMethodId === selectedPayMethod.value)?.type === 2,
    })
    bookingSuccess.value = true
  } catch (e: any) { bookingError.value = e.message }
  finally { bookingLoading.value = false }
}

const dayLabels: Record<number, string> = { 0:'Sun', 1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6:'Sat' }

onMounted(load)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <SPageHeader title="" back="/client/therapists" back-label="Therapists" />

    <SLoader v-if="loading" label="Loading therapist profile..." />
    <SError v-else-if="error" :message="error" :on-retry="load" />

    <div v-else-if="therapist">
      <!-- Hero -->
      <div class="card mb-6">
        <div class="flex flex-col sm:flex-row gap-5">
          <SAvatar :src="therapist.profile?.profilePictureUrl"
            :name="`${therapist.profile?.firstName ?? ''} ${therapist.profile?.lastName ?? ''}`"
            size="xl" color="bg-clay-500" class="mx-auto sm:mx-0" />
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="font-display text-2xl text-[var(--color-text)]">
                Dr. {{ therapist.profile?.firstName }} {{ therapist.profile?.lastName }}
              </h1>
              <Icon v-if="therapist.isHpcsaVerified" name="heroicons:check-badge" class="w-5 h-5 text-forest-500" />
            </div>
            <p class="font-body text-[var(--color-text-muted)]">{{ therapist.qualification }} · {{ therapist.yearsOfExperience }} yrs experience</p>
            <p class="font-body text-sm text-[var(--color-text-muted)]">{{ therapist.city }}, {{ therapist.province }}</p>
            <div class="flex items-center gap-4 mt-3 flex-wrap">
              <SRating :model-value="therapist.averageRating" :size="4" show-value />
              <span class="font-body text-sm font-semibold text-[var(--color-text)]">
                {{ formatCurrency(therapist.consultationFee) }}
                <span class="font-normal text-[var(--color-text-muted)]">/ session</span>
              </span>
              <SBadge v-if="therapist.acceptsMedicalAid" variant="green">Medical aid</SBadge>
              <SBadge :variant="therapist.isAvailable ? 'green' : 'gray'">
                {{ therapist.isAvailable ? 'Available' : 'Unavailable' }}
              </SBadge>
            </div>
          </div>
          <button v-if="therapist.isAvailable"
            @click="activeTab = 'book'"
            class="btn-primary self-start whitespace-nowrap">
            Book session
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit mb-6">
        <button v-for="tab in [{key:'overview',label:'Overview'},{key:'reviews',label:'Reviews'},{key:'book',label:'Book'}]"
          :key="tab.key" @click="activeTab = tab.key as any"
          :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
            activeTab === tab.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
          {{ tab.label }}
        </button>
      </div>

      <!-- Overview tab -->
      <div v-if="activeTab === 'overview'" class="space-y-5">
        <div class="card">
          <h3 class="font-display text-lg text-[var(--color-text)] mb-3">About</h3>
          <p class="font-body text-sm text-[var(--color-text-muted)] leading-relaxed">{{ therapist.bio }}</p>
        </div>
        <div v-if="therapist.profile?.treatmentApproach" class="card">
          <h3 class="font-display text-lg text-[var(--color-text)] mb-3">Treatment Approach</h3>
          <p class="font-body text-sm text-[var(--color-text-muted)] leading-relaxed">{{ therapist.profile.treatmentApproach }}</p>
        </div>
        <div class="grid sm:grid-cols-2 gap-5">
          <div v-if="therapist.specialties?.length" class="card">
            <h3 class="font-display text-lg text-[var(--color-text)] mb-3">Specialties</h3>
            <div class="space-y-2">
              <div v-for="s in therapist.specialties" :key="s.specialtyId" class="flex items-center justify-between">
                <span class="font-body text-sm text-[var(--color-text)]">{{ s.name }}</span>
                <span class="font-body text-xs text-[var(--color-text-muted)]">{{ s.yearsExperience }}y exp</span>
              </div>
            </div>
          </div>
          <div class="card">
            <h3 class="font-display text-lg text-[var(--color-text)] mb-3">Languages</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="l in therapist.languages" :key="l.languageId" class="badge-clay">
                {{ l.languageName }}
                <span v-if="l.proficiency" class="text-[var(--color-text-muted)]">({{ l.proficiency }})</span>
              </span>
            </div>
          </div>
        </div>
        <div v-if="availability.length" class="card">
          <h3 class="font-display text-lg text-[var(--color-text)] mb-3">Weekly Availability</h3>
          <div class="grid grid-cols-7 gap-2">
            <div v-for="avail in availability" :key="avail.availabilityId" class="text-center">
              <p class="font-body text-xs font-medium text-[var(--color-text-muted)] mb-1">{{ dayLabels[avail.dayOfWeek] }}</p>
              <div :class="['rounded-lg py-1 px-1', avail.isAvailable ? 'bg-forest-50 dark:bg-forest-900/30' : 'bg-[var(--color-surface-2)]']">
                <p v-if="avail.isAvailable" class="font-body text-[10px] text-forest-600 dark:text-forest-400">
                  {{ avail.startTime?.slice(0,5) }}–{{ avail.endTime?.slice(0,5) }}
                </p>
                <p v-else class="font-body text-[10px] text-[var(--color-text-muted)]">Off</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Book tab -->
      <div v-else-if="activeTab === 'book'">
        <div v-if="bookingSuccess" class="card text-center py-12">
          <div class="w-16 h-16 rounded-full bg-forest-100 dark:bg-forest-900/40 flex items-center justify-center mx-auto mb-4">
            <Icon name="heroicons:check" class="w-8 h-8 text-forest-500" />
          </div>
          <h3 class="font-display text-2xl text-[var(--color-text)] mb-2">Session booked!</h3>
          <p class="font-body text-[var(--color-text-muted)] mb-6">
            Your appointment with Dr. {{ therapist.profile?.lastName }} is confirmed.
          </p>
          <NuxtLink to="/client/appointments" class="btn-primary inline-flex">View appointments</NuxtLink>
        </div>

        <div v-else class="space-y-5">
          <!-- Step 1: Date -->
          <div class="card">
            <h3 class="font-display text-lg text-[var(--color-text)] mb-4">1. Choose a date</h3>
            <div class="flex gap-2 overflow-x-auto pb-2">
              <button v-for="d in dateOptions" :key="d.value"
                @click="selectDate(d.value)"
                :class="['flex flex-col items-center px-3 py-2 rounded-xl border-2 min-w-[60px] transition-all',
                  selectedDate === d.value
                    ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30'
                    : 'border-[var(--color-border)] hover:border-forest-300']">
                <span class="font-body text-[10px] text-[var(--color-text-muted)]">{{ d.dayName }}</span>
                <span class="font-body font-semibold text-[var(--color-text)]">{{ d.dayNum }}</span>
              </button>
            </div>
          </div>

          <!-- Step 2: Time slot -->
          <div v-if="selectedDate" class="card">
            <h3 class="font-display text-lg text-[var(--color-text)] mb-4">2. Choose a time</h3>
            <SLoader v-if="loadingSlots" label="Loading available slots..." />
            <SEmpty v-else-if="!availableSlots.length" icon="heroicons:clock" title="No slots available" subtitle="Please select another date" />
            <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button v-for="slot in availableSlots" :key="slot"
                @click="selectedSlot = slot"
                :class="['py-2 px-3 rounded-xl border-2 font-body text-sm transition-all',
                  selectedSlot === slot
                    ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300'
                    : 'border-[var(--color-border)] hover:border-forest-300 text-[var(--color-text)]']">
                {{ formatTime(slot) }}
              </button>
            </div>
          </div>

          <!-- Step 3: Details -->
          <div v-if="selectedSlot" class="card space-y-4">
            <h3 class="font-display text-lg text-[var(--color-text)]">3. Session details</h3>
            <div>
              <label class="input-label">Session format</label>
              <div class="flex gap-3">
                <button v-for="f in [{v:'Online',icon:'heroicons:video-camera'},{v:'InPerson',icon:'heroicons:building-office'},{v:'Phone',icon:'heroicons:phone'}]"
                  :key="f.v" @click="bookingFormat = f.v as SessionFormat"
                  :class="['flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-body text-sm transition-all',
                    bookingFormat === f.v
                      ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300'
                      : 'border-[var(--color-border)] hover:border-forest-300 text-[var(--color-text-muted)]']">
                  <Icon :name="f.icon" class="w-4 h-4" /> {{ f.v === 'InPerson' ? 'In-Person' : f.v }}
                </button>
              </div>
            </div>
            <div v-if="payMethods.length">
              <label class="input-label">Payment method</label>
              <select v-model="selectedPayMethod" class="input">
                <option v-for="pm in payMethods" :key="pm.paymentMethodId" :value="pm.paymentMethodId">
                  {{ pm.name }}
                  {{ pm.cardLastFour ? `ending ${pm.cardLastFour}` : '' }}
                  {{ pm.isDefault ? '(default)' : '' }}
                </option>
              </select>
            </div>
            <div>
              <label class="input-label">Notes for therapist (optional)</label>
              <textarea v-model="bookingNotes" class="input resize-none" rows="3"
                placeholder="Anything you'd like to share before the session..." />
            </div>

            <!-- Summary -->
            <div class="p-4 rounded-xl bg-[var(--color-surface-2)] space-y-2">
              <div class="flex justify-between">
                <span class="font-body text-sm text-[var(--color-text-muted)]">Date & time</span>
                <span class="font-body text-sm text-[var(--color-text)]">
                  {{ formatDate(selectedSlot, { weekday:'short', month:'short', day:'numeric' }) }}
                  · {{ formatTime(selectedSlot) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="font-body text-sm text-[var(--color-text-muted)]">Duration</span>
                <span class="font-body text-sm text-[var(--color-text)]">60 minutes</span>
              </div>
              <div class="flex justify-between border-t border-[var(--color-border)] pt-2 mt-2">
                <span class="font-body text-sm font-semibold text-[var(--color-text)]">Total</span>
                <span class="font-body text-sm font-semibold text-[var(--color-text)]">
                  {{ formatCurrency(therapist.consultationFee) }}
                </span>
              </div>
            </div>

            <SError v-if="bookingError" :message="bookingError" />
            <button @click="confirmBooking" :disabled="bookingLoading || !selectedPayMethod" class="btn-primary w-full">
              <span v-if="bookingLoading" class="flex items-center justify-center gap-2">
                <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Booking...
              </span>
              <span v-else>Confirm booking · {{ formatCurrency(therapist.consultationFee) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
