<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const moodApi  = useMood()

const stats        = ref<any>(null)
const entries      = ref<any[]>([])
const loading      = ref(true)
const period       = ref<'week'|'month'|'3months'>('week')
const checkInOpen  = ref(false)
const selectedMood = ref<number|null>(null)
const page         = ref(1)
const totalPages   = ref(1)
const loadingEntries = ref(false)

async function loadStats() {
  loading.value = true
  try {
    const res = await moodApi.getMoodStats(period.value)
    stats.value = res.data
  } finally { loading.value = false }
}

async function loadEntries() {
  loadingEntries.value = true
  try {
    const res = await moodApi.getMyMoodEntries(undefined, undefined, page.value, 10)
    entries.value    = res.data?.items ?? []
    totalPages.value = res.data?.totalPages ?? 1
  } finally { loadingEntries.value = false }
}

async function saveCheckIn(data: any) {
  await moodApi.createMoodEntry(data)
  checkInOpen.value = false
  loadStats()
  loadEntries()
}

watch(period, loadStats)
watch(page, loadEntries)
onMounted(() => { loadStats(); loadEntries() })

const moodColors: Record<number, string> = {
  1: 'bg-red-400', 2: 'bg-orange-400', 3: 'bg-yellow-400', 4: 'bg-lime-400', 5: 'bg-forest-400'
}
const moodLabels: Record<number, string> = {
  1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Great'
}
const moodEmojis: Record<number, string> = {
  1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😊'
}

const maxBarHeight = 64
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
    <SPageHeader title="Mood Tracker" subtitle="Track how you feel over time">
      <template #actions>
        <button @click="checkInOpen = true" class="btn-primary flex items-center gap-2 text-sm">
          <Icon name="heroicons:plus" class="w-4 h-4" /> Log mood
        </button>
      </template>
    </SPageHeader>

    <!-- Period tabs -->
    <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit">
      <button v-for="p in [{ key:'week',label:'7 days'},{ key:'month',label:'30 days'},{ key:'3months',label:'3 months'}]"
        :key="p.key" @click="period = p.key as any"
        :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
          period === p.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
        {{ p.label }}
      </button>
    </div>

    <SLoader v-if="loading" label="Loading mood data..." />

    <div v-else class="space-y-6">
      <!-- Summary cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="card-sm text-center">
          <p class="font-display text-3xl" :class="stats?.average >= 4 ? 'text-forest-500' : stats?.average >= 3 ? 'text-yellow-500' : 'text-red-500'">
            {{ stats?.average?.toFixed(1) ?? '—' }}
          </p>
          <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Average Mood</p>
        </div>
        <div class="card-sm text-center">
          <p class="font-display text-3xl text-forest-500">{{ stats?.streakDays ?? 0 }}</p>
          <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Day Streak 🔥</p>
        </div>
        <div class="card-sm text-center">
          <p class="font-display text-3xl text-[var(--color-text)]">{{ stats?.entries?.length ?? 0 }}</p>
          <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">Check-ins</p>
        </div>
        <div class="card-sm text-center">
          <div class="flex items-center justify-center gap-1">
            <Icon :name="stats?.trend === 'improving' ? 'heroicons:arrow-trending-up' :
                         stats?.trend === 'declining' ? 'heroicons:arrow-trending-down' : 'heroicons:minus'"
              :class="['w-6 h-6',
                stats?.trend === 'improving' ? 'text-forest-500' :
                stats?.trend === 'declining' ? 'text-red-500' : 'text-[var(--color-text-muted)]']" />
          </div>
          <p class="font-body text-xs text-[var(--color-text-muted)] mt-1 capitalize">{{ stats?.trend ?? 'Stable' }}</p>
        </div>
      </div>

      <!-- Bar chart -->
      <div v-if="stats?.entries?.length" class="card">
        <h3 class="font-display text-lg text-[var(--color-text)] mb-4">Mood History</h3>
        <div class="flex items-end gap-1.5 h-20 mb-2">
          <div v-for="entry in stats.entries" :key="entry.moodId"
            class="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              :style="{ height: `${(entry.moodScore / 5) * maxBarHeight}px` }"
              :class="['w-full rounded-t-md transition-all cursor-pointer hover:opacity-80', moodColors[entry.moodScore]]">
              <!-- Tooltip -->
              <div class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 shadow-elevated text-center whitespace-nowrap">
                  <p class="font-body text-xs font-medium text-[var(--color-text)]">{{ moodLabels[entry.moodScore] }}</p>
                  <p class="font-body text-[10px] text-[var(--color-text-muted)]">
                    {{ formatDate(entry.entryDate, { month:'short', day:'numeric' }) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- X axis labels — show every nth -->
        <div class="flex gap-1.5">
          <div v-for="(entry, i) in stats.entries" :key="entry.moodId" class="flex-1 text-center">
            <p v-if="i % Math.ceil(stats.entries.length / 7) === 0"
              class="font-body text-[9px] text-[var(--color-text-muted)]">
              {{ formatDate(entry.entryDate, { month:'numeric', day:'numeric' }) }}
            </p>
          </div>
        </div>
        <!-- Legend -->
        <div class="flex items-center gap-4 mt-4 flex-wrap">
          <div v-for="(color, score) in moodColors" :key="score" class="flex items-center gap-1.5">
            <div :class="['w-3 h-3 rounded-sm', color]" />
            <span class="font-body text-xs text-[var(--color-text-muted)]">{{ moodLabels[Number(score)] }}</span>
          </div>
        </div>
      </div>

      <!-- Detailed metrics (avg per dimension) -->
      <div v-if="stats?.entries?.length" class="card">
        <h3 class="font-display text-lg text-[var(--color-text)] mb-4">Wellbeing Dimensions</h3>
        <div class="space-y-3">
          <div v-for="dim in [
            { key:'anxietyLevel', label:'Anxiety (lower is better)', invert:true },
            { key:'stressLevel',  label:'Stress (lower is better)', invert:true },
            { key:'energyLevel',  label:'Energy' },
            { key:'sleepQuality', label:'Sleep quality' },
            { key:'focusLevel',   label:'Focus' },
          ]" :key="dim.key">
            <div class="flex justify-between mb-1">
              <span class="font-body text-sm text-[var(--color-text)]">{{ dim.label }}</span>
              <span class="font-body text-sm text-[var(--color-text-muted)]">
                {{
                  (stats.entries.reduce((a: number, e: any) => a + (e[dim.key] ?? 0), 0) / stats.entries.length).toFixed(1)
                }}/5
              </span>
            </div>
            <div class="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
              <div
                :class="['h-full rounded-full transition-all',
                  dim.invert ? 'bg-gradient-to-r from-forest-400 to-red-400' : 'bg-gradient-to-r from-red-400 to-forest-400']"
                :style="{ width: `${(stats.entries.reduce((a: number, e: any) => a + (e[dim.key] ?? 0), 0) / stats.entries.length / 5) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Entry list -->
    <div class="space-y-4">
      <h3 class="font-display text-lg text-[var(--color-text)]">All Check-ins</h3>
      <SLoader v-if="loadingEntries" />
      <SEmpty v-else-if="!entries.length"
        icon="heroicons:heart" title="No mood entries yet"
        subtitle="Start your daily check-in to track your wellbeing" />
      <div v-else class="space-y-3">
        <div v-for="entry in entries" :key="entry.moodId"
          class="card-sm flex items-start gap-4">
          <span class="text-2xl mt-0.5">{{ moodEmojis[entry.moodScore] }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <p class="font-body font-medium text-sm text-[var(--color-text)]">
                {{ moodLabels[entry.moodScore] }}
                <span v-if="entry.moodType" class="font-normal text-[var(--color-text-muted)]"> · {{ entry.moodType }}</span>
              </p>
              <p class="font-body text-xs text-[var(--color-text-muted)] shrink-0">
                {{ formatDate(entry.entryDate, { weekday:'short', month:'short', day:'numeric' }) }}
              </p>
            </div>
            <p v-if="entry.notes" class="font-body text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{{ entry.notes }}</p>
            <div v-if="entry.activity" class="mt-1">
              <span class="badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)] text-[10px]">{{ entry.activity }}</span>
            </div>
            <div class="flex gap-4 mt-2">
              <span v-for="dim in [
                { icon:'heroicons:face-smile', val: entry.energyLevel, label:'Energy' },
                { icon:'heroicons:moon', val: entry.sleepQuality, label:'Sleep' },
                { icon:'heroicons:bolt', val: entry.focusLevel, label:'Focus' },
              ]" :key="dim.label" class="flex items-center gap-1">
                <Icon :name="dim.icon" class="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                <span class="font-body text-[10px] text-[var(--color-text-muted)]">{{ dim.val }}/5</span>
              </span>
            </div>
          </div>
        </div>
        <SPagination v-model:page="page" :total-pages="totalPages" />
      </div>
    </div>

    <SModal v-model="checkInOpen" title="Daily Check-In" max-width="max-w-lg">
      <ClientMoodCheckInForm @submit="saveCheckIn" @cancel="checkInOpen = false" />
    </SModal>
  </div>
</template>
