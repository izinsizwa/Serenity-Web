<script setup lang="ts">
import { SessionFormat } from '~/types'
definePageMeta({ layout: 'client', middleware: 'auth' })

const therapistApi = useTherapists()

const search    = ref('')
const province  = ref('')
const specialty = ref('')
const format    = ref('')
const medAid    = ref(false)
const minFee    = ref<number | null>(null)
const maxFee    = ref<number | null>(null)
const page      = ref(1)

const loading    = ref(false)
const error      = ref('')
const results    = ref<any[]>([])
const totalPages = ref(1)
const totalCount = ref(0)

const showFilters = ref(false)

const provinces = ['Gauteng','KwaZulu-Natal','Western Cape','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape']
const specialties= ['Anxiety','Depression','Trauma','PTSD','Relationships','Grief','Addiction','Eating Disorders','ADHD','OCD','Bipolar','Schizophrenia']

async function search_therapists() {
  loading.value = true; error.value = ''
  try {
    const res = await therapistApi.searchTherapists({
      search:            search.value || undefined,
      province:          province.value || undefined,
      specialty:         specialty.value || undefined,
      sessionFormat:     format.value as SessionFormat || undefined,
      acceptsMedicalAid: medAid.value || undefined,
      minFee:            minFee.value ?? undefined,
      maxFee:            maxFee.value ?? undefined,
      page:              page.value,
      pageSize:          12,
    })
    results.value    = res.data?.items ?? []
    totalPages.value = res.data?.totalPages ?? 1
    totalCount.value = res.data?.totalCount ?? 0
  } catch (e: any) { error.value = e.message }
  finally { loading.value = false }
}

function clearFilters() {
  province.value = ''; specialty.value = ''; format.value = ''
  medAid.value = false; minFee.value = null; maxFee.value = null
  page.value = 1; search_therapists()
}

const debouncedSearch = useDebounceFn(search_therapists, 400)
watch(search, debouncedSearch)
watch([province, specialty, format, medAid, minFee, maxFee], () => { page.value = 1; search_therapists() })
watch(page, search_therapists)
onMounted(search_therapists)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-6xl mx-auto">
    <SPageHeader title="Find a Therapist" subtitle="Browse verified HPCSA-registered therapists" />

    <!-- Search bar -->
    <div class="flex gap-3 mb-4">
      <div class="relative flex-1">
        <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
        <input v-model="search" type="text" class="input pl-10" placeholder="Search by name, specialty, area..." />
      </div>
      <button @click="showFilters = !showFilters"
        :class="['flex items-center gap-2 px-4 py-3 rounded-xl border font-body text-sm font-medium transition-all',
          showFilters ? 'bg-forest-500 text-white border-forest-500' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-forest-400 bg-[var(--color-surface)]']">
        <Icon name="heroicons:adjustments-horizontal" class="w-4 h-4" />
        Filters
      </button>
    </div>

    <!-- Filters panel -->
    <Transition name="slide-down">
      <div v-if="showFilters" class="card mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="input-label">Province</label>
          <select v-model="province" class="input">
            <option value="">All provinces</option>
            <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div>
          <label class="input-label">Specialty</label>
          <select v-model="specialty" class="input">
            <option value="">All specialties</option>
            <option v-for="s in specialties" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div>
          <label class="input-label">Session Format</label>
          <select v-model="format" class="input">
            <option value="">Any format</option>
            <option value="Online">Online</option>
            <option value="InPerson">In-Person</option>
            <option value="Phone">Phone</option>
          </select>
        </div>
        <div>
          <label class="input-label">Fee range (ZAR)</label>
          <div class="flex gap-2">
            <input v-model.number="minFee" type="number" class="input" placeholder="Min" min="0" />
            <input v-model.number="maxFee" type="number" class="input" placeholder="Max" min="0" />
          </div>
        </div>
        <div class="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="medAid" class="rounded accent-forest-500" />
            <span class="font-body text-sm text-[var(--color-text)]">Accepts medical aid</span>
          </label>
          <button @click="clearFilters" class="ml-auto font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">
            Clear filters
          </button>
        </div>
      </div>
    </Transition>

    <!-- Results count -->
    <p v-if="!loading && totalCount" class="font-body text-sm text-[var(--color-text-muted)] mb-4">
      {{ totalCount }} therapist{{ totalCount !== 1 ? 's' : '' }} found
    </p>

    <SLoader v-if="loading" label="Searching therapists..." />
    <SError v-else-if="error" :message="error" :on-retry="search_therapists" />
    <SEmpty v-else-if="!results.length"
      icon="heroicons:user-group"
      title="No therapists found"
      subtitle="Try adjusting your filters or search terms" />

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <NuxtLink v-for="t in results" :key="t.therapistId"
        :to="`/client/therapists/${t.therapistId}`"
        class="card hover:shadow-elevated transition-all hover:-translate-y-0.5 group">
        <!-- Header -->
        <div class="flex items-start gap-3 mb-4">
          <SAvatar :src="t.profile?.profilePictureUrl" :name="`${t.profile?.firstName ?? ''} ${t.profile?.lastName ?? ''}`"
            size="lg" color="bg-clay-500" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1">
              <p class="font-body font-semibold text-[var(--color-text)] truncate">
                Dr. {{ t.profile?.firstName }} {{ t.profile?.lastName }}
              </p>
              <Icon v-if="t.isHpcsaVerified" name="heroicons:check-badge" class="w-4 h-4 text-forest-500 shrink-0" title="HPCSA Verified" />
            </div>
            <p class="font-body text-xs text-[var(--color-text-muted)] truncate">{{ t.qualification }}</p>
            <div class="flex items-center gap-1 mt-1">
              <SRating :model-value="t.averageRating" :size="3" />
              <span class="font-body text-xs text-[var(--color-text-muted)]">{{ t.averageRating?.toFixed(1) }}</span>
            </div>
          </div>
        </div>

        <!-- Specialties -->
        <div v-if="t.specialties?.length" class="flex flex-wrap gap-1.5 mb-3">
          <span v-for="s in t.specialties.slice(0,3)" :key="s.specialtyId"
            class="badge bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-300">
            {{ s.name }}
          </span>
          <span v-if="t.specialties.length > 3"
            class="badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
            +{{ t.specialties.length - 3 }}
          </span>
        </div>

        <!-- Bio snippet -->
        <p class="font-body text-xs text-[var(--color-text-muted)] line-clamp-2 mb-4">{{ t.bio }}</p>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
          <div>
            <p class="font-body font-semibold text-[var(--color-text)] text-sm">
              {{ formatCurrency(t.consultationFee) }}
            </p>
            <p class="font-body text-[10px] text-[var(--color-text-muted)]">per session</p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="t.acceptsMedicalAid" class="badge-green text-[10px]">Med aid</span>
            <span :class="['badge text-[10px]', t.isAvailable ? 'badge-green' : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]']">
              {{ t.isAvailable ? 'Available' : 'Unavailable' }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <SPagination v-model:page="page" :total-pages="totalPages" />
  </div>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
