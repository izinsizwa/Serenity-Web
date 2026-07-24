<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const auth           = useAuthStore()
const profileApi     = useClientProfile()
const paymentsApi    = usePayments()

const profile     = ref<any>(null)
const loading     = ref(true)
const payMethods  = ref<any[]>([])
const wearables   = ref<any[]>([])
const activeTab   = ref<string>('personal')
const saving      = ref(false)
const saveError   = ref('')
const saveSuccess = ref(false)
const pwModal     = ref(false)
const pwForm      = reactive({ current: '', newPw: '', confirm: '' })
const pwSaving    = ref(false)
const pwError     = ref('')

const form = reactive({
  firstName: '', lastName: '', phoneNumber: '',
  address: '', city: '', province: '', postalCode: '',
  preferredLanguage: '', gender: '', dateOfBirth: '',
})

async function load() {
  loading.value = true
  try {
    const [profRes, pmRes, wRes] = await Promise.all([
      profileApi.getMyProfile(),
      paymentsApi.getPaymentMethods(),
      profileApi.getWearableDevices(),
    ])
    profile.value   = profRes.data
    payMethods.value= pmRes.data ?? []
    wearables.value = wRes.data ?? []
    // Pre-fill form from auth user
    if (auth.user) {
      Object.assign(form, {
        firstName: auth.user.firstName, lastName: auth.user.lastName,
        phoneNumber: auth.user.phoneNumber, address: auth.user.address,
        city: auth.user.city, province: auth.user.province,
        postalCode: auth.user.postalCode, preferredLanguage: auth.user.preferredLanguage,
        gender: auth.user.gender, dateOfBirth: auth.user.dateOfBirth?.split('T')[0] ?? '',
      })
    }
  } finally { loading.value = false }
}

async function saveProfile() {
  saving.value = true; saveError.value = ''; saveSuccess.value = false
  try {
    await profileApi.updateAccountInfo(form)
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) { saveError.value = e.message }
  finally { saving.value = false }
}

async function changePassword() {
  if (pwForm.newPw !== pwForm.confirm) { pwError.value = 'Passwords do not match'; return }
  pwSaving.value = true; pwError.value = ''
  try {
    await profileApi.changePassword(pwForm.current, pwForm.newPw)
    pwModal.value = false; Object.assign(pwForm, { current:'', newPw:'', confirm:'' })
  } catch (e: any) { pwError.value = e.message }
  finally { pwSaving.value = false }
}

async function disconnectWearable(id: string) {
  await profileApi.disconnectWearable(id)
  load()
}

const colorMode = useColorMode()
const provinces = ['Gauteng','KwaZulu-Natal','Western Cape','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape']
onMounted(load)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <SPageHeader title="Profile & Settings" subtitle="Manage your account and preferences" />
    <SLoader v-if="loading" />
    <div v-else class="space-y-6">
      <!-- Profile header card -->
      <div class="card flex items-center gap-5">
        <div class="relative">
          <SAvatar :src="auth.user?.profilePictureUrl" :name="`${auth.user?.firstName ?? ''} ${auth.user?.lastName ?? ''}`"
            size="xl" color="bg-forest-500" />
          <button class="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
            <Icon name="heroicons:camera" class="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          </button>
        </div>
        <div>
          <p class="font-display text-xl text-[var(--color-text)]">{{ auth.fullName }}</p>
          <p class="font-body text-sm text-[var(--color-text-muted)]">{{ auth.user?.email }}</p>
          <div class="flex items-center gap-2 mt-2">
            <SBadge :variant="auth.user?.isEmailVerified ? 'green' : 'red'">
              {{ auth.user?.isEmailVerified ? 'Email verified' : 'Email unverified' }}
            </SBadge>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit overflow-x-auto">
        <button v-for="tab in [{key:'personal',label:'Personal'},{key:'health',label:'Health'},{key:'payments',label:'Payments'},{key:'devices',label:'Devices'},{key:'security',label:'Security'}]"
          :key="tab.key" @click="activeTab = tab.key"
          :class="['px-4 py-2 rounded-lg font-body text-sm font-medium whitespace-nowrap transition-all',
            activeTab === tab.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
          {{ tab.label }}
        </button>
      </div>

      <!-- Personal tab -->
      <div v-if="activeTab === 'personal'" class="card space-y-4">
        <h3 class="font-display text-lg text-[var(--color-text)]">Personal Information</h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div><label class="input-label">First name</label><input v-model="form.firstName" type="text" class="input" /></div>
          <div><label class="input-label">Last name</label><input v-model="form.lastName" type="text" class="input" /></div>
          <div><label class="input-label">Phone number</label><input v-model="form.phoneNumber" type="tel" class="input" /></div>
          <div><label class="input-label">Date of birth</label><input v-model="form.dateOfBirth" type="date" class="input" /></div>
          <div>
            <label class="input-label">Gender</label>
            <select v-model="form.gender" class="input">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label class="input-label">Preferred language</label>
            <select v-model="form.preferredLanguage" class="input">
              <option value="en">English</option>
              <option value="zu">Zulu</option>
              <option value="xh">Xhosa</option>
              <option value="af">Afrikaans</option>
              <option value="st">Sotho</option>
            </select>
          </div>
          <div class="sm:col-span-2"><label class="input-label">Street address</label><input v-model="form.address" type="text" class="input" /></div>
          <div><label class="input-label">City</label><input v-model="form.city" type="text" class="input" /></div>
          <div>
            <label class="input-label">Province</label>
            <select v-model="form.province" class="input">
              <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div><label class="input-label">Postal code</label><input v-model="form.postalCode" type="text" class="input" /></div>
        </div>
        <div class="flex items-center gap-3 pt-2">
          <button @click="saveProfile" :disabled="saving" class="btn-primary">
            <span v-if="saving" class="flex items-center gap-2"><Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />Saving...</span>
            <span v-else>Save changes</span>
          </button>
          <Transition name="fade-in">
            <p v-if="saveSuccess" class="font-body text-sm text-forest-500">✓ Saved successfully</p>
          </Transition>
          <SError v-if="saveError" :message="saveError" />
        </div>
      </div>

      <!-- Health tab -->
      <div v-else-if="activeTab === 'health'" class="card space-y-4">
        <h3 class="font-display text-lg text-[var(--color-text)]">Health & Clinical</h3>
        <div class="space-y-3">
          <div><label class="input-label">Presenting concerns</label>
            <textarea :value="profile?.presentingConcerns ?? ''" class="input resize-none" rows="3" readonly /></div>
          <div><label class="input-label">Current medications</label>
            <textarea :value="profile?.currentMedications ?? ''" class="input resize-none" rows="2" readonly /></div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div><label class="input-label">Emergency contact name</label>
              <input :value="profile?.emergencyContactName ?? ''" type="text" class="input" readonly /></div>
            <div><label class="input-label">Emergency contact phone</label>
              <input :value="profile?.emergencyContactPhone ?? ''" type="tel" class="input" readonly /></div>
          </div>
        </div>
        <div class="p-3 rounded-xl bg-[var(--color-surface-2)]">
          <p class="font-body text-xs text-[var(--color-text-muted)]">Health information can be updated by your therapist or during your intake assessment.</p>
        </div>
      </div>

      <!-- Payments tab -->
      <div v-else-if="activeTab === 'payments'" class="space-y-4">
        <div class="card space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-display text-lg text-[var(--color-text)]">Payment Methods</h3>
          </div>
          <SEmpty v-if="!payMethods.length" icon="heroicons:credit-card" title="No payment methods" subtitle="Add a payment method to book sessions" />
          <div v-else class="space-y-3">
            <div v-for="pm in payMethods" :key="pm.paymentMethodId"
              class="flex items-center gap-4 p-3 rounded-xl border border-[var(--color-border)]">
              <Icon :name="pm.type === 2 ? 'heroicons:shield-check' : pm.type === 1 ? 'heroicons:building-library' : 'heroicons:credit-card'"
                class="w-8 h-8 text-[var(--color-text-muted)]" />
              <div class="flex-1">
                <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ pm.name }}</p>
                <p class="font-body text-xs text-[var(--color-text-muted)]">
                  {{ pm.cardLastFour ? `•••• ${pm.cardLastFour}` : pm.medicalAidNumber ?? '' }}
                </p>
              </div>
              <SBadge v-if="pm.isDefault" variant="green">Default</SBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Devices tab -->
      <div v-else-if="activeTab === 'devices'" class="card space-y-4">
        <h3 class="font-display text-lg text-[var(--color-text)]">Connected Devices</h3>
        <SEmpty v-if="!wearables.length" icon="heroicons:device-tablet" title="No devices connected"
          subtitle="Connect a wearable to track health data automatically" />
        <div v-else class="space-y-3">
          <div v-for="d in wearables" :key="d.deviceId"
            class="flex items-center gap-4 p-3 rounded-xl border border-[var(--color-border)]">
            <Icon name="heroicons:cpu-chip" class="w-8 h-8 text-[var(--color-text-muted)]" />
            <div class="flex-1">
              <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ d.deviceName }}</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">Last synced {{ formatRelativeTime(d.lastSyncedAt) }}</p>
            </div>
            <SBadge :variant="d.isConnected ? 'green' : 'gray'">{{ d.isConnected ? 'Connected' : 'Offline' }}</SBadge>
            <button @click="disconnectWearable(d.deviceId)" class="text-red-500 hover:text-red-600 transition-colors ml-2">
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Security tab -->
      <div v-else-if="activeTab === 'security'" class="space-y-4">
        <div class="card space-y-4">
          <h3 class="font-display text-lg text-[var(--color-text)]">Security</h3>
          <div class="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-2)]">
            <div>
              <p class="font-body font-medium text-sm text-[var(--color-text)]">Password</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">Last changed recently</p>
            </div>
            <button @click="pwModal = true" class="btn-secondary text-sm">Change password</button>
          </div>
          <div class="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-2)]">
            <div>
              <p class="font-body font-medium text-sm text-[var(--color-text)]">Appearance</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">{{ colorMode.value === 'dark' ? 'Dark mode' : 'Light mode' }}</p>
            </div>
            <button @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'" class="btn-secondary text-sm">
              Toggle {{ colorMode.value === 'dark' ? 'light' : 'dark' }} mode
            </button>
          </div>
          <div class="divider" />
          <div>
            <button @click="useAuthStore().logout()" class="flex items-center gap-2 font-body text-sm text-red-500 hover:text-red-600 transition-colors">
              <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
              Sign out of Serenity
            </button>
          </div>
        </div>
      </div>
    </div>

    <SModal v-model="pwModal" title="Change password" max-width="max-w-sm">
      <div class="space-y-4">
        <div><label class="input-label">Current password</label><input v-model="pwForm.current" type="password" class="input" /></div>
        <div><label class="input-label">New password</label><input v-model="pwForm.newPw" type="password" class="input" /></div>
        <div><label class="input-label">Confirm new password</label><input v-model="pwForm.confirm" type="password" class="input" /></div>
        <SError v-if="pwError" :message="pwError" />
        <div class="flex gap-3">
          <button @click="pwModal = false" class="btn-secondary flex-1">Cancel</button>
          <button @click="changePassword" :disabled="pwSaving" class="btn-primary flex-1">
            <span v-if="pwSaving" class="flex items-center justify-center gap-2"><Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />Saving...</span>
            <span v-else>Update password</span>
          </button>
        </div>
      </div>
    </SModal>
  </div>
</template>
