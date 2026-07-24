<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const verifApi = useAdminVerifications()

const items      = ref<any[]>([])
const loading    = ref(true)
const page       = ref(1)
const totalPages = ref(1)
const actionModal = ref(false)
const actionType  = ref<'approve'|'reject'>('approve')
const actionTarget= ref<any>(null)
const actionNotes = ref('')
const actioning   = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await verifApi.getPendingVerifications(page.value)
    items.value      = res.data?.items ?? []
    totalPages.value = res.data?.totalPages ?? 1
  } finally { loading.value = false }
}

function openAction(therapist: any, type: 'approve'|'reject') {
  actionTarget.value = therapist; actionType.value = type; actionNotes.value = ''; actionModal.value = true
}

async function confirmAction() {
  if (!actionTarget.value) return
  actioning.value = true
  try {
    if (actionType.value === 'approve') {
      await verifApi.approveTherapist(actionTarget.value.therapistId, actionNotes.value)
    } else {
      if (!actionNotes.value.trim()) return
      await verifApi.rejectTherapist(actionTarget.value.therapistId, actionNotes.value)
    }
    actionModal.value = false; load()
  } finally { actioning.value = false }
}

watch(page, load)
onMounted(load)
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <SPageHeader title="Therapist Verifications" subtitle="Review and approve therapist registrations" />
    <SLoader v-if="loading" label="Loading pending verifications..." />
    <SEmpty v-else-if="!items.length"
      icon="heroicons:shield-check" title="No pending verifications"
      subtitle="All therapist applications have been reviewed" />

    <div v-else class="space-y-4">
      <div v-for="t in items" :key="t.therapistId" class="card space-y-4">
        <div class="flex items-start gap-4">
          <SAvatar :src="t.profilePictureUrl" :name="`${t.firstName ?? ''} ${t.lastName ?? ''}`"
            size="lg" color="bg-clay-500" />
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p class="font-body font-semibold text-[var(--color-text)]">{{ t.firstName }} {{ t.lastName }}</p>
                <p class="font-body text-sm text-[var(--color-text-muted)]">{{ t.qualification }}</p>
                <p class="font-body text-xs text-[var(--color-text-muted)]">{{ t.email }}</p>
              </div>
              <SBadge variant="terra">Pending Review</SBadge>
            </div>
            <div class="grid sm:grid-cols-3 gap-3 mt-3">
              <div class="p-2 rounded-lg bg-[var(--color-surface-2)]">
                <p class="font-body text-xs text-[var(--color-text-muted)]">HPCSA Number</p>
                <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ t.hpcsaNumber ?? '—' }}</p>
              </div>
              <div class="p-2 rounded-lg bg-[var(--color-surface-2)]">
                <p class="font-body text-xs text-[var(--color-text-muted)]">Experience</p>
                <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ t.yearsOfExperience }}y</p>
              </div>
              <div class="p-2 rounded-lg bg-[var(--color-surface-2)]">
                <p class="font-body text-xs text-[var(--color-text-muted)]">Fee</p>
                <p class="font-body text-sm font-medium text-[var(--color-text)]">{{ formatCurrency(t.consultationFee) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Documents -->
        <div v-if="t.documents?.length" class="space-y-2">
          <p class="font-body text-xs font-medium text-[var(--color-text-muted)]">Submitted documents</p>
          <div class="flex flex-wrap gap-2">
            <a v-for="doc in t.documents" :key="doc.documentId"
              :href="doc.documentUrl" target="_blank"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors">
              <Icon name="heroicons:document-text" class="w-4 h-4 text-[var(--color-text-muted)]" />
              <span class="font-body text-xs text-[var(--color-text)]">{{ doc.documentName }}</span>
              <Icon name="heroicons:arrow-top-right-on-square" class="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            </a>
          </div>
        </div>

        <div class="flex gap-3 pt-2 border-t border-[var(--color-border)]">
          <button @click="openAction(t, 'approve')" class="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
            <Icon name="heroicons:check" class="w-4 h-4" /> Approve
          </button>
          <button @click="openAction(t, 'reject')" class="btn-danger flex-1 flex items-center justify-center gap-2 text-sm">
            <Icon name="heroicons:x-mark" class="w-4 h-4" /> Reject
          </button>
        </div>
      </div>
      <SPagination v-model:page="page" :total-pages="totalPages" />
    </div>

    <SModal v-model="actionModal"
      :title="actionType === 'approve' ? 'Approve Therapist' : 'Reject Application'"
      max-width="max-w-md">
      <div class="space-y-4">
        <p class="font-body text-sm text-[var(--color-text-muted)]">
          {{ actionType === 'approve'
            ? `Approve ${actionTarget?.firstName} ${actionTarget?.lastName} as a verified therapist on Serenity?`
            : 'Please provide a reason for rejecting this application.' }}
        </p>
        <div>
          <label class="input-label">{{ actionType === 'approve' ? 'Notes (optional)' : 'Rejection reason *' }}</label>
          <textarea v-model="actionNotes" class="input resize-none" rows="3"
            :placeholder="actionType === 'approve' ? 'Any notes for the therapist...' : 'Explain why the application was rejected...'" />
        </div>
        <div class="flex gap-3">
          <button @click="actionModal = false" class="btn-secondary flex-1">Cancel</button>
          <button @click="confirmAction"
            :disabled="actioning || (actionType === 'reject' && !actionNotes.trim())"
            :class="['flex-1', actionType === 'approve' ? 'btn-primary' : 'btn-danger']">
            <span v-if="actioning" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            </span>
            <span v-else>{{ actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection' }}</span>
          </button>
        </div>
      </div>
    </SModal>
  </div>
</template>
