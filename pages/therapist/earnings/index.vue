<script setup lang="ts">
definePageMeta({ layout: 'therapist', middleware: 'auth' })
const earningsApi = useTherapistEarnings()

const summary    = ref<any>(null)
const payments   = ref<any[]>([])
const claims     = ref<any[]>([])
const loading    = ref(true)
const period     = ref<'week'|'month'|'year'>('month')
const activeTab  = ref('overview')
const page       = ref(1)
const totalPages = ref(1)

async function loadSummary() {
  loading.value = true
  try {
    const res = await earningsApi.getEarningsSummary(period.value)
    summary.value = res.data
  } finally { loading.value = false }
}

async function loadPayments() {
  const res = await earningsApi.getPaymentHistory(page.value)
  payments.value   = res.data?.items ?? []
  totalPages.value = res.data?.totalPages ?? 1
}

async function loadClaims() {
  const res = await earningsApi.getMedicalAidClaims()
  claims.value = res.data?.items ?? []
}

watch(period, loadSummary)
watch(activeTab, (tab) => {
  if (tab === 'payments' && !payments.value.length) loadPayments()
  if (tab === 'claims'   && !claims.value.length)   loadClaims()
})
watch(page, loadPayments)
onMounted(loadSummary)

const maxBar = computed(() => {
  if (!summary.value?.byMonth?.length) return 1
  return Math.max(...summary.value.byMonth.map((m: any) => m.amount), 1)
})

const paymentStatusMap: Record<number,{label:string;variant:any}> = {
  0: { label:'Pending',   variant:'gray'  },
  1: { label:'Completed', variant:'green' },
  2: { label:'Failed',    variant:'red'   },
  3: { label:'Refunded',  variant:'clay'  },
}
</script>

<template>
  <div class="p-6 lg:p-8 max-w-5xl mx-auto">
    <SPageHeader title="Earnings" subtitle="Track your income and payments" />

    <!-- Period tabs -->
    <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit mb-6">
      <button v-for="p in [{key:'week',label:'This week'},{key:'month',label:'This month'},{key:'year',label:'This year'}]"
        :key="p.key" @click="period = p.key as any"
        :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
          period === p.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
        {{ p.label }}
      </button>
    </div>

    <SLoader v-if="loading" label="Loading earnings..." />

    <div v-else class="space-y-6">
      <!-- Summary cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-sm">
          <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Total Earned</p>
          <p class="font-display text-2xl text-forest-500">{{ formatCurrency(summary?.total ?? 0) }}</p>
          <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Gross</p>
        </div>
        <div class="card-sm">
          <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Net Payout</p>
          <p class="font-display text-2xl text-[var(--color-text)]">{{ formatCurrency(summary?.netAmount ?? 0) }}</p>
          <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">After platform fee</p>
        </div>
        <div class="card-sm">
          <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Sessions</p>
          <p class="font-display text-2xl text-[var(--color-text)]">{{ summary?.sessionCount ?? 0 }}</p>
          <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Completed</p>
        </div>
        <div class="card-sm">
          <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Avg per Session</p>
          <p class="font-display text-2xl text-[var(--color-text)]">{{ formatCurrency(summary?.avgPerSession ?? 0) }}</p>
          <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Net</p>
        </div>
      </div>

      <!-- Bar chart by month -->
      <div v-if="summary?.byMonth?.length" class="card">
        <h3 class="font-display text-lg text-[var(--color-text)] mb-4">Revenue by Month</h3>
        <div class="flex items-end gap-3 h-32">
          <div v-for="m in summary.byMonth" :key="m.month"
            class="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              :style="{ height: `${(m.amount / maxBar) * 112}px` }"
              class="w-full rounded-t-lg bg-forest-400 hover:bg-forest-500 transition-colors cursor-default">
              <!-- Tooltip -->
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none whitespace-nowrap">
                <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 shadow-elevated text-center">
                  <p class="font-body text-xs font-semibold text-[var(--color-text)]">{{ formatCurrency(m.amount) }}</p>
                  <p class="font-body text-[10px] text-[var(--color-text-muted)]">{{ m.sessions }} sessions</p>
                </div>
              </div>
            </div>
            <p class="font-body text-[10px] text-[var(--color-text-muted)]">{{ m.month }}</p>
          </div>
        </div>
        <!-- Platform fee note -->
        <div class="mt-4 p-3 rounded-xl bg-[var(--color-surface-2)] flex items-center gap-2">
          <Icon name="heroicons:information-circle" class="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
          <p class="font-body text-xs text-[var(--color-text-muted)]">
            Platform fee: {{ formatCurrency(summary?.platformFee ?? 0) }} deducted from gross earnings
          </p>
        </div>
      </div>

      <!-- View tabs -->
      <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit">
        <button v-for="tab in [{key:'overview',label:'Overview'},{key:'payments',label:'Payments'},{key:'claims',label:'Med Aid Claims'}]"
          :key="tab.key" @click="activeTab = tab.key"
          :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
            activeTab === tab.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
          {{ tab.label }}
        </button>
      </div>

      <!-- Payment history -->
      <div v-if="activeTab === 'payments'" class="space-y-3">
        <SLoader v-if="!payments.length && loading" />
        <SEmpty v-else-if="!payments.length" icon="heroicons:banknotes" title="No payments yet" subtitle="" />
        <div v-else>
          <div class="card overflow-hidden p-0">
            <table class="w-full">
              <thead>
                <tr class="border-b border-[var(--color-border)]">
                  <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Date</th>
                  <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Client</th>
                  <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Amount</th>
                  <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Net</th>
                  <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pmt in payments" :key="pmt.paymentId"
                  class="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
                  <td class="px-4 py-3 font-body text-sm text-[var(--color-text)]">
                    {{ formatDate(pmt.paymentDate, { month:'short', day:'numeric', year:'numeric' }) }}
                  </td>
                  <td class="px-4 py-3 font-body text-sm text-[var(--color-text)]">{{ pmt.clientName ?? '—' }}</td>
                  <td class="px-4 py-3 font-body text-sm font-medium text-[var(--color-text)]">{{ formatCurrency(pmt.amount) }}</td>
                  <td class="px-4 py-3 font-body text-sm text-forest-500">{{ formatCurrency(pmt.therapistAmount) }}</td>
                  <td class="px-4 py-3">
                    <SBadge :variant="paymentStatusMap[pmt.status]?.variant ?? 'gray'">
                      {{ paymentStatusMap[pmt.status]?.label ?? pmt.status }}
                    </SBadge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <SPagination v-model:page="page" :total-pages="totalPages" />
        </div>
      </div>

      <!-- Medical aid claims -->
      <div v-else-if="activeTab === 'claims'" class="space-y-3">
        <SLoader v-if="!claims.length && loading" />
        <SEmpty v-else-if="!claims.length" icon="heroicons:shield-check" title="No medical aid claims" subtitle="Claims will appear here when processed" />
        <div v-else class="space-y-3">
          <div v-for="claim in claims" :key="claim.paymentId"
            class="card-sm flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-forest-50 dark:bg-forest-900/40 flex items-center justify-center shrink-0">
              <Icon name="heroicons:shield-check" class="w-5 h-5 text-forest-500" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ claim.clientName }}</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">
                Claim #{{ claim.medicalAidClaimNumber ?? '—' }}
                · Covered: {{ formatCurrency(claim.medicalAidCoveredAmount ?? 0) }}
                · Copay: {{ formatCurrency(claim.clientCopayment ?? 0) }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-body text-sm font-semibold text-[var(--color-text)]">{{ formatCurrency(claim.amount) }}</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">{{ formatDate(claim.paymentDate, { month:'short', day:'numeric' }) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
