<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const notifApi = useNotifications()
const items      = ref<any[]>([])
const loading    = ref(true)
const page       = ref(1)
const totalPages = ref(1)
const markingAll = ref(false)
async function load() {
  loading.value = true
  try {
    const res = await notifApi.getNotifications(false, page.value)
    items.value = res.data?.items ?? []; totalPages.value = res.data?.totalPages ?? 1
  } finally { loading.value = false }
}
async function markRead(id: string) {
  await notifApi.markAsRead(id)
  const n = items.value.find(i => i.notificationId === id)
  if (n) n.isRead = true
}
async function markAll() {
  markingAll.value = true
  try { await notifApi.markAllAsRead(); load() } finally { markingAll.value = false }
}
watch(page, load)
onMounted(load)
const priorityIcons: Record<number,string> = { 0:'heroicons:bell',1:'heroicons:bell',2:'heroicons:bell-alert',3:'heroicons:exclamation-triangle' }
const priorityColors: Record<number,string> = { 0:'text-[var(--color-text-muted)]',1:'text-[var(--color-text-muted)]',2:'text-terra-400',3:'text-red-500' }
</script>
<template>
  <div class="p-6 lg:p-8 max-w-2xl mx-auto">
    <SPageHeader title="Notifications">
      <template #actions>
        <button v-if="items.some(n => !n.isRead)" @click="markAll" :disabled="markingAll" class="btn-secondary text-sm">
          Mark all as read
        </button>
      </template>
    </SPageHeader>
    <SLoader v-if="loading" label="Loading notifications..." />
    <SEmpty v-else-if="!items.length" icon="heroicons:bell" title="No notifications" subtitle="You're all caught up" />
    <div v-else class="space-y-2">
      <div v-for="n in items" :key="n.notificationId"
        :class="['flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-soft',
          n.isRead ? 'border-[var(--color-border)] bg-[var(--color-surface)]' : 'border-forest-200 dark:border-forest-800 bg-forest-50 dark:bg-forest-900/20']"
        @click="!n.isRead && markRead(n.notificationId)">
        <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', n.isRead ? 'bg-[var(--color-surface-2)]' : 'bg-forest-100 dark:bg-forest-900/40']">
          <Icon :name="priorityIcons[n.priority]" :class="['w-5 h-5', n.isRead ? 'text-[var(--color-text-muted)]' : priorityColors[n.priority]]" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <p :class="['font-body text-sm', n.isRead ? 'text-[var(--color-text-muted)]' : 'font-semibold text-[var(--color-text)]']">{{ n.title }}</p>
            <p class="font-body text-xs text-[var(--color-text-muted)] shrink-0">{{ formatRelativeTime(n.createdAt) }}</p>
          </div>
          <p class="font-body text-sm text-[var(--color-text-muted)] mt-0.5">{{ n.message }}</p>
          <NuxtLink v-if="n.actionUrl && n.actionText" :to="n.actionUrl" class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors mt-1 inline-block">
            {{ n.actionText }} →
          </NuxtLink>
        </div>
        <div v-if="!n.isRead" class="w-2 h-2 rounded-full bg-forest-500 shrink-0 mt-1.5" />
      </div>
      <SPagination v-model:page="page" :total-pages="totalPages" />
    </div>
  </div>
</template>
