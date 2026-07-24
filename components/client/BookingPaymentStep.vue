<script setup lang="ts">
const props = defineProps<{
  therapistId:    string
  consultationFee: number
}>()

const emit = defineEmits(['update:paymentMethodId', 'update:isCoveredByMedicalAid', 'update:medicalAidProviderId'])

const paymentsApi   = usePayments()
const medicalAidApi = useMedicalAid()

const payMethods    = ref<any[]>([])
const medicalAid    = ref<any>(null)
const coverage      = ref<any>(null)
const loading       = ref(true)
const checkingCov   = ref(false)
const selectedId    = ref('')
const selectedType  = ref<'card' | 'medical_aid' | 'eft'>('card')

async function load() {
  loading.value = true
  try {
    const [pmRes, maRes] = await Promise.all([
      paymentsApi.getPaymentMethods(),
      medicalAidApi.getMyMedicalAid(),
    ])
    payMethods.value = pmRes.data ?? []
    medicalAid.value = maRes.data

    // Pre-select default
    const defaultMethod = payMethods.value.find(p => p.isDefault) ?? payMethods.value[0]
    if (defaultMethod) selectMethod(defaultMethod)
  } finally { loading.value = false }
}

async function selectMethod(method: any) {
  selectedId.value = method.paymentMethodId
  const isMedAid   = method.type === 2

  emit('update:paymentMethodId', method.paymentMethodId)
  emit('update:isCoveredByMedicalAid', isMedAid)
  emit('update:medicalAidProviderId', isMedAid ? method.medicalAidProviderId : null)

  if (isMedAid && !coverage.value) {
    checkingCov.value = true
    try {
      const res = await medicalAidApi.checkCoverage(props.therapistId)
      coverage.value = res.data
    } catch { coverage.value = null }
    finally { checkingCov.value = false }
  }
}

const selectedMethod = computed(() => payMethods.value.find(p => p.paymentMethodId === selectedId.value))
const isMedicalAid   = computed(() => selectedMethod.value?.type === 2)

const payTypeIcon: Record<number, string> = {
  0: 'heroicons:credit-card',
  1: 'heroicons:building-library',
  2: 'heroicons:shield-check',
}

const estimatedCopay = computed(() => {
  if (!isMedicalAid.value || !coverage.value) return null
  if (coverage.value.copayAmount != null) return coverage.value.copayAmount
  if (coverage.value.coverageAmount != null) return props.consultationFee - coverage.value.coverageAmount
  return null
})

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <SLoader v-if="loading" label="Loading payment methods..." />

    <div v-else>
      <div v-if="!payMethods.length" class="space-y-3">
        <SEmpty icon="heroicons:credit-card" title="No payment methods"
          subtitle="Add a payment method to complete your booking" />
        <NuxtLink to="/client/profile?tab=payments" class="btn-secondary w-full text-center text-sm">
          Add payment method
        </NuxtLink>
      </div>

      <div v-else class="space-y-3">
        <div v-for="method in payMethods" :key="method.paymentMethodId"
          @click="selectMethod(method)"
          :class="['flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
            selectedId === method.paymentMethodId
              ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/20'
              : 'border-[var(--color-border)] hover:border-forest-300']">
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            selectedId === method.paymentMethodId ? 'bg-forest-100 dark:bg-forest-900/40' : 'bg-[var(--color-surface-2)]']">
            <Icon :name="payTypeIcon[method.type] ?? 'heroicons:credit-card'"
              :class="['w-5 h-5', selectedId === method.paymentMethodId ? 'text-forest-500' : 'text-[var(--color-text-muted)]']" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-body font-medium text-sm text-[var(--color-text)]">{{ method.name }}</p>
            <p class="font-body text-xs text-[var(--color-text-muted)]">
              <template v-if="method.type === 0 && method.cardLastFour">
                {{ method.cardBrand }} ending ···· {{ method.cardLastFour }}
                · Exp {{ method.cardExpiryMonth }}/{{ method.cardExpiryYear }}
              </template>
              <template v-else-if="method.type === 2">
                {{ method.medicalAidPlan ?? 'Medical Aid' }}
                <span v-if="method.medicalAidNumber">· {{ method.medicalAidNumber }}</span>
              </template>
              <template v-else-if="method.type === 1 && method.bankName">
                {{ method.bankName }} · {{ method.accountHolderName }}
              </template>
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <SBadge v-if="method.isDefault" variant="green">Default</SBadge>
            <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
              selectedId === method.paymentMethodId ? 'border-forest-500 bg-forest-500' : 'border-[var(--color-border)]']">
              <Icon v-if="selectedId === method.paymentMethodId" name="heroicons:check" class="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        <!-- Medical aid coverage info -->
        <div v-if="isMedicalAid">
          <div v-if="checkingCov" class="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface-2)]">
            <Icon name="heroicons:arrow-path" class="w-4 h-4 text-[var(--color-text-muted)] animate-spin" />
            <p class="font-body text-xs text-[var(--color-text-muted)]">Checking your coverage...</p>
          </div>
          <div v-else-if="coverage">
            <div v-if="coverage.isCovered"
              class="p-4 rounded-xl bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800 space-y-2">
              <div class="flex items-center gap-2">
                <Icon name="heroicons:check-circle" class="w-4 h-4 text-forest-500" />
                <p class="font-body text-sm font-medium text-forest-700 dark:text-forest-300">
                  Covered by your medical aid
                </p>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p class="font-body text-[var(--color-text-muted)]">Scheme pays</p>
                  <p class="font-body font-semibold text-forest-600 dark:text-forest-400">
                    {{ coverage.coverageAmount != null ? formatCurrency(coverage.coverageAmount) : 'Varies' }}
                  </p>
                </div>
                <div>
                  <p class="font-body text-[var(--color-text-muted)]">Your copay</p>
                  <p class="font-body font-semibold text-[var(--color-text)]">
                    {{ estimatedCopay != null ? formatCurrency(estimatedCopay) : 'Varies' }}
                  </p>
                </div>
              </div>
              <p v-if="coverage.notes" class="font-body text-xs text-[var(--color-text-muted)]">
                {{ coverage.notes }}
              </p>
            </div>
            <div v-else
              class="flex items-start gap-2 p-3 rounded-xl bg-terra-400/10 border border-terra-400/30">
              <Icon name="heroicons:exclamation-circle" class="w-4 h-4 text-terra-500 shrink-0 mt-0.5" />
              <div>
                <p class="font-body text-xs font-medium text-[var(--color-text)]">Coverage not confirmed</p>
                <p class="font-body text-xs text-[var(--color-text-muted)]">
                  We couldn't confirm coverage for this therapist. You may need to pay out of pocket and claim manually.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Out of pocket notice -->
        <div v-if="!isMedicalAid"
          class="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface-2)]">
          <Icon name="heroicons:information-circle" class="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
          <p class="font-body text-xs text-[var(--color-text-muted)]">
            You'll be charged {{ formatCurrency(consultationFee) }} at time of booking.
            Have medical aid? <NuxtLink to="/client/medical-aid" class="text-forest-500 hover:underline">Link it here.</NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
