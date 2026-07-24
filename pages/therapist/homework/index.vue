<script setup lang="ts">
definePageMeta({ layout: 'therapist', middleware: 'auth' })
const homeworkApi = useTherapistHomework()

const items      = ref<any[]>([])
const loading    = ref(true)
const activeTab  = ref('pending')
const page       = ref(1)
const totalPages = ref(1)
const reviewModal= ref(false)
const reviewTarget=ref<any>(null)
const feedback   = ref('')
const rating     = ref<number|null>(null)
const submitting = ref(false)

const statusMap: Record<string, number> = { pending: 1, completed: 2, reviewed: 3 }

async function load() {
  loading.value = true
  try {
    const res = await homeworkApi.getAssignments(page.value, statusMap[activeTab.value])
    items.value = res.data?.items ?? []
    totalPages.value = res.data?.totalPages ?? 1
  } finally { loading.value = false }
}

async function submitReview() {
  if (!reviewTarget.value) return
  submitting.value = true
  try {
    await homeworkApi.reviewAssignment(reviewTarget.value.assignmentId, feedback.value, rating.value ?? undefined)
    reviewModal.value = false; feedback.value = ''; rating.value = null; load()
  } finally { submitting.value = false }
}

function openReview(hw: any) { reviewTarget.value = hw; feedback.value = hw.therapistFeedback ?? ''; rating.value = hw.rating ?? null; reviewModal.value = true }

watch([activeTab], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

const typeLabels: Record<number,string> = { 0:'Exercise',1:'Reflection',2:'Reading',3:'Practice',4:'Other' }
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <SPageHeader title="Homework" subtitle="Manage client assignments" />

    <div class="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit mb-6">
      <button v-for="tab in [{key:'pending',label:'Submitted'},{key:'completed',label:'Completed'},{key:'reviewed',label:'Reviewed'}]"
        :key="tab.key" @click="activeTab = tab.key"
        :class="['px-4 py-2 rounded-lg font-body text-sm font-medium transition-all',
          activeTab === tab.key ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-soft' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]']">
        {{ tab.label }}
      </button>
    </div>

    <SLoader v-if="loading" label="Loading assignments..." />
    <SEmpty v-else-if="!items.length"
      icon="heroicons:clipboard-document-check"
      :title="activeTab === 'pending' ? 'No submissions yet' : 'Nothing here'"
      subtitle="" />

    <div v-else class="space-y-4">
      <div v-for="hw in items" :key="hw.assignmentId" class="card hover:shadow-elevated transition-shadow">
        <div class="flex items-start gap-4">
          <SAvatar :src="hw.clientProfile?.profilePictureUrl"
            :name="`${hw.clientProfile?.firstName ?? 'C'} ${hw.clientProfile?.lastName ?? ''}`"
            size="md" color="bg-forest-500" />
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p class="font-body font-semibold text-sm text-[var(--color-text)]">{{ hw.title }}</p>
                <p class="font-body text-xs text-[var(--color-text-muted)]">
                  {{ hw.clientProfile?.firstName }} {{ hw.clientProfile?.lastName }}
                  · Due {{ formatDate(hw.dueDate, { month:'short', day:'numeric' }) }}
                  · {{ typeLabels[hw.type] }}
                </p>
              </div>
              <SBadge :variant="hw.status === 3 ? 'green' : hw.status === 2 ? 'clay' : 'terra'">
                {{ hw.status === 3 ? 'Reviewed' : hw.status === 2 ? 'Submitted' : 'Pending' }}
              </SBadge>
            </div>

            <div v-if="hw.clientResponse" class="mt-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
              <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Client response:</p>
              <p class="font-body text-sm text-[var(--color-text)] line-clamp-3">{{ hw.clientResponse }}</p>
            </div>

            <div v-if="hw.therapistFeedback" class="mt-2 p-3 rounded-xl bg-forest-50 dark:bg-forest-900/20">
              <p class="font-body text-xs text-forest-700 dark:text-forest-400 mb-1">Your feedback:</p>
              <p class="font-body text-sm text-[var(--color-text)]">{{ hw.therapistFeedback }}</p>
            </div>

            <div class="flex gap-2 mt-3">
              <button v-if="hw.status === 2"
                @click="openReview(hw)"
                class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                <Icon name="heroicons:star" class="w-3.5 h-3.5" /> Review
              </button>
              <NuxtLink :to="`/therapist/clients/${hw.clientId}`"
                class="btn-secondary text-xs py-1.5 px-3">
                View client
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      <SPagination v-model:page="page" :total-pages="totalPages" />
    </div>

    <SModal v-model="reviewModal" title="Review Assignment" max-width="max-w-lg">
      <div v-if="reviewTarget" class="space-y-4">
        <div class="p-3 rounded-xl bg-[var(--color-surface-2)]">
          <p class="font-body text-xs text-[var(--color-text-muted)] mb-1">Client's response:</p>
          <p class="font-body text-sm text-[var(--color-text)]">{{ reviewTarget.clientResponse }}</p>
        </div>
        <div>
          <label class="input-label">Your feedback</label>
          <textarea v-model="feedback" class="input resize-none" rows="4"
            placeholder="Provide feedback on this assignment..." />
        </div>
        <div>
          <label class="input-label">Rating (optional)</label>
          <SRating v-model="rating" :interactive="true" :size="6" />
        </div>
        <div class="flex gap-3">
          <button @click="reviewModal = false" class="btn-secondary flex-1">Cancel</button>
          <button @click="submitReview" :disabled="submitting || !feedback.trim()" class="btn-primary flex-1">
            <span v-if="submitting" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Submitting...
            </span>
            <span v-else>Submit review</span>
          </button>
        </div>
      </div>
    </SModal>
  </div>
</template>
