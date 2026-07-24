<script setup lang="ts">
const auth        = useAuthStore()
const colorMode   = useColorMode()
const sidebarOpen = ref(false)
const route       = useRoute()
const profileApi  = useTherapistProfile()
const isAvailable = ref(true)

const navItems = [
  { label: 'Dashboard',    icon: 'heroicons:squares-2x2',             to: '/therapist/dashboard' },
  { label: 'Clients',      icon: 'heroicons:users',                   to: '/therapist/clients' },
  { label: 'Calendar',     icon: 'heroicons:calendar-days',           to: '/therapist/calendar' },
  { label: 'Sessions',     icon: 'heroicons:video-camera',            to: '/therapist/sessions' },
  { label: 'Homework',     icon: 'heroicons:clipboard-document-list', to: '/therapist/homework' },
  { label: 'Messages',     icon: 'heroicons:chat-bubble-left-right',  to: '/therapist/messages' },
  { label: 'Earnings',     icon: 'heroicons:banknotes',               to: '/therapist/earnings' },
]

const isActive = (to: string) => route.path.startsWith(to)

async function toggleAvailability() {
  isAvailable.value = !isAvailable.value
  await profileApi.toggleAvailability(isAvailable.value)
}
</script>

<template>
  <div class="flex h-screen bg-serenity overflow-hidden">
    <aside :class="[
      'fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-transform duration-300',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]">
      <div class="px-5 py-5 border-b border-[var(--color-border)]">
        <SLogo size="sm" />
        <span class="mt-1.5 inline-block badge bg-clay-100 text-clay-700 dark:bg-clay-900/40 dark:text-clay-300 text-[10px]">
          Therapist Portal
        </span>
      </div>
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
          :class="isActive(item.to) ? 'nav-link-active' : 'nav-link'"
          @click="sidebarOpen = false">
          <Icon :name="item.icon" class="w-5 h-5 shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="px-3 py-4 border-t border-[var(--color-border)] space-y-0.5">
        <button @click="toggleAvailability"
          :class="['nav-link w-full', isAvailable ? 'text-forest-600 dark:text-forest-400' : 'text-[var(--color-text-muted)]']">
          <span :class="['w-2 h-2 rounded-full shrink-0', isAvailable ? 'bg-green-400' : 'bg-warm-400']" />
          {{ isAvailable ? 'Available' : 'Unavailable' }}
        </button>
        <button class="nav-link w-full"
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'">
          <Icon :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'" class="w-5 h-5" />
          {{ colorMode.value === 'dark' ? 'Light mode' : 'Dark mode' }}
        </button>
        <NuxtLink to="/therapist/profile" :class="isActive('/therapist/profile') ? 'nav-link-active' : 'nav-link'">
          <Icon name="heroicons:cog-6-tooth" class="w-5 h-5" />
          Settings
        </NuxtLink>
        <div class="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-[var(--color-surface-2)]">
          <SAvatar :src="auth.user?.profilePictureUrl" :name="auth.fullName" size="sm" color="bg-clay-500" />
          <div class="flex-1 min-w-0">
            <p class="font-body text-sm font-medium text-[var(--color-text)] truncate">{{ auth.fullName }}</p>
            <p class="font-body text-xs text-[var(--color-text-muted)]">Therapist</p>
          </div>
          <button @click="auth.logout()" class="text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
            <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    <div v-if="sidebarOpen" class="fixed inset-0 z-40 bg-black/40 lg:hidden" @click="sidebarOpen = false" />
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden">
        <button @click="sidebarOpen = true">
          <Icon name="heroicons:bars-3" class="w-6 h-6 text-[var(--color-text-muted)]" />
        </button>
        <SLogo size="sm" />
        <div class="w-6" />
      </header>
      <main class="flex-1 overflow-y-auto"><slot /></main>
    </div>
  </div>
</template>
