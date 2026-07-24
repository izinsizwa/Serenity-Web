<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const adminStats = useAdminStats()

const stats    = ref<any>(null)
const activity = ref<any[]>([])
const loading  = ref(true)

async function load() {
  loading.value = true
  await Promise.allSettled([
    adminStats.getPlatformStats().then(r => { stats.value = r.data }),
    adminStats.getRecentActivity().then(r => { activity.value = r.data ?? [] }),
  ])
  loading.value = false
}

onMounted(load)

const maxRevBar = computed(() => {
  if (!stats.value?.revenueByMonth?.length) return 1
  return Math.max(...stats.value.revenueByMonth.map((m: any) => m.amount), 1)
})
</script>

<template>
  <div class="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
    <div class="flex items-start justify-between">
      <div>
        <p class="font-body text-[var(--color-text-muted)] text-sm">Platform Overview</p>
        <h1 class="font-display text-3xl text-[var(--color-text)]">Admin Dashboard</h1>
      </div>
      <button @click="load" class="p-2.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
        <Icon name="heroicons:arrow-path" :class="['w-5 h-5 text-[var(--color-text-muted)]', loading ? 'animate-spin' : '']" />
      </button>
    </div>

    <!-- Crisis banner -->
    <div v-if="!loading && stats?.activeCrisisAlerts > 0"
      class="flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
      <Icon name="heroicons:exclamation-triangle" class="w-6 h-6 text-red-500 shrink-0" />
      <div class="flex-1">
        <p class="font-body font-semibold text-red-700 dark:text-red-400">
          {{ stats.activeCrisisAlerts }} active crisis alert{{ stats.activeCrisisAlerts > 1 ? 's' : '' }}
        </p>
        <p class="font-body text-xs text-red-600 dark:text-red-500">Require immediate attention</p>
      </div>
      <NuxtLink to="/admin/crisis" class="btn-danger text-sm">View alerts</NuxtLink>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card-sm">
        <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Total Users</p>
        <p class="font-display text-2xl text-[var(--color-text)]">{{ loading ? '—' : (stats?.totalUsers ?? 0).toLocaleString() }}</p>
        <p class="font-body text-xs text-forest-500 mt-1">+{{ stats?.newUsersThisMonth ?? 0 }} this month</p>
      </div>
      <div class="card-sm">
        <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Therapists</p>
        <p class="font-display text-2xl text-[var(--color-text)]">{{ loading ? '—' : (stats?.totalTherapists ?? 0) }}</p>
        <NuxtLink to="/admin/verifications" class="font-body text-xs text-terra-500 mt-1 inline-block hover:underline">
          {{ stats?.pendingVerifications ?? 0 }} pending →
        </NuxtLink>
      </div>
      <div class="card-sm">
        <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Sessions (month)</p>
        <p class="font-display text-2xl text-[var(--color-text)]">{{ loading ? '—' : (stats?.sessionsThisMonth ?? 0) }}</p>
        <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">{{ stats?.totalSessions ?? 0 }} total</p>
      </div>
      <div class="card-sm">
        <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Platform Revenue</p>
        <p class="font-display text-2xl text-forest-500">{{ loading ? '—' : formatCurrency(stats?.platformFee ?? 0) }}</p>
        <p class="font-body text-xs text-[var(--color-text-muted)] mt-1">{{ formatCurrency(stats?.totalRevenue ?? 0) }} gross</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Revenue chart -->
      <div class="lg:col-span-2 card">
        <h3 class="font-display text-lg text-[var(--color-text)] mb-4">Revenue by Month</h3>
        <SLoader v-if="loading" />
        <div v-else-if="stats?.revenueByMonth?.length" class="flex items-end gap-2 h-32">
          <div v-for="m in stats.revenueByMonth" :key="m.month"
            class="flex-1 flex flex-col items-center gap-1 group relative">
            <div :style="{ height: `${(m.amount / maxRevBar) * 112}px` }"
              class="w-full rounded-t-lg bg-forest-400 hover:bg-forest-500 transition-colors cursor-default">
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none whitespace-nowrap">
                <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 shadow-elevated text-center">
                  <p class="font-body text-xs font-semibold text-[var(--color-text)]">{{ formatCurrency(m.amount) }}</p>
                  <p class="font-body text-[10px] text-[var(--color-text-muted)]">Platform fee</p>
                </div>
              </div>
            </div>
            <p class="font-body text-[9px] text-[var(--color-text-muted)]">{{ m.month }}</p>
          </div>
        </div>
        <SEmpty v-else icon="heroicons:chart-bar" title="No revenue data" subtitle="" />
      </div>

      <!-- Quick links -->
      <div class="card space-y-3">
        <h3 class="font-display text-lg text-[var(--color-text)]">Quick Actions</h3>
        <NuxtLink v-for="link in [
          { to:'/admin/verifications', icon:'heroicons:shield-check', label:'Review verifications', sub: `${stats?.pendingVerifications ?? 0} pending`, color:'text-forest-500' },
          { to:'/admin/users', icon:'heroicons:users', label:'Manage users', sub:`${stats?.totalUsers ?? 0} total`, color:'text-[var(--color-text-muted)]' },
          { to:'/admin/payments', icon:'heroicons:banknotes', label:'Payment overview', sub:'Revenue & fees', color:'text-[var(--color-text-muted)]' },
          { to:'/admin/crisis', icon:'heroicons:exclamation-triangle', label:'Crisis monitor', sub:`${stats?.activeCrisisAlerts ?? 0} active`, color: stats?.activeCrisisAlerts ? 'text-red-500' : 'text-[var(--color-text-muted)]' },
        ]" :key="link.to" :to="link.to"
          class="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors">
          <Icon :name="link.icon" :class="['w-5 h-5 shrink-0', link.color]" />
          <div class="flex-1">
            <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ link.label }}</p>
            <p class="font-body text-xs text-[var(--color-text-muted)]">{{ link.sub }}</p>
          </div>
          <Icon name="heroicons:chevron-right" class="w-4 h-4 text-[var(--color-text-muted)]" />
        </NuxtLink>
      </div>
    </div>

    <!-- User growth -->
    <div v-if="stats?.userGrowth?.length" class="card">
      <h3 class="font-display text-lg text-[var(--color-text)] mb-4">User Growth</h3>
      <div class="flex items-end gap-3 h-24">
        <div v-for="m in stats.userGrowth" :key="m.month" class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full flex gap-0.5 items-end">
            <div :style="{ height: `${(m.clients / Math.max(...stats.userGrowth.map((g: any) => g.clients + g.therapists), 1)) * 80}px` }"
              class="flex-1 bg-forest-400 rounded-t-sm" title="Clients" />
            <div :style="{ height: `${(m.therapists / Math.max(...stats.userGrowth.map((g: any) => g.clients + g.therapists), 1)) * 80}px` }"
              class="flex-1 bg-clay-400 rounded-t-sm" title="Therapists" />
          </div>
          <p class="font-body text-[9px] text-[var(--color-text-muted)]">{{ m.month }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 mt-3">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-sm bg-forest-400" />
          <span class="font-body text-xs text-[var(--color-text-muted)]">Clients</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-sm bg-clay-400" />
          <span class="font-body text-xs text-[var(--color-text-muted)]">Therapists</span>
        </div>
      </div>
    </div>
  </div>
</template>
