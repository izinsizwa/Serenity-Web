<script setup lang="ts">
const props = defineProps<{ entry?: any }>()
const emit  = defineEmits(['saved', 'cancel'])
const journalApi = useJournal()

const form = reactive({
  title:                 props.entry?.title ?? '',
  content:               props.entry?.content ?? '',
  moodRating:            props.entry?.moodRating ?? null as number|null,
  mood:                  props.entry?.mood ?? '',
  tags:                  props.entry?.tags ?? '',
  isSharedWithTherapist: props.entry?.isSharedWithTherapist ?? false,
  entryDate:             props.entry?.entryDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
})

const saving = ref(false)
const error  = ref('')

async function save() {
  if (!form.content.trim()) { error.value = 'Content is required'; return }
  saving.value = true; error.value = ''
  try {
    if (props.entry) {
      await journalApi.updateEntry(props.entry.entryId, form)
    } else {
      await journalApi.createEntry(form)
    }
    emit('saved')
  } catch (e: any) { error.value = e.message }
  finally { saving.value = false }
}

const moodOptions = [
  { value: 1, emoji: '😔', label: 'Very Low' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="input-label">Title (optional)</label>
      <input v-model="form.title" type="text" class="input" placeholder="Give your entry a title..." />
    </div>

    <div>
      <label class="input-label">Date</label>
      <input v-model="form.entryDate" type="date" class="input" />
    </div>

    <div>
      <label class="input-label">How are you feeling?</label>
      <div class="flex gap-2">
        <button v-for="m in moodOptions" :key="m.value"
          @click="form.moodRating = form.moodRating === m.value ? null : m.value"
          :class="['flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all',
            form.moodRating === m.value
              ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/30'
              : 'border-[var(--color-border)] hover:border-forest-300']">
          <span class="text-xl">{{ m.emoji }}</span>
          <span class="font-body text-[10px] text-[var(--color-text-muted)]">{{ m.label }}</span>
        </button>
      </div>
    </div>

    <div>
      <label class="input-label">
        Your thoughts <span class="text-red-400">*</span>
      </label>
      <textarea v-model="form.content" class="input resize-none" rows="6"
        placeholder="What's on your mind today? This is your private space..." />
    </div>

    <div>
      <label class="input-label">Tags (comma separated)</label>
      <input v-model="form.tags" type="text" class="input" placeholder="anxiety, work, sleep, gratitude..." />
    </div>

    <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
      <input type="checkbox" v-model="form.isSharedWithTherapist" class="rounded accent-forest-500 w-4 h-4" />
      <div>
        <p class="font-body text-sm font-medium text-[var(--color-text)]">Share with my therapist</p>
        <p class="font-body text-xs text-[var(--color-text-muted)]">Your therapist will be able to see this entry</p>
      </div>
    </label>

    <SError v-if="error" :message="error" />

    <div class="flex gap-3 pt-2">
      <button @click="$emit('cancel')" class="btn-secondary flex-1">Cancel</button>
      <button @click="save" :disabled="saving" class="btn-primary flex-1">
        <span v-if="saving" class="flex items-center justify-center gap-2">
          <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Saving...
        </span>
        <span v-else>{{ entry ? 'Update entry' : 'Save entry' }}</span>
      </button>
    </div>
  </div>
</template>
