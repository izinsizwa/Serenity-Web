<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const medicalAidApi = useMedicalAid()

const details    = ref<any>(null)
const providers  = ref<any[]>([])
const loading    = ref(true)
const saving     = ref(false)
const verifying  = ref(false)
const saveSuccess= ref(false)
const saveError  = ref('')
const verifyResult = ref<any>(null)
const activeTab  = ref('details')

const form = reactive({
  providerId:       '',
  membershipNumber: '',
  planName:         '',
  dependantCode:    '',
  mainMemberName:   '',
})

async function load() {
  loading.value = true
  try {
    const [detailRes, provRes] = await Promise.all([
      medicalAidApi.getMyMedicalAid(),
      medicalAidApi.getProviders(),
    ])
    providers.value = provRes.data ?? []
    details.value   = detailRes.data

    if (detailRes.data) {
      Object.assign(form, {
        providerId:       detailRes.data.providerId ?? '',
        membershipNumber: detailRes.data.membershipNumber ?? '',
        planName:         detailRes.data.planName ?? '',
        dependantCode:    detailRes.data.dependantCode ?? '',
        mainMemberName:   detailRes.data.mainMemberName ?? '',
      })
    }
  } finally { loading.value = false }
}

async function save() {
  if (!form.providerId || !form.membershipNumber || !form.planName) {
    saveError.value = 'Provider, membership number and plan name are required'
    return
  }
  saving.value = true; saveError.value = ''; saveSuccess.value = false
  try {
    const res = await medicalAidApi.updateMyMedicalAid(form)
    details.value    = res.data
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) { saveError.value = e.message }
  finally { saving.value = false }
}

async function verify() {
  verifying.value = true; verifyResult.value = null
  try {
    const res = await medicalAidApi.verifyMedicalAid()
    verifyResult.value = res.data
    if (res.data.verified) load()
  } catch (e: any) { verifyResult.value = { verified: false, message: e.message } }
  finally { verifying.value = false }
}

const selectedProvider = computed(() =>
  providers.value.find(p => p.providerId === form.providerId)
)

// Common SA medical aid plans per provider (static reference data)
const commonPlans: Record<string, string[]> = {
  'Discovery': ['KeyCare Core','KeyCare Plus','Essential','Classic','Classic Delta','Executive','Priority','Smart','Coastal Core'],
  'Momentum': ['Ingwe','Evolve','Incentive','Custom','Summit','Extravaganza'],
  'Bonitas': ['BonStart','BonEssential','BonSave','BonClassic','BonComplete','BonComprehensive'],
  'Medihelp': ['Dimension','Prime','Necesse','Dimension Plus'],
  'Bestmed': ['Beat 1','Beat 2','Beat 3','Beat 4','Pulse 1','Pulse 2'],
  'Fedhealth': ['myFED','flexiFED 1','flexiFED 2','flexiFED 3','flexiFED 4'],
}

const planSuggestions = computed(() => {
  if (!selectedProvider.value) return []
  return commonPlans[selectedProvider.value.name] ?? []
})

onMounted(load)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-3xl mx-auto">
    <SPageHeader
      title="Medical Aid"
      subtitle="Manage your medical aid details and track claims"
    />

    <SLoader v-if="loading" label="Loading medical aid details..." />

    <div v-else class="space-y-6">

      <!-- Status card -->
      <div :class="['flex items-center gap-4 p-5 rounded-2xl border-2',
        details?.isVerified
          ? 'bg-forest-50 dark:bg-forest-900/20 border-forest-300 dark:border-forest-700'
          : details?.membershipNumber
            ? 'bg-terra-400/5 border-terra-400/30'
            : 'bg-[var(--color-surface-2)] border-[var(--color-border)]']">
        <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
          details?.isVerified ? 'bg-forest-100 dark:bg-forest-900/40' : 'bg-[var(--color-surface)]']">
          <Icon
            :name="details?.isVerified ? 'heroicons:shield-check' : details?.membershipNumber ? 'heroicons:shield-exclamation' : 'heroicons:shield'"
            :class="['w-7 h-7', details?.isVerified ? 'text-forest-500' : details?.membershipNumber ? 'text-terra-400' : 'text-[var(--color-text-muted)]']"
          />
        </div>
        <div class="flex-1">
          <p class="font-body font-semibold text-[var(--color-text)]">
            {{ details?.isVerified ? 'Medical aid verified' : details?.membershipNumber ? 'Verification pending' : 'No medical aid linked' }}
          </p>
          <p class="font-body text-sm text-[var(--color-text-muted)] mt-0.5">
            {{ details?.isVerified
              ? `${details.providerName} · ${details.planName} · ${details.membershipNumber}`
              : details?.membershipNumber
                ? 'Your details are being verified with your scheme'
                : 'Link your medical aid to cover therapy sessions' }}
          </p>
        </div>
        <button v-if="details?.membershipNumber && !details?.isVerified"
          @click="verify" :disabled="verifying"
          class="btn-secondary text-sm shrink-0">
          <span v-if="verifying" class="flex items-center gap-2">
            <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Verifying...
          </span>
          <span v-else>Verify now</span>
        </button>
      </div>

      <!-- Verify result -->
      <div v-if="verifyResult"
        :class="['flex items-center gap-3 p-4 rounded-xl border',
          verifyResult.verified
            ? 'bg-forest-50 dark:bg-forest-900/20 border-forest-300 dark:border-forest-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800']">
        <Icon :name="verifyResult.verified ? 'heroicons:check-circle' : 'heroicons:x-circle'"
          :class="['w-5 h-5 shrink-0', verifyResult.verified ? 'text-forest-500' : 'text-red-500']" />
        <p class="font-body text-sm text-[var(--color-text)]">{{ verifyResult.message }}</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit">
        <button v-for="tab in [{key:'details',label:'My Details'},{key:'claims',label:'Claims History'}]"
          :key="tab.key" @click="activeTab = tab.key"
          :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
            activeTab === tab.key
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
          {{ tab.label }}
        </button>
      </div>

      <!-- Details tab -->
      <div v-if="activeTab === 'details'" class="card space-y-5">
        <h3 class="font-display text-lg text-[var(--color-text)]">Medical Aid Details</h3>

        <!-- Provider selection -->
        <div>
          <label class="input-label">Medical Aid Scheme <span class="text-red-400">*</span></label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button v-for="provider in providers" :key="provider.providerId"
              @click="form.providerId = provider.providerId; form.planName = ''"
              :class="['flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-left transition-all',
                form.providerId === provider.providerId
                  ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30'
                  : 'border-[var(--color-border)] hover:border-forest-300 bg-[var(--color-surface)]']">
              <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                form.providerId === provider.providerId ? 'bg-forest-100 dark:bg-forest-900/40' : 'bg-[var(--color-surface-2)]']">
                <Icon name="heroicons:shield-check"
                  :class="['w-4 h-4', form.providerId === provider.providerId ? 'text-forest-500' : 'text-[var(--color-text-muted)]']" />
              </div>
              <div class="min-w-0">
                <p class="font-body text-sm font-medium text-[var(--color-text)] truncate">{{ provider.name }}</p>
                <p v-if="provider.code" class="font-body text-[10px] text-[var(--color-text-muted)]">{{ provider.code }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Plan name -->
        <div v-if="form.providerId">
          <label class="input-label">Plan / Option <span class="text-red-400">*</span></label>
          <div v-if="planSuggestions.length" class="flex flex-wrap gap-2 mb-2">
            <button v-for="plan in planSuggestions" :key="plan"
              @click="form.planName = plan"
              :class="['px-3 py-1.5 rounded-full font-body text-xs border transition-all',
                form.planName === plan
                  ? 'bg-forest-500 text-white border-forest-500'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-forest-400']">
              {{ plan }}
            </button>
          </div>
          <input v-model="form.planName" type="text" class="input"
            :placeholder="planSuggestions.length ? 'Or type your plan name...' : 'e.g. Classic Delta, KeyCare Plus'" />
        </div>

        <!-- Membership details -->
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="input-label">Membership Number <span class="text-red-400">*</span></label>
            <input v-model="form.membershipNumber" type="text" class="input"
              placeholder="e.g. 123456789" />
            <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">
              Found on your medical aid card
            </p>
          </div>
          <div>
            <label class="input-label">Dependant Code</label>
            <input v-model="form.dependantCode" type="text" class="input"
              placeholder="e.g. 00 (main member), 01, 02..." />
            <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">
              00 = main member, 01+ = dependants
            </p>
          </div>
          <div class="sm:col-span-2">
            <label class="input-label">Main Member Name</label>
            <input v-model="form.mainMemberName" type="text" class="input"
              placeholder="Full name as on medical aid (if different from yours)" />
          </div>
        </div>

        <!-- Info box -->
        <div class="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-surface-2)]">
          <Icon name="heroicons:information-circle" class="w-5 h-5 text-forest-400 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="font-body text-sm font-medium text-[var(--color-text)]">How medical aid billing works</p>
            <p class="font-body text-xs text-[var(--color-text-muted)] leading-relaxed">
              After each session, we submit a claim to your scheme on your behalf using ICD-10 codes.
              Your scheme pays their portion directly to your therapist. You only pay the copayment (if any).
              Most psychological consultations fall under Prescribed Minimum Benefits (PMBs).
            </p>
          </div>
        </div>

        <SError v-if="saveError" :message="saveError" />

        <div class="flex items-center gap-3">
          <button @click="save" :disabled="saving" class="btn-primary">
            <span v-if="saving" class="flex items-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Saving...
            </span>
            <span v-else>{{ details?.membershipNumber ? 'Update details' : 'Save & link medical aid' }}</span>
          </button>
          <Transition name="fade">
            <p v-if="saveSuccess" class="font-body text-sm text-forest-500 flex items-center gap-1">
              <Icon name="heroicons:check-circle" class="w-4 h-4" /> Saved successfully
            </p>
          </Transition>
        </div>
      </div>

      <!-- Claims tab -->
      <div v-else-if="activeTab === 'claims'">
        <ClientMedicalAidClaims />
      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
