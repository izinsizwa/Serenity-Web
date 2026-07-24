<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const journalApi = useJournal()

const entries      = ref<any[]>([])
const loading      = ref(true)
const page         = ref(1)
const totalPages   = ref(1)
const newEntryOpen = ref(false)
const editEntry    = ref<any>(null)
const deleteTarget = ref<any>(null)
const deleteModal  = ref(false)
const deleting     = ref(false)

async function load() {
  loading.value = true
  try {
    const res  = await journalApi.getEntries(page.value, 12)
    entries.value    = res.data?.items ?? []
    totalPages.value = res.data?.totalPages ?? 1
  } finally { loading.value = false }
}

async function deleteEntry() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await journalApi.deleteEntry(deleteTarget.value.entryId)
    deleteModal.value = false; deleteTarget.value = null; load()
  } finally { deleting.value = false }
}

watch(page, load)
onMounted(load)

const moodEmojis: Record<number, string> = { 1:'😔',2:'😕',3:'😐',4:'🙂',5:'😊' }

function openEdit(entry: any) { editEntry.value = entry; newEntryOpen.value = true }
function closeForm() { newEntryOpen.value = false; editEntry.value = null }
async function onSaved() { closeForm(); load() }
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <SPageHeader title="Journal" subtitle="Your private space to reflect and express">
      <template #actions>
        <button @click="newEntryOpen = true" class="btn-primary flex items-center gap-2 text-sm">
          <Icon name="heroicons:plus" class="w-4 h-4" /> New entry
        </button>
      </template>
    </SPageHeader>

    <SLoader v-if="loading" label="Loading entries..." />
    <SEmpty v-else-if="!entries.length"
      icon="heroicons:book-open"
      title="Your journal is empty"
      subtitle="Start writing to track your thoughts and feelings">
      <button @click="newEntryOpen = true" class="btn-primary mt-4 inline-flex">Write first entry</button>
    </SEmpty>

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="entry in entries" :key="entry.entryId"
        class="card group cursor-pointer hover:shadow-elevated transition-all hover:-translate-y-0.5 relative">
        <!-- Actions -->
        <div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click.stop="openEdit(entry)"
            class="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-[var(--color-border)] transition-colors">
            <Icon name="heroicons:pencil" class="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          </button>
          <button @click.stop="deleteTarget = entry; deleteModal = true"
            class="w-7 h-7 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
            <Icon name="heroicons:trash" class="w-3.5 h-3.5 text-[var(--color-text-muted)] hover:text-red-500" />
          </button>
        </div>

        <div class="flex items-start gap-2 mb-2">
          <span v-if="entry.moodRating" class="text-lg">{{ moodEmojis[entry.moodRating] }}</span>
          <div class="flex-1 min-w-0">
            <p v-if="entry.title" class="font-body font-semibold text-sm text-[var(--color-text)] truncate pr-16">
              {{ entry.title }}
            </p>
            <p class="font-body text-xs text-[var(--color-text-muted)]">
              {{ formatDate(entry.entryDate, { weekday:'short', month:'short', day:'numeric', year:'numeric' }) }}
            </p>
          </div>
        </div>

        <p class="font-body text-sm text-[var(--color-text-muted)] line-clamp-3 mb-3">{{ entry.content }}</p>

        <div class="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
          <div v-if="entry.tags" class="flex flex-wrap gap-1 flex-1">
            <span v-for="tag in entry.tags.split(',').slice(0,2)" :key="tag"
              class="badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)] text-[10px]">
              #{{ tag.trim() }}
            </span>
          </div>
          <Icon v-if="entry.isSharedWithTherapist" name="heroicons:user" class="w-4 h-4 text-forest-400 ml-auto shrink-0" title="Shared with therapist" />
        </div>
      </div>
    </div>

    <SPagination v-if="!loading" v-model:page="page" :total-pages="totalPages" />

    <!-- Entry form modal -->
    <SModal v-model="newEntryOpen" :title="editEntry ? 'Edit entry' : 'New journal entry'" max-width="max-w-2xl">
      <ClientJournalEntryForm
        :entry="editEntry"
        @saved="onSaved"
        @cancel="closeForm"
      />
    </SModal>

    <!-- Delete confirm -->
    <SModal v-model="deleteModal" title="Delete entry" max-width="max-w-sm">
      <div class="space-y-4">
        <p class="font-body text-sm text-[var(--color-text-muted)]">Are you sure you want to delete this journal entry? This cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="deleteModal = false" class="btn-secondary flex-1">Cancel</button>
          <button @click="deleteEntry" :disabled="deleting" class="btn-danger flex-1">
            <span v-if="deleting" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Deleting...
            </span>
            <span v-else>Delete</span>
          </button>
        </div>
      </div>
    </SModal>
  </div>
</template>
