<script setup lang="ts">
definePageMeta({ layout: 'therapist', middleware: 'auth' })
const auth        = useAuthStore()
const profileApi  = useTherapistProfile()
const colorMode   = useColorMode()

const profile    = ref<any>(null)
const documents  = ref<any[]>([])
const loading    = ref(true)
const activeTab  = ref('profile')
const saving     = ref(false)
const saveSuccess= ref(false)
const saveError  = ref('')
const uploadingDoc= ref(false)

const form = reactive({
  bio: '', qualification: '', institution: '', treatmentApproach: '',
  areasOfExpertise: '', yearsOfExperience: 0, consultationFee: 0,
  province: '', city: '', address: '',
  acceptsMedicalAid: false, indemnityProvider: '', indemnityPolicyNumber: '',
})

const specialties = ref<any[]>([])
const languages   = ref<any[]>([])
const newSpecialty= reactive({ name: '', description: '', yearsExperience: 0 })
const newLanguage = reactive({ languageName: '', proficiency: 'Fluent' })

const provinces = ['Gauteng','KwaZulu-Natal','Western Cape','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape']
const docTypes  = [{ value: 0, label:'HPCSA Registration' },{ value: 1, label:'Qualification Certificate' },{ value: 2, label:'Indemnity Insurance' },{ value: 3, label:'ID Document' }]

async function load() {
  loading.value = true
  try {
    const [profRes, docRes] = await Promise.all([
      profileApi.getMyProfile(),
      profileApi.getDocuments(),
    ])
    profile.value   = profRes.data
    documents.value = docRes.data ?? []
    specialties.value = profRes.data?.specialties ?? []
    languages.value   = profRes.data?.languages ?? []
    if (profRes.data) Object.assign(form, {
      bio:               profRes.data.bio ?? '',
      qualification:     profRes.data.qualification ?? '',
      institution:       profRes.data.institution ?? '',
      treatmentApproach: profRes.data.treatmentApproach ?? '',
      areasOfExpertise:  profRes.data.areasOfExpertise ?? '',
      yearsOfExperience: profRes.data.yearsOfExperience ?? 0,
      consultationFee:   profRes.data.consultationFee ?? 0,
      province:          profRes.data.province ?? '',
      city:              profRes.data.city ?? '',
      address:           profRes.data.address ?? '',
      acceptsMedicalAid: profRes.data.acceptsMedicalAid ?? false,
      indemnityProvider: profRes.data.indemnityProvider ?? '',
      indemnityPolicyNumber: profRes.data.indemnityPolicyNumber ?? '',
    })
  } finally { loading.value = false }
}

async function saveProfile() {
  saving.value = true; saveError.value = ''; saveSuccess.value = false
  try {
    await profileApi.updateProfile(form)
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) { saveError.value = e.message }
  finally { saving.value = false }
}

async function addSpecialty() {
  if (!newSpecialty.name) return
  specialties.value.push({ ...newSpecialty, specialtyId: Date.now().toString() })
  await profileApi.updateSpecialties(specialties.value)
  Object.assign(newSpecialty, { name: '', description: '', yearsExperience: 0 })
}

async function removeSpecialty(id: string) {
  specialties.value = specialties.value.filter(s => s.specialtyId !== id)
  await profileApi.updateSpecialties(specialties.value)
}

async function addLanguage() {
  if (!newLanguage.languageName) return
  languages.value.push({ ...newLanguage, languageId: Date.now().toString() })
  await profileApi.updateLanguages(languages.value)
  Object.assign(newLanguage, { languageName: '', proficiency: 'Fluent' })
}

async function removeLanguage(id: string) {
  languages.value = languages.value.filter(l => l.languageId !== id)
  await profileApi.updateLanguages(languages.value)
}

async function uploadDocument(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingDoc.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', '0')
    await profileApi.uploadDocument(fd)
    load()
  } finally { uploadingDoc.value = false }
}

async function deleteDocument(id: string) {
  await profileApi.deleteDocument(id)
  documents.value = documents.value.filter(d => d.documentId !== id)
}

onMounted(load)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <SPageHeader title="Profile & Settings" subtitle="Manage your professional profile" />

    <SLoader v-if="loading" />

    <div v-else class="space-y-6">
      <!-- Header card -->
      <div class="card flex items-center gap-5">
        <div class="relative">
          <SAvatar :src="auth.user?.profilePictureUrl" :name="auth.fullName" size="xl" color="bg-clay-500" />
          <div class="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center cursor-pointer">
            <Icon name="heroicons:camera" class="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          </div>
        </div>
        <div class="flex-1">
          <p class="font-display text-xl text-[var(--color-text)]">{{ auth.fullName }}</p>
          <p class="font-body text-sm text-[var(--color-text-muted)]">{{ form.qualification }}</p>
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            <SBadge :variant="profile?.isHpcsaVerified ? 'green' : 'red'">
              {{ profile?.isHpcsaVerified ? 'HPCSA Verified' : 'Pending Verification' }}
            </SBadge>
            <SBadge :variant="profile?.isVerified ? 'green' : 'gray'">
              {{ profile?.isVerified ? 'Platform Verified' : 'Unverified' }}
            </SBadge>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit overflow-x-auto">
        <button v-for="tab in [
          {key:'profile',label:'Profile'},
          {key:'specialties',label:'Specialties'},
          {key:'documents',label:'Documents'},
          {key:'security',label:'Security'},
        ]" :key="tab.key" @click="activeTab = tab.key"
          :class="['px-4 py-2 rounded-lg font-body text-sm font-medium whitespace-nowrap transition-all',
            activeTab === tab.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
          {{ tab.label }}
        </button>
      </div>

      <!-- Profile tab -->
      <div v-if="activeTab === 'profile'" class="card space-y-5">
        <h3 class="font-display text-lg text-[var(--color-text)]">Professional Information</h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="input-label">Bio</label>
            <textarea v-model="form.bio" class="input resize-none" rows="4"
              placeholder="Describe your practice, approach, and experience..." />
          </div>
          <div>
            <label class="input-label">Qualification</label>
            <input v-model="form.qualification" type="text" class="input" placeholder="e.g. MA Clinical Psychology" />
          </div>
          <div>
            <label class="input-label">Institution</label>
            <input v-model="form.institution" type="text" class="input" placeholder="University / College" />
          </div>
          <div class="sm:col-span-2">
            <label class="input-label">Treatment Approach</label>
            <textarea v-model="form.treatmentApproach" class="input resize-none" rows="3"
              placeholder="CBT, DBT, Psychodynamic, etc." />
          </div>
          <div class="sm:col-span-2">
            <label class="input-label">Areas of Expertise</label>
            <input v-model="form.areasOfExpertise" type="text" class="input"
              placeholder="Anxiety, Depression, Trauma..." />
          </div>
          <div>
            <label class="input-label">Years of Experience</label>
            <input v-model.number="form.yearsOfExperience" type="number" class="input" min="0" />
          </div>
          <div>
            <label class="input-label">Consultation Fee (ZAR)</label>
            <input v-model.number="form.consultationFee" type="number" class="input" min="0" step="50" />
          </div>
          <div>
            <label class="input-label">Province</label>
            <select v-model="form.province" class="input">
              <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div>
            <label class="input-label">City</label>
            <input v-model="form.city" type="text" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="input-label">Practice Address</label>
            <input v-model="form.address" type="text" class="input" />
          </div>
        </div>
        <div class="divider" />
        <h4 class="font-body font-semibold text-sm text-[var(--color-text)]">Insurance & Medical Aid</h4>
        <div class="grid sm:grid-cols-2 gap-4">
          <label class="sm:col-span-2 flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.acceptsMedicalAid" class="rounded accent-forest-500" />
            <span class="font-body text-sm text-[var(--color-text)]">Accept medical aid payments</span>
          </label>
          <div>
            <label class="input-label">Indemnity Provider</label>
            <input v-model="form.indemnityProvider" type="text" class="input" placeholder="e.g. PANSA" />
          </div>
          <div>
            <label class="input-label">Policy Number</label>
            <input v-model="form.indemnityPolicyNumber" type="text" class="input" />
          </div>
        </div>
        <div class="flex items-center gap-3 pt-2">
          <button @click="saveProfile" :disabled="saving" class="btn-primary">
            <span v-if="saving" class="flex items-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Saving...
            </span>
            <span v-else>Save changes</span>
          </button>
          <Transition name="fade-in">
            <p v-if="saveSuccess" class="font-body text-sm text-forest-500">✓ Saved</p>
          </Transition>
          <SError v-if="saveError" :message="saveError" />
        </div>
      </div>

      <!-- Specialties tab -->
      <div v-else-if="activeTab === 'specialties'" class="space-y-5">
        <div class="card space-y-4">
          <h3 class="font-display text-lg text-[var(--color-text)]">Specialties</h3>
          <div class="space-y-2">
            <div v-for="s in specialties" :key="s.specialtyId"
              class="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
              <div class="flex-1">
                <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ s.name }}</p>
                <p v-if="s.description" class="font-body text-xs text-[var(--color-text-muted)]">{{ s.description }}</p>
              </div>
              <span class="font-body text-xs text-[var(--color-text-muted)]">{{ s.yearsExperience }}y exp</span>
              <button @click="removeSpecialty(s.specialtyId)" class="text-red-400 hover:text-red-500 transition-colors">
                <Icon name="heroicons:x-mark" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="grid sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--color-border)]">
            <input v-model="newSpecialty.name" type="text" class="input" placeholder="Specialty name" />
            <input v-model="newSpecialty.description" type="text" class="input" placeholder="Description (optional)" />
            <div class="flex gap-2">
              <input v-model.number="newSpecialty.yearsExperience" type="number" class="input flex-1" placeholder="Years" min="0" />
              <button @click="addSpecialty" class="btn-primary px-4">Add</button>
            </div>
          </div>
        </div>

        <div class="card space-y-4">
          <h3 class="font-display text-lg text-[var(--color-text)]">Languages</h3>
          <div class="flex flex-wrap gap-2">
            <div v-for="l in languages" :key="l.languageId"
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <span class="font-body text-sm text-[var(--color-text)]">{{ l.languageName }}</span>
              <span class="font-body text-xs text-[var(--color-text-muted)]">({{ l.proficiency }})</span>
              <button @click="removeLanguage(l.languageId)" class="text-[var(--color-text-muted)] hover:text-red-400 transition-colors ml-1">
                <Icon name="heroicons:x-mark" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div class="flex gap-3 pt-2 border-t border-[var(--color-border)]">
            <input v-model="newLanguage.languageName" type="text" class="input flex-1" placeholder="Language" />
            <select v-model="newLanguage.proficiency" class="input w-36">
              <option>Native</option>
              <option>Fluent</option>
              <option>Conversational</option>
            </select>
            <button @click="addLanguage" class="btn-primary px-4">Add</button>
          </div>
        </div>
      </div>

      <!-- Documents tab -->
      <div v-else-if="activeTab === 'documents'" class="card space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-display text-lg text-[var(--color-text)]">Verification Documents</h3>
          <label class="btn-primary text-sm cursor-pointer flex items-center gap-2">
            <Icon v-if="uploadingDoc" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            <Icon v-else name="heroicons:arrow-up-tray" class="w-4 h-4" />
            Upload document
            <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png" @change="uploadDocument" />
          </label>
        </div>
        <SEmpty v-if="!documents.length" icon="heroicons:document-check"
          title="No documents uploaded"
          subtitle="Upload your HPCSA registration, qualification certificates and indemnity insurance" />
        <div v-else class="space-y-3">
          <div v-for="doc in documents" :key="doc.documentId"
            class="flex items-center gap-4 p-3 rounded-xl border border-[var(--color-border)]">
            <div class="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
              <Icon name="heroicons:document-text" class="w-5 h-5 text-[var(--color-text-muted)]" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-body text-sm font-medium text-[var(--color-text)] truncate">{{ doc.documentName }}</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">
                {{ docTypes.find(t => t.value === doc.type)?.label ?? 'Document' }}
                · Uploaded {{ formatDate(doc.createdAt, { month:'short', day:'numeric' }) }}
              </p>
            </div>
            <SBadge :variant="doc.isVerified ? 'green' : 'gray'">
              {{ doc.isVerified ? 'Verified' : 'Pending' }}
            </SBadge>
            <a :href="doc.documentUrl" target="_blank"
              class="text-forest-500 hover:text-forest-600 transition-colors">
              <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4" />
            </a>
            <button @click="deleteDocument(doc.documentId)"
              class="text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
              <Icon name="heroicons:trash" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Security tab -->
      <div v-else-if="activeTab === 'security'" class="card space-y-4">
        <h3 class="font-display text-lg text-[var(--color-text)]">Account & Security</h3>
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
        <button @click="auth.logout()" class="flex items-center gap-2 font-body text-sm text-red-500 hover:text-red-600 transition-colors">
          <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>
