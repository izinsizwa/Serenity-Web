<script setup lang="ts">
import { UserRole } from '~/types'
definePageMeta({ layout: 'admin', middleware: 'auth' })
const adminUsers = useAdminUsers()

const items      = ref<any[]>([])
const loading    = ref(true)
const search     = ref('')
const roleFilter = ref<number | null>(null)
const page       = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const toggleTarget = ref<any>(null)
const toggleModal  = ref(false)
const toggling     = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await adminUsers.getUsers(page.value, 20, search.value || undefined, roleFilter.value ?? undefined)
    items.value      = res.items ?? []
    totalPages.value = res.totalPages ?? 1
    totalCount.value = res.totalCount ?? 0
  } finally { loading.value = false }
}

async function confirmToggle() {
  if (!toggleTarget.value) return
  toggling.value = true
  try {
    await adminUsers.toggleActive(toggleTarget.value.userId, !toggleTarget.value.isActive)
    toggleTarget.value.isActive = !toggleTarget.value.isActive
    toggleModal.value = false
  } finally { toggling.value = false }
}

const roleLabels: Record<number,string> = { 0:'Client', 1:'Therapist', 2:'Admin', 3:'Super Admin' }
const roleVariants: Record<number,any>  = { 0:'green', 1:'clay', 2:'red', 3:'red' }

const debouncedSearch = useDebounceFn(() => { page.value = 1; load() }, 400)
watch(search, debouncedSearch)
watch([roleFilter], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-6xl mx-auto">
    <SPageHeader title="Users" :subtitle="`${totalCount.toLocaleString()} total users`" />

    <div class="flex gap-3 mb-6 flex-wrap">
      <div class="relative flex-1 min-w-48">
        <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
        <input v-model="search" type="text" class="input pl-10" placeholder="Search by name or email..." />
      </div>
      <select v-model.number="roleFilter" class="input w-44">
        <option :value="null">All roles</option>
        <option v-for="(label, val) in roleLabels" :key="val" :value="Number(val)">{{ label }}</option>
      </select>
    </div>

    <SLoader v-if="loading" label="Loading users..." />
    <SEmpty v-else-if="!items.length" icon="heroicons:users" title="No users found" subtitle="" />

    <div v-else class="card overflow-hidden p-0">
      <table class="w-full">
        <thead>
          <tr class="border-b border-[var(--color-border)]">
            <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">User</th>
            <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Role</th>
            <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium hidden md:table-cell">Joined</th>
            <th class="text-left px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Status</th>
            <th class="text-right px-4 py-3 font-body text-xs text-[var(--color-text-muted)] font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in items" :key="user.userId"
            class="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <SAvatar :src="user.profilePictureUrl" :name="`${user.firstName ?? ''} ${user.lastName ?? ''}`"
                  size="sm" :color="user.role === 3 ? 'bg-clay-500' : 'bg-forest-500'" />
                <div class="min-w-0">
                  <p class="font-body text-sm font-medium text-[var(--color-text)] truncate">{{ user.firstName }} {{ user.lastName }}</p>
                  <p class="font-body text-xs text-[var(--color-text-muted)] truncate">{{ user.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell">
              <SBadge :variant="roleVariants[user.role] ?? 'gray'">{{ roleLabels[user.role] ?? 'Unknown' }}</SBadge>
            </td>
            <td class="px-4 py-3 font-body text-sm text-[var(--color-text-muted)] hidden md:table-cell">
              {{ formatDate(user.createdAt, { month:'short', day:'numeric', year:'numeric' }) }}
            </td>
            <td class="px-4 py-3">
              <SBadge :variant="user.isActive ? 'green' : 'red'">{{ user.isActive ? 'Active' : 'Disabled' }}</SBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <button @click="toggleTarget = user; toggleModal = true"
                :class="['font-body text-xs transition-colors', user.isActive ? 'text-red-500 hover:text-red-600' : 'text-forest-500 hover:text-forest-600']">
                {{ user.isActive ? 'Disable' : 'Enable' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <SPagination v-if="!loading" v-model:page="page" :total-pages="totalPages" />

    <SModal v-model="toggleModal" :title="toggleTarget?.isActive ? 'Disable user?' : 'Enable user?'" max-width="max-w-sm">
      <div class="space-y-4">
        <p class="font-body text-sm text-[var(--color-text-muted)]">
          {{ toggleTarget?.isActive ? 'This will prevent the user from logging in.' : 'This will restore the user\'s access.' }}
        </p>
        <div class="flex gap-3">
          <button @click="toggleModal = false" class="btn-secondary flex-1">Cancel</button>
          <button @click="confirmToggle" :disabled="toggling" :class="['flex-1', toggleTarget?.isActive ? 'btn-danger' : 'btn-primary']">
            <span v-if="toggling" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            </span>
            <span v-else>{{ toggleTarget?.isActive ? 'Disable' : 'Enable' }}</span>
          </button>
        </div>
      </div>
    </SModal>
  </div>
</template>
