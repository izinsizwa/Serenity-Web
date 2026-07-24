<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const medicalAidApi = useMedicalAid()

const providers  = ref<any[]>([])
const loading    = ref(true)
const page       = ref(1)
const totalPages = ref(1)
const modalOpen  = ref(false)
const editTarget = ref<any>(null)
const saving     = ref(false)
const saveError  = ref('')

const form = reactive({
  name:                '',
  code:                '',
  description:         '',
  contactNumber:       '',
  email:               '',
  website:             '',
  isActive:            true,
  supportsAPIIntegration: false,
  apiEndpoint:         '',
})

function openCreate() {
  editTarget.value = null
  Object.assign(form, { name:'', code:'', description:'', contactNumber:'', email:'', website:'', isActive:true, supportsAPIIntegration:false, apiEndpoint:'' })
  modalOpen.value  = true
}

function openEdit(provider: any) {
  editTarget.value = provider
  Object.assign(form, {
    name:                provider.name ?? '',
    code:                provider.code ?? '',
    description:         provider.description ?? '',
    contactNumber:       provider.contactNumber ?? '',
    email:               provider.email ?? '',
    website:             provider.website ?? '',
    isActive:            provider.isActive ?? true,
    supportsAPIIntegration: provider.supportsAPIIntegration ?? false,
    apiEndpoint:         provider.apiEndpoint ?? '',
  })
  modalOpen.value = true
}

async function save() {
  if (!form.name.trim()) { saveError.value = 'Provider name is required'; return }
  saving.value = true; saveError.value = ''
  try {
    if (editTarget.value) {
      await medicalAidApi.adminUpdateProvider(editTarget.value.providerId, form)
    } else {
      await medicalAidApi.adminCreateProvider(form)
    }
    modalOpen.value = false
    load()
  } catch (e: any) { saveError.value = e.message }
  finally { saving.value = false }
}

async function toggleActive(provider: any) {
  await medicalAidApi.adminToggleProvider(provider.providerId, !provider.isActive)
  provider.isActive = !provider.isActive
}

async function load() {
  loading.value = true
  try {
    const res    = await medicalAidApi.adminGetProviders(page.value)
    providers.value  = res.data?.items ?? []
    totalPages.value = res.data?.totalPages ?? 1
  } finally { loading.value = false }
}

watch(page, load)
onMounted(load)

// SA medical aid providers to pre-populate
const commonProviders = [
  { name:'Discovery Health', code:'DIS' },
  { name:'Momentum Health', code:'MOM' },
  { name:'Bonitas Medical Fund', code:'BON' },
  { name:'Medihelp', code:'MED' },
  { name:'Bestmed', code:'BES' },
  { name:'Fedhealth', code:'FED' },
  { name:'CompCare Wellness', code:'CCW' },
  { name:'Sizwe Hosmed', code:'SIZ' },
  { name:'Profmed', code:'PRO' },
  { name:'Selfmed', code:'SEL' },
]
</script>

<template>
  <div class="p-6 lg:p-8 max-w-5xl mx-auto">
    <SPageHeader title="Medical Aid Providers" subtitle="Manage accepted medical aid schemes">
      <template #actions>
        <button @click="openCreate" class="btn-primary flex items-center gap-2 text-sm">
          <Icon name="heroicons:plus" class="w-4 h-4" /> Add provider
        </button>
      </template>
    </SPageHeader>

    <SLoader v-if="loading" label="Loading providers..." />
    <SEmpty v-else-if="!providers.length"
      icon="heroicons:shield-check"
      title="No providers configured"
      subtitle="Add South African medical aid schemes that you accept">
      <div class="mt-6 space-y-3 w-full max-w-sm">
        <p class="font-body text-xs text-[var(--color-text-muted)] text-center">Quick add common SA schemes:</p>
        <div class="flex flex-wrap gap-2 justify-center">
          <button v-for="p in commonProviders" :key="p.code"
            @click="Object.assign(form, { name: p.name, code: p.code, isActive: true }); modalOpen = true"
            class="px-3 py-1.5 rounded-full border border-[var(--color-border)] font-body text-xs text-[var(--color-text-muted)] hover:border-forest-400 hover:text-forest-600 transition-all">
            {{ p.name }}
          </button>
        </div>
      </div>
    </SEmpty>

    <div v-else class="space-y-4">
      <!-- Quick add SA schemes if list is short -->
      <div v-if="providers.length < 5" class="card-sm">
        <p class="font-body text-xs font-medium text-[var(--color-text)] mb-2">Quick add common SA schemes</p>
        <div class="flex flex-wrap gap-2">
          <button v-for="p in commonProviders.filter(cp => !providers.find(ex => ex.code === cp.code))" :key="p.code"
            @click="Object.assign(form, { name: p.name, code: p.code, isActive: true, description:'', contactNumber:'', email:'', website:'', supportsAPIIntegration:false, apiEndpoint:'' }); editTarget = null; modalOpen = true"
            class="px-3 py-1.5 rounded-full border border-[var(--color-border)] font-body text-xs text-[var(--color-text-muted)] hover:border-forest-400 hover:text-forest-600 transition-all flex items-center gap-1">
            <Icon name="heroicons:plus" class="w-3 h-3" />{{ p.name }}
          </button>
        </div>
      </div>

      <div class="card overflow-hidden p-0">
        <table class="w-full">
          <thead>
            <tr class="border-b border-[var(--color-border)]">
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Provider</th>
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Code</th>
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium hidden md:table-cell">Contact</th>
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">API</th>
              <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Status</th>
              <th class="text-right px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in providers" :key="p.providerId"
              class="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-forest-50 dark:bg-forest-900/30 flex items-center justify-center shrink-0">
                    <Icon name="heroicons:shield-check" class="w-5 h-5 text-forest-500" />
                  </div>
                  <div>
                    <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ p.name }}</p>
                    <p v-if="p.description" class="font-body text-xs text-[var(--color-text-muted)] truncate max-w-40">{{ p.description }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 font-body text-sm text-[var(--color-text-muted)] hidden sm:table-cell">
                <code class="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-xs">{{ p.code ?? '—' }}</code>
              </td>
              <td class="px-4 py-3 hidden md:table-cell">
                <p class="font-body text-xs text-[var(--color-text-muted)]">{{ p.contactNumber || '—' }}</p>
                <a v-if="p.website" :href="p.website" target="_blank"
                  class="font-body text-xs text-forest-500 hover:underline">Website ↗</a>
              </td>
              <td class="px-4 py-3">
                <SBadge :variant="p.supportsAPIIntegration ? 'green' : 'gray'">
                  {{ p.supportsAPIIntegration ? 'API' : 'Manual' }}
                </SBadge>
              </td>
              <td class="px-4 py-3">
                <SBadge :variant="p.isActive ? 'green' : 'red'">
                  {{ p.isActive ? 'Active' : 'Inactive' }}
                </SBadge>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEdit(p)"
                    class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">
                    Edit
                  </button>
                  <button @click="toggleActive(p)"
                    :class="['font-body text-xs transition-colors', p.isActive ? 'text-red-500 hover:text-red-600' : 'text-forest-500 hover:text-forest-600']">
                    {{ p.isActive ? 'Disable' : 'Enable' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <SPagination v-model:page="page" :total-pages="totalPages" />
    </div>

    <!-- Create / Edit modal -->
    <SModal v-model="modalOpen"
      :title="editTarget ? `Edit ${editTarget.name}` : 'Add Medical Aid Provider'"
      max-width="max-w-lg">
      <div class="space-y-4">
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="input-label">Provider Name <span class="text-red-400">*</span></label>
            <input v-model="form.name" type="text" class="input" placeholder="e.g. Discovery Health" />
          </div>
          <div>
            <label class="input-label">Scheme Code</label>
            <input v-model="form.code" type="text" class="input" placeholder="e.g. DIS" maxlength="10" />
          </div>
          <div>
            <label class="input-label">Contact Number</label>
            <input v-model="form.contactNumber" type="tel" class="input" placeholder="0860 998 877" />
          </div>
          <div>
            <label class="input-label">Email</label>
            <input v-model="form.email" type="email" class="input" placeholder="claims@scheme.co.za" />
          </div>
          <div>
            <label class="input-label">Website</label>
            <input v-model="form.website" type="url" class="input" placeholder="https://discovery.co.za" />
          </div>
          <div class="sm:col-span-2">
            <label class="input-label">Description</label>
            <textarea v-model="form.description" class="input resize-none" rows="2"
              placeholder="Brief description of coverage..." />
          </div>
        </div>

        <div class="divider" />

        <div class="space-y-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.isActive" class="rounded accent-forest-500" />
            <span class="font-body text-sm text-[var(--color-text)]">Provider is active and accepting claims</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.supportsAPIIntegration" class="rounded accent-forest-500" />
            <span class="font-body text-sm text-[var(--color-text)]">Supports API integration for real-time claims</span>
          </label>
          <div v-if="form.supportsAPIIntegration">
            <label class="input-label">API Endpoint</label>
            <input v-model="form.apiEndpoint" type="url" class="input" placeholder="https://api.scheme.co.za/claims" />
          </div>
        </div>

        <SError v-if="saveError" :message="saveError" />

        <div class="flex gap-3 pt-2">
          <button @click="modalOpen = false" class="btn-secondary flex-1">Cancel</button>
          <button @click="save" :disabled="saving" class="btn-primary flex-1">
            <span v-if="saving" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
              Saving...
            </span>
            <span v-else>{{ editTarget ? 'Update provider' : 'Add provider' }}</span>
          </button>
        </div>
      </div>
    </SModal>
  </div>
</template>
