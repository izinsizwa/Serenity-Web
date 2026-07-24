<script setup lang="ts">
const medicalAidApi = useMedicalAid()

const claims     = ref<any[]>([])
const loading    = ref(true)
const page       = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const statusFilter = ref<number | null>(null)
const submitModal  = ref(false)
const submitTarget = ref<any>(null)
const submitting   = ref(false)
const submitError  = ref('')

// Load unpaid appointments that can be claimed
const unclaimedPayments = ref<any[]>([])
const loadingUnclaimed  = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await medicalAidApi.getMyClaims(page.value, 10, statusFilter.value ?? undefined)
    claims.value     = res.data?.items ?? []
    totalPages.value = res.data?.totalPages ?? 1
    totalCount.value = res.data?.totalCount ?? 0
  } finally { loading.value = false }
}

async function loadUnclaimed() {
  loadingUnclaimed.value = true
  try {
    const api = useApi()
    const res = await api.get<any[]>('/clients/me/payments/unclaimed')
    unclaimedPayments.value = res.data ?? []
  } finally { loadingUnclaimed.value = false }
}

async function openSubmitModal() {
  submitModal.value = true
  await loadUnclaimed()
}

async function submitClaim(paymentId: string) {
  submitting.value = true; submitError.value = ''
  try {
    await medicalAidApi.submitClaim(paymentId)
    submitModal.value = false
    unclaimedPayments.value = unclaimedPayments.value.filter(p => p.paymentId !== paymentId)
    load()
  } catch (e: any) { submitError.value = e.message }
  finally { submitting.value = false }
}

watch([statusFilter], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

const statusConfig: Record<number, { label: string; variant: any; icon: string; description: string }> = {
  0: { label: 'Submitted',   variant: 'terra', icon: 'heroicons:paper-airplane',    description: 'Sent to your scheme' },
  1: { label: 'Processing',  variant: 'clay',  icon: 'heroicons:arrow-path',         description: 'Your scheme is reviewing' },
  2: { label: 'Approved',    variant: 'green', icon: 'heroicons:check-circle',       description: 'Approved for payment' },
  3: { label: 'Rejected',    variant: 'red',   icon: 'heroicons:x-circle',           description: 'Not covered by your plan' },
  4: { label: 'Paid',        variant: 'green', icon: 'heroicons:banknotes',          description: 'Payment received' },
}
</script>

<template>
  <div class="space-y-5">
    <!-- Summary + new claim button -->
    <div class="flex items-center justify-between">
      <p class="font-body text-sm text-[var(--color-text-muted)]">{{ totalCount }} claim{{ totalCount !== 1 ? 's' : '' }} total</p>
      <button @click="openSubmitModal" class="btn-primary text-sm flex items-center gap-2">
        <Icon name="heroicons:plus" class="w-4 h-4" /> Submit a claim
      </button>
    </div>

    <!-- Status filter pills -->
    <div class="flex gap-2 flex-wrap">
      <button @click="statusFilter = null"
        :class="['px-3 py-1.5 rounded-full font-body text-xs border transition-all',
          statusFilter === null
            ? 'bg-forest-500 text-white border-forest-500'
            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-forest-400']">
        All
      </button>
      <button v-for="(config, status) in statusConfig" :key="status"
        @click="statusFilter = Number(status)"
        :class="['px-3 py-1.5 rounded-full font-body text-xs border transition-all',
          statusFilter === Number(status)
            ? 'bg-forest-500 text-white border-forest-500'
            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-forest-400']">
        {{ config.label }}
      </button>
    </div>

    <SLoader v-if="loading" label="Loading claims..." />
    <SEmpty v-else-if="!claims.length"
      icon="heroicons:shield-check"
      title="No claims yet"
      subtitle="Submit a claim after a session to get reimbursed by your medical aid" />

    <div v-else class="space-y-4">
      <div v-for="claim in claims" :key="claim.claimId"
        class="card hover:shadow-elevated transition-shadow">
        <div class="flex items-start gap-4">
          <!-- Status icon -->
          <div :class="['w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            claim.status === 4 || claim.status === 2 ? 'bg-forest-100 dark:bg-forest-900/40' :
            claim.status === 3 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-[var(--color-surface-2)]']">
            <Icon :name="statusConfig[claim.status]?.icon ?? 'heroicons:shield'"
              :class="['w-6 h-6',
                claim.status === 4 || claim.status === 2 ? 'text-forest-500' :
                claim.status === 3 ? 'text-red-500' :
                claim.status === 1 ? 'text-clay-500 animate-spin' : 'text-terra-400']" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p class="font-body font-semibold text-[var(--color-text)]">
                  {{ claim.providerName }}
                  <span v-if="claim.claimNumber" class="font-normal text-[var(--color-text-muted)]">
                    · #{{ claim.claimNumber }}
                  </span>
                </p>
                <p class="font-body text-sm text-[var(--color-text-muted)]">
                  {{ claim.therapistName ? `Dr. ${claim.therapistName}` : 'Session' }}
                  <span v-if="claim.sessionDate">
                    · {{ formatDate(claim.sessionDate, { month:'short', day:'numeric', year:'numeric' }) }}
                  </span>
                </p>
              </div>
              <SBadge :variant="statusConfig[claim.status]?.variant ?? 'gray'">
                {{ statusConfig[claim.status]?.label ?? 'Unknown' }}
              </SBadge>
            </div>

            <!-- Amount breakdown -->
            <div class="grid grid-cols-3 gap-3 mt-3">
              <div class="p-2.5 rounded-xl bg-[var(--color-surface-2)]">
                <p class="font-body text-[10px] text-[var(--color-text-muted)]">Session cost</p>
                <p class="font-body text-sm font-semibold text-[var(--color-text)]">{{ formatCurrency(claim.amount) }}</p>
              </div>
              <div class="p-2.5 rounded-xl" :class="claim.coveredAmount ? 'bg-forest-50 dark:bg-forest-900/20' : 'bg-[var(--color-surface-2)]'">
                <p class="font-body text-[10px] text-[var(--color-text-muted)]">Scheme pays</p>
                <p class="font-body text-sm font-semibold" :class="claim.coveredAmount ? 'text-forest-600 dark:text-forest-400' : 'text-[var(--color-text-muted)]'">
                  {{ claim.coveredAmount != null ? formatCurrency(claim.coveredAmount) : 'Pending' }}
                </p>
              </div>
              <div class="p-2.5 rounded-xl bg-[var(--color-surface-2)]">
                <p class="font-body text-[10px] text-[var(--color-text-muted)]">Your copay</p>
                <p class="font-body text-sm font-semibold text-[var(--color-text)]">
                  {{ claim.copayAmount != null ? formatCurrency(claim.copayAmount) : 'Pending' }}
                </p>
              </div>
            </div>

            <!-- Status description / rejection reason -->
            <div class="mt-3 flex items-start gap-2">
              <p class="font-body text-xs text-[var(--color-text-muted)]">
                {{ statusConfig[claim.status]?.description }}
                <span v-if="claim.processedAt">
                  · {{ formatDate(claim.processedAt, { month:'short', day:'numeric' }) }}
                </span>
              </p>
            </div>

            <div v-if="claim.status === 3 && claim.rejectionReason"
              class="mt-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p class="font-body text-xs font-medium text-red-700 dark:text-red-400 mb-0.5">Rejection reason</p>
              <p class="font-body text-xs text-red-600 dark:text-red-500">{{ claim.rejectionReason }}</p>
            </div>

            <!-- Timeline dots -->
            <div class="flex items-center gap-1 mt-3">
              <div v-for="s in [0,1,2,4]" :key="s"
                :class="['h-1.5 flex-1 rounded-full transition-all',
                  claim.status >= s && claim.status !== 3
                    ? 'bg-forest-400'
                    : claim.status === 3 && s <= 1
                      ? 'bg-red-400'
                      : 'bg-[var(--color-border)]']" />
            </div>
            <div class="flex justify-between mt-1">
              <span class="font-body text-[9px] text-[var(--color-text-muted)]">Submitted</span>
              <span class="font-body text-[9px] text-[var(--color-text-muted)]">Processing</span>
              <span class="font-body text-[9px] text-[var(--color-text-muted)]">Approved</span>
              <span class="font-body text-[9px] text-[var(--color-text-muted)]">Paid</span>
            </div>
          </div>
        </div>
      </div>

      <SPagination v-model:page="page" :total-pages="totalPages" />
    </div>

    <!-- Submit claim modal -->
    <SModal v-model="submitModal" title="Submit a Medical Aid Claim" max-width="max-w-lg">
      <div class="space-y-4">
        <p class="font-body text-sm text-[var(--color-text-muted)]">
          Select a recent session to submit to your medical aid scheme. Claims must be submitted within 4 months of the session date.
        </p>

        <SLoader v-if="loadingUnclaimed" label="Loading eligible sessions..." />
        <SEmpty v-else-if="!unclaimedPayments.length"
          icon="heroicons:check-circle"
          title="All sessions claimed"
          subtitle="No eligible sessions to submit" />

        <div v-else class="space-y-3 max-h-80 overflow-y-auto">
          <div v-for="pmt in unclaimedPayments" :key="pmt.paymentId"
            class="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:border-forest-300 transition-colors">
            <div class="flex-1 min-w-0">
              <p class="font-body text-sm font-medium text-[var(--color-text)]">
                {{ pmt.therapistName ? `Dr. ${pmt.therapistName}` : 'Session' }}
              </p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">
                {{ formatDate(pmt.paymentDate, { weekday:'short', month:'short', day:'numeric', year:'numeric' }) }}
                · {{ formatCurrency(pmt.amount) }}
              </p>
            </div>
            <button @click="submitClaim(pmt.paymentId)" :disabled="submitting"
              class="btn-primary text-xs py-1.5 px-3 shrink-0">
              <span v-if="submitting" class="flex items-center gap-1">
                <Icon name="heroicons:arrow-path" class="w-3.5 h-3.5 animate-spin" />
              </span>
              <span v-else>Submit</span>
            </button>
          </div>
        </div>

        <SError v-if="submitError" :message="submitError" />

        <div class="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
          <Icon name="heroicons:information-circle" class="w-4 h-4 text-forest-400 shrink-0 mt-0.5" />
          <p class="font-body text-xs text-[var(--color-text-muted)]">
            Claims are submitted electronically using your therapist's practice number and ICD-10 diagnostic codes. Processing typically takes 3–10 business days.
          </p>
        </div>
      </div>
    </SModal>
  </div>
</template>
