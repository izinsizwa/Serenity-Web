<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const route       = useRoute()
const homeworkApi = useHomework()
const id          = route.params.id as string

const hw        = ref<any>(null)
const loading   = ref(true)
const response  = ref('')
const submitting= ref(false)
const submitted = ref(false)
const error     = ref('')

async function load() {
  loading.value = true
  try {
    const res = await homeworkApi.getAssignmentById(id)
    hw.value       = res.data
    response.value = res.data?.clientResponse ?? ''
    if (res.data?.status >= 2) submitted.value = true
  } catch (e: any) { error.value = e.message }
  finally { loading.value = false }
}

async function submit() {
  if (!response.value.trim()) return
  submitting.value = true; error.value = ''
  try {
    await homeworkApi.submitResponse(id, response.value)
    submitted.value = true; load()
  } catch (e: any) { error.value = e.message }
  finally { submitting.value = false }
}

const typeLabels: Record<number, string> = { 0:'Exercise', 1:'Reflection', 2:'Reading', 3:'Practice', 4:'Other' }
onMounted(load)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-2xl mx-auto">
    <SPageHeader title="Assignment" back="/client/homework" back-label="Homework" />
    <SLoader v-if="loading" />
    <SError v-else-if="error" :message="error" />
    <div v-else-if="hw" class="space-y-6">
      <div class="card space-y-3">
        <div class="flex items-start justify-between gap-3">
          <h2 class="font-display text-2xl text-[var(--color-text)]">{{ hw.title }}</h2>
          <span class="badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)] text-[10px] shrink-0">{{ typeLabels[hw.type] }}</span>
        </div>
        <p class="font-body text-sm text-[var(--color-text-muted)]">
          Due {{ formatDate(hw.dueDate, { weekday:'long', month:'long', day:'numeric' }) }}
        </p>
        <div class="divider" />
        <p class="font-body text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{{ hw.description }}</p>
      </div>

      <!-- Response area -->
      <div class="card space-y-4">
        <h3 class="font-display text-lg text-[var(--color-text)]">Your Response</h3>
        <div v-if="submitted && hw.status >= 2" class="space-y-3">
          <div class="p-4 rounded-xl bg-[var(--color-surface-2)]">
            <p class="font-body text-sm text-[var(--color-text)] whitespace-pre-wrap">{{ hw.clientResponse }}</p>
          </div>
          <div v-if="hw.therapistFeedback" class="p-4 rounded-xl bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800">
            <p class="font-body text-xs font-semibold text-forest-700 dark:text-forest-400 mb-1">Therapist Feedback</p>
            <p class="font-body text-sm text-[var(--color-text)]">{{ hw.therapistFeedback }}</p>
            <div v-if="hw.rating" class="mt-2">
              <SRating :model-value="hw.rating" :size="4" />
            </div>
          </div>
          <div v-else class="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface-2)]">
            <Icon name="heroicons:clock" class="w-4 h-4 text-[var(--color-text-muted)]" />
            <p class="font-body text-sm text-[var(--color-text-muted)]">Awaiting therapist feedback...</p>
          </div>
        </div>
        <div v-else class="space-y-3">
          <textarea v-model="response" class="input resize-none" rows="6"
            placeholder="Write your response here..." />
          <SError v-if="error" :message="error" />
          <button @click="submit" :disabled="submitting || !response.trim()" class="btn-primary w-full">
            <span v-if="submitting" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Submitting...
            </span>
            <span v-else>Submit response</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
