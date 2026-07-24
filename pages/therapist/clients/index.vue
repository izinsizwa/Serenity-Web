<script setup lang="ts">
definePageMeta({ layout: 'therapist', middleware: 'auth' })
const clientsApi = useTherapistClients()

const items      = ref<any[]>([])
const loading    = ref(true)
const search     = ref('')
const page       = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)

async function load() {
  loading.value = true
  try {
    const res = await clientsApi.getMyClients(page.value, 16, search.value || undefined)
    items.value      = res.data?.items ?? []
    totalPages.value = res.data?.totalPages ?? 1
    totalCount.value = res.data?.totalCount ?? 0
  } finally { loading.value = false }
}

const debouncedSearch = useDebounceFn(() => { page.value = 1; load() }, 400)
watch(search, debouncedSearch)
watch(page, load)
onMounted(load)

const moodColors: Record<number, string> = {
  1: 'bg-red-400', 2: 'bg-orange-400', 3: 'bg-yellow-400', 4: 'bg-lime-400', 5: 'bg-forest-400'
}
</script>

<template>
  <div class="p-6 lg:p-8 max-w-6xl mx-auto">
    <SPageHeader title="Clients" :subtitle="`${totalCount} active client${totalCount !== 1 ? 's' : ''}`" />

    <div class="flex items-center gap-3 mb-6">
      <div class="relative flex-1 max-w-sm">
        <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
        <input v-model="search" type="text" class="input pl-10" placeholder="Search clients..." />
      </div>
    </div>

    <SLoader v-if="loading" label="Loading clients..." />
    <SEmpty v-else-if="!items.length"
      icon="heroicons:users" title="No clients yet"
      subtitle="Clients will appear here once they book sessions with you" />

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <NuxtLink v-for="client in items" :key="client.clientId"
        :to="`/therapist/clients/${client.clientId}`"
        class="card hover:shadow-elevated transition-all hover:-translate-y-0.5 group">
        <div class="flex flex-col items-center text-center gap-3">
          <div class="relative">
            <SAvatar
              :src="client.profilePictureUrl"
              :name="`${client.firstName ?? ''} ${client.lastName ?? ''}`"
              size="xl" color="bg-forest-500" />
            <!-- Latest mood indicator -->
            <div v-if="client.latestMoodScore"
              :class="['absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[var(--color-surface)]', moodColors[client.latestMoodScore]]" />
          </div>
          <div>
            <p class="font-body font-semibold text-sm text-[var(--color-text)]">
              {{ client.firstName }} {{ client.lastName }}
            </p>
            <p class="font-body text-xs text-[var(--color-text-muted)]">
              Since {{ formatDate(client.firstSessionDate ?? client.createdAt, { month: 'short', year: 'numeric' }) }}
            </p>
          </div>
          <div class="flex gap-2 flex-wrap justify-center">
            <SBadge v-if="client.hasMedicalAid" variant="green">Med Aid</SBadge>
            <SBadge v-if="client.hasCrisisAlert" variant="red">Crisis</SBadge>
            <SBadge variant="gray">{{ client.totalSessions ?? 0 }} sessions</SBadge>
          </div>
          <div class="w-full pt-2 border-t border-[var(--color-border)]">
            <p class="font-body text-xs text-[var(--color-text-muted)]">Last session</p>
            <p class="font-body text-xs font-medium text-[var(--color-text)]">
              {{ client.lastSessionDate ? formatDate(client.lastSessionDate, { month: 'short', day: 'numeric' }) : 'None yet' }}
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>
    <SPagination v-if="!loading" v-model:page="page" :total-pages="totalPages" />
  </div>
</template>
