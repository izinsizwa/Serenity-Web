<script setup lang="ts">
import { HomeworkStatus } from '~/types'
definePageMeta({ layout: 'client', middleware: 'auth' })
const homeworkApi = useHomework()

const items      = ref<any[]>([])
const loading    = ref(true)
const activeTab  = ref<string>('pending')
const page       = ref(1)
const totalPages = ref(1)

async function load() {
  loading.value = true
  try {
    const statusMap: Record<string, HomeworkStatus | undefined> = {
      pending:   HomeworkStatus.Assigned,
      completed: HomeworkStatus.Completed,
      reviewed:  HomeworkStatus.Reviewed,
    }
    const res = await homeworkApi.getMyAssignments(statusMap[activeTab.value])
    items.value      = res.data?.items ?? []
    totalPages.value = res.data?.totalPages ?? 1
  } finally { loading.value = false }
}

watch([activeTab], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

const statusIcons: Record<number, string> = {
  0: 'heroicons:clipboard',
  1: 'heroicons:arrow-path',
  2: 'heroicons:check-circle',
  3: 'heroicons:star',
  4: 'heroicons:exclamation-circle',
}
const statusColors: Record<number, string> = {
  0: 'text-[var(--color-text-muted)]',
  1: 'text-blue-500',
  2: 'text-forest-500',
  3: 'text-amber-500',
  4: 'text-red-500',
}
const typeLabels: Record<number, string> = {
  0: 'Exercise', 1: 'Reflection', 2: 'Reading', 3: 'Practice', 4: 'Other'
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date() && activeTab.value === 'pending'
}
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <SPageHeader title="Homework" subtitle="Assignments from your therapist" />

    <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit mb-6">
      <button v-for="tab in [{key:'pending',label:'Pending'},{key:'completed',label:'Completed'},{key:'reviewed',label:'Reviewed'}]"
        :key="tab.key" @click="activeTab = tab.key"
        :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
          activeTab === tab.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
        {{ tab.label }}
      </button>
    </div>

    <SLoader v-if="loading" label="Loading assignments..." />
    <SEmpty v-else-if="!items.length"
      icon="heroicons:clipboard-document-check"
      :title="activeTab === 'pending' ? 'No pending assignments' : 'Nothing here yet'"
      :subtitle="activeTab === 'pending' ? 'Your therapist will assign homework after your sessions' : ''" />

    <div v-else class="space-y-4">
      <NuxtLink v-for="hw in items" :key="hw.assignmentId"
        :to="`/client/homework/${hw.assignmentId}`"
        :class="['card block hover:shadow-elevated transition-all',
          isOverdue(hw.dueDate) ? 'border-red-300 dark:border-red-800' : '']">
        <div class="flex items-start gap-4">
          <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            isOverdue(hw.dueDate)
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-[var(--color-surface-2)]']">
            <Icon :name="statusIcons[hw.status]" :class="['w-5 h-5', isOverdue(hw.dueDate) ? 'text-red-500' : statusColors[hw.status]]" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <p class="font-body font-semibold text-[var(--color-text)]">{{ hw.title }}</p>
              <span :class="['badge shrink-0 text-[10px]',
                isOverdue(hw.dueDate) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                hw.status === 2 ? 'badge-green' : hw.status === 3 ? 'badge-clay' : 'badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)]']">
                {{ isOverdue(hw.dueDate) ? 'Overdue' : hw.status === 2 ? 'Completed' : hw.status === 3 ? 'Reviewed' : 'Pending' }}
              </span>
            </div>
            <p class="font-body text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">{{ hw.description }}</p>
            <div class="flex items-center gap-3 mt-2">
              <span class="badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)] text-[10px]">{{ typeLabels[hw.type] }}</span>
              <span class="font-body text-xs text-[var(--color-text-muted)]">
                Due {{ formatDate(hw.dueDate, { weekday:'short', month:'short', day:'numeric' }) }}
              </span>
            </div>
            <div v-if="hw.therapistFeedback" class="mt-2 p-2 rounded-lg bg-forest-50 dark:bg-forest-900/20">
              <p class="font-body text-xs text-forest-700 dark:text-forest-300">
                <strong>Feedback:</strong> {{ hw.therapistFeedback }}
              </p>
            </div>
          </div>
        </div>
      </NuxtLink>
      <SPagination v-model:page="page" :total-pages="totalPages" />
    </div>
  </div>
</template>
