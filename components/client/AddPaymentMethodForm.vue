<script setup lang="ts">
const emit = defineEmits(['saved', 'cancel'])
const paymentsApi   = usePayments()
const medicalAidApi = useMedicalAid()

const type      = ref<'card' | 'eft' | 'medical_aid'>('card')
const providers  = ref<any[]>([])
const saving     = ref(false)
const error      = ref('')
const loadingProv= ref(false)

const cardForm = reactive({
  name: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '', isDefault: false,
})
const eftForm = reactive({
  name: '', bankName: '', accountHolderName: '', accountType: 'Cheque', isDefault: false,
})
const medAidForm = reactive({
  name: '', medicalAidProviderId: '', medicalAidNumber: '', medicalAidPlan: '', isDefault: false,
})

const banks = ['ABSA','FNB','Nedbank','Standard Bank','Capitec','Discovery Bank','Investec','African Bank','TymeBank','Bank Zero']
const paymentTypeMap = { card: 0, eft: 1, medical_aid: 2 }

async function loadProviders() {
  loadingProv.value = true
  try {
    const res = await medicalAidApi.getProviders()
    providers.value = res.data ?? []
  } finally { loadingProv.value = false }
}

async function save() {
  saving.value = true; error.value = ''
  try {
    let data: any = { type: paymentTypeMap[type.value], isActive: true }

    if (type.value === 'card') {
      if (!cardForm.name || !cardForm.cardNumber || !cardForm.expiryMonth || !cardForm.expiryYear) {
        error.value = 'Please fill in all card details'; saving.value = false; return
      }
      data = { ...data, name: cardForm.name, isDefault: cardForm.isDefault,
        cardLastFour: cardForm.cardNumber.slice(-4),
        cardBrand: detectCardBrand(cardForm.cardNumber),
        cardExpiryMonth: cardForm.expiryMonth,
        cardExpiryYear: cardForm.expiryYear,
        encryptedCardNumber: cardForm.cardNumber, // backend should encrypt
      }
    } else if (type.value === 'eft') {
      if (!eftForm.bankName || !eftForm.accountHolderName) {
        error.value = 'Please fill in all EFT details'; saving.value = false; return
      }
      data = { ...data, name: eftForm.name || `${eftForm.bankName} EFT`,
        bankName: eftForm.bankName, accountHolderName: eftForm.accountHolderName,
        accountType: eftForm.accountType, isDefault: eftForm.isDefault,
      }
    } else {
      if (!medAidForm.medicalAidProviderId || !medAidForm.medicalAidNumber) {
        error.value = 'Please fill in medical aid details'; saving.value = false; return
      }
      const prov = providers.value.find(p => p.providerId === medAidForm.medicalAidProviderId)
      data = { ...data, name: medAidForm.name || (prov?.name ?? 'Medical Aid'),
        medicalAidProviderId: medAidForm.medicalAidProviderId,
        medicalAidNumber: medAidForm.medicalAidNumber,
        medicalAidPlan: medAidForm.medicalAidPlan,
        isDefault: medAidForm.isDefault,
      }
    }

    await paymentsApi.addPaymentMethod(data)
    emit('saved')
  } catch (e: any) { error.value = e.message }
  finally { saving.value = false }
}

function detectCardBrand(num: string): string {
  if (/^4/.test(num))   return 'Visa'
  if (/^5[1-5]/.test(num)) return 'Mastercard'
  if (/^3[47]/.test(num))  return 'Amex'
  return 'Card'
}

watch(type, (t) => { if (t === 'medical_aid' && !providers.value.length) loadProviders() })
</script>

<template>
  <div class="space-y-5">
    <!-- Type selector -->
    <div>
      <label class="input-label">Payment type</label>
      <div class="grid grid-cols-3 gap-3">
        <button v-for="t in [
          { key:'card', icon:'heroicons:credit-card', label:'Card' },
          { key:'eft', icon:'heroicons:building-library', label:'EFT / Bank' },
          { key:'medical_aid', icon:'heroicons:shield-check', label:'Medical Aid' },
        ]" :key="t.key" @click="type = t.key as any"
          :class="['flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
            type === t.key
              ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/20'
              : 'border-[var(--color-border)] hover:border-forest-300']">
          <Icon :name="t.icon" :class="['w-6 h-6', type === t.key ? 'text-forest-500' : 'text-[var(--color-text-muted)]']" />
          <span class="font-body text-xs font-medium text-[var(--color-text)]">{{ t.label }}</span>
        </button>
      </div>
    </div>

    <!-- Card form -->
    <div v-if="type === 'card'" class="space-y-4">
      <div>
        <label class="input-label">Card nickname</label>
        <input v-model="cardForm.name" type="text" class="input" placeholder="e.g. My Visa Card" />
      </div>
      <div>
        <label class="input-label">Card number <span class="text-red-400">*</span></label>
        <input v-model="cardForm.cardNumber" type="text" class="input" placeholder="•••• •••• •••• ••••"
          maxlength="19" @input="cardForm.cardNumber = cardForm.cardNumber.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim()" />
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div>
          <label class="input-label">Month <span class="text-red-400">*</span></label>
          <select v-model="cardForm.expiryMonth" class="input">
            <option value="">MM</option>
            <option v-for="m in 12" :key="m" :value="String(m).padStart(2,'0')">{{ String(m).padStart(2,'0') }}</option>
          </select>
        </div>
        <div>
          <label class="input-label">Year <span class="text-red-400">*</span></label>
          <select v-model="cardForm.expiryYear" class="input">
            <option value="">YY</option>
            <option v-for="y in 10" :key="y" :value="String(new Date().getFullYear() + y - 1).slice(-2)">
              {{ String(new Date().getFullYear() + y - 1).slice(-2) }}
            </option>
          </select>
        </div>
        <div>
          <label class="input-label">CVV <span class="text-red-400">*</span></label>
          <input v-model="cardForm.cvv" type="password" class="input" placeholder="•••" maxlength="4" />
        </div>
      </div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="cardForm.isDefault" class="rounded accent-forest-500" />
        <span class="font-body text-sm text-[var(--color-text)]">Set as default payment method</span>
      </label>
    </div>

    <!-- EFT form -->
    <div v-else-if="type === 'eft'" class="space-y-4">
      <div>
        <label class="input-label">Bank <span class="text-red-400">*</span></label>
        <select v-model="eftForm.bankName" class="input">
          <option value="">Select your bank</option>
          <option v-for="b in banks" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>
      <div>
        <label class="input-label">Account holder name <span class="text-red-400">*</span></label>
        <input v-model="eftForm.accountHolderName" type="text" class="input" placeholder="Full name as on account" />
      </div>
      <div>
        <label class="input-label">Account type</label>
        <div class="flex gap-3">
          <button v-for="t in ['Cheque','Savings','Transmission']" :key="t"
            @click="eftForm.accountType = t"
            :class="['px-4 py-2 rounded-xl border-2 font-body text-sm transition-all',
              eftForm.accountType === t
                ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/20 text-forest-700 dark:text-forest-300'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-forest-300']">
            {{ t }}
          </button>
        </div>
      </div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="eftForm.isDefault" class="rounded accent-forest-500" />
        <span class="font-body text-sm text-[var(--color-text)]">Set as default</span>
      </label>
    </div>

    <!-- Medical Aid form -->
    <div v-else-if="type === 'medical_aid'" class="space-y-4">
      <SLoader v-if="loadingProv" label="Loading schemes..." />
      <div v-else>
        <label class="input-label">Medical aid scheme <span class="text-red-400">*</span></label>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="p in providers" :key="p.providerId"
            @click="medAidForm.medicalAidProviderId = p.providerId"
            :class="['flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all',
              medAidForm.medicalAidProviderId === p.providerId
                ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/20'
                : 'border-[var(--color-border)] hover:border-forest-300']">
            <Icon name="heroicons:shield-check"
              :class="['w-4 h-4 shrink-0', medAidForm.medicalAidProviderId === p.providerId ? 'text-forest-500' : 'text-[var(--color-text-muted)]']" />
            <span class="font-body text-sm text-[var(--color-text)] truncate">{{ p.name }}</span>
          </button>
        </div>
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="input-label">Membership number <span class="text-red-400">*</span></label>
          <input v-model="medAidForm.medicalAidNumber" type="text" class="input" placeholder="e.g. 123456789" />
        </div>
        <div>
          <label class="input-label">Plan / Option</label>
          <input v-model="medAidForm.medicalAidPlan" type="text" class="input" placeholder="e.g. Classic Delta" />
        </div>
      </div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="medAidForm.isDefault" class="rounded accent-forest-500" />
        <span class="font-body text-sm text-[var(--color-text)]">Set as default payment method</span>
      </label>
    </div>

    <SError v-if="error" :message="error" />

    <div class="flex gap-3 pt-2">
      <button @click="$emit('cancel')" class="btn-secondary flex-1">Cancel</button>
      <button @click="save" :disabled="saving" class="btn-primary flex-1">
        <span v-if="saving" class="flex items-center justify-center gap-2">
          <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Saving...
        </span>
        <span v-else>Add payment method</span>
      </button>
    </div>
  </div>
</template>
