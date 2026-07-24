<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const api = useApi()

const payments   = ref<any[]>([])
const summary    = ref<any>(null)
const loading    = ref(true)
const page       = ref(1)
const totalPages = ref(1)
const period     = ref<'week'|'month'|'year'>('month')

async function load() {
  loading.value = true
  try {
    const [pmtRes, sumRes] = await Promise.all([
      api.get<any>(`/admin/payments?page=${page.value}&pageSize=20`),
      api.get<any>(`/admin/payments/summary?period=${period.value}`),
    ])
    payments.value   = pmtRes.data?.items ?? []
    totalPages.value = pmtRes.data?.totalPages ?? 1
    summary.value    = sumRes.data
  } finally { loading.value = false }
}

watch([period], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

const statusLabels: Record<number,string> = { 0:'Pending',1:'Completed',2:'Failed',3:'Refunded' }
const statusVariants: Record<number,any>  = { 0:'gray',1:'green',2:'red',3:'clay' }
const typeLabels: Record<number,string>   = { 0:'Session Payment',1:'Medical Aid',2:'Refund',3:'Platform Fee' }
</script>

<template>
  <div class="p-6 lg:p-8 max-w-6xl mx-auto">
    <SPageHeader title="Payments" subtitle="Platform payment overview and revenue tracking" />

    <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit mb-6">
      <button v-for="p in [{key:'week',label:'This week'},{key:'month',label:'This month'},{key:'year',label:'This year'}]"
        :key="p.key" @click="period = p.key as any"
        :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
          period === p.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
        {{ p.label }}
      </button>
    </div>

    <SLoader v-if="loading" label="Loading payment data..." />

    <div v-else class="space-y-6">
      <!-- Summary cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-sm">
          <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Gross Revenue</p>
          <p class="font-display text-2xl text-[var(--color-text)]">{{ formatCurrency(summary?.grossRevenue ?? 0) }}</p>
        </div>
        <div class="card-sm">
          <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Platform Fees</p>
          <p class="font-display text-2xl text-forest-500">{{ formatCurrency(summary?.platformFees ?? 0) }}</p>
        </div>
        <div class="card-sm">
          <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Therapist Payouts</p>
          <p class="font-display text-2xl text-[var(--color-text)]">{{ formatCurrency(summary?.therapistPayouts ?? 0) }}</p>
        </div>
        <div class="card-sm">
          <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Refunds</p>
          <p class="font-display text-2xl text-red-500">{{ formatCurrency(summary?.refunds ?? 0) }}</p>
        </div>
      </div>

      <!-- Payments table -->
      <div class="card overflow-hidden p-0">
        <div class="px-4 py-3 border-b border-[var(--color-border)]">
          <h3 class="font-display text-lg text-[var(--color-text)]">Recent Transactions</h3>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-[var(--color-border)]">
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Date</th>
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Client</th>
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium hidden md:table-cell">Therapist</th>
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Amount</th>
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium hidden lg:table-cell">Fee</th>
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pmt in payments" :key="pmt.paymentId"
              class="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
              <td class="px-4 py-3 font-body text-sm text-[var(--color-text)]">
                {{ formatDate(pmt.paymentDate, { month:'short', day:'numeric' }) }}
              </td>
              <td class="px-4 py-3 font-body text-sm text-[var(--color-text-muted)] hidden sm:table-cell truncate max-w-32">
                {{ pmt.clientName ?? '—' }}
              </td>
              <td class="px-4 py-3 font-body text-sm text-[var(--color-text-muted)] hidden md:table-cell truncate max-w-32">
                {{ pmt.therapistName ?? '—' }}
              </td>
              <td class="px-4 py-3 font-body text-sm font-semibold text-[var(--color-text)]">
                {{ formatCurrency(pmt.amount) }}
              </td>
              <td class="px-4 py-3 font-body text-sm text-forest-500 hidden lg:table-cell">
                {{ formatCurrency(pmt.platformFee) }}
              </td>
              <td class="px-4 py-3">
                <SBadge :variant="statusVariants[pmt.status] ?? 'gray'">
                  {{ statusLabels[pmt.status] ?? 'Unknown' }}
                </SBadge>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!payments.length" class="py-12">
          <SEmpty icon="heroicons:banknotes" title="No transactions" subtitle="" />
        </div>
      </div>

      <SPagination v-model:page="page" :total-pages="totalPages" />
    </div>
  </div>
</template>
