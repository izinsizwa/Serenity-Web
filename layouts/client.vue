<script setup lang="ts">
const auth        = useAuthStore()
const colorMode   = useColorMode()
const sidebarOpen = ref(false)
const route       = useRoute()

const navItems = [
  { label: 'Home',         icon: 'heroicons:home',                    to: '/client/dashboard' },
  { label: 'Therapists',   icon: 'heroicons:user-group',              to: '/client/therapists' },
  { label: 'Appointments', icon: 'heroicons:calendar',                to: '/client/appointments' },
  { label: 'Mood',         icon: 'heroicons:heart',                   to: '/client/mood' },
  { label: 'Journal',      icon: 'heroicons:book-open',               to: '/client/journal' },
  { label: 'Goals',        icon: 'heroicons:flag',                    to: '/client/goals' },
  { label: 'Messages',     icon: 'heroicons:chat-bubble-left-right',  to: '/client/messages' },
  { label: 'Homework',     icon: 'heroicons:clipboard-document-list', to: '/client/homework' },
  { label: 'Medical Aid',  icon: 'heroicons:shield-check',            to: '/client/medical-aid' },
]

const isActive = (to: string) => route.path.startsWith(to)
</script>

<template>
  <div class="flex h-screen bg-serenity overflow-hidden">
    <aside :class="[
      'fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-transform duration-300',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]">
      <div class="flex items-center px-5 py-5 border-b border-[var(--color-border)]">
        <SLogo size="sm" />
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
        <button class="nav-link w-full"
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'">
          <Icon :name="colorMode.value === 'dark' ? 'heroicons:sun' : 'heroicons:moon'" class="w-5 h-5" />
          {{ colorMode.value === 'dark' ? 'Light mode' : 'Dark mode' }}
        </button>
        <NuxtLink to="/client/profile" :class="isActive('/client/profile') ? 'nav-link-active' : 'nav-link'">
          <Icon name="heroicons:cog-6-tooth" class="w-5 h-5" />
          Settings
        </NuxtLink>
        <div class="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-[var(--color-surface-2)]">
          <SAvatar :src="auth.user?.profilePictureUrl" :name="auth.fullName" size="sm" color="bg-forest-500" />
          <div class="flex-1 min-w-0">
            <p class="font-body text-sm font-medium text-[var(--color-text)] truncate">{{ auth.fullName }}</p>
            <p class="font-body text-xs text-[var(--color-text-muted)]">Client</p>
          </div>
          <button @click="auth.logout()" class="text-[var(--color-text-muted)] hover:text-red-500 transition-colors" title="Sign out">
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
        <NuxtLink to="/client/notifications" class="relative">
          <Icon name="heroicons:bell" class="w-6 h-6 text-[var(--color-text-muted)]" />
        </NuxtLink>
      </header>
      <main class="flex-1 overflow-y-auto"><slot /></main>
    </div>
  </div>
</template>
