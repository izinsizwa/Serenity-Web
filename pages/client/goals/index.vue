<script setup lang="ts">
import { GoalCategory, GoalPriority } from '~/types'
definePageMeta({ layout: 'client', middleware: 'auth' })
const goalsApi = useGoals()

const goals          = ref<any[]>([])
const loading        = ref(true)
const showCompleted  = ref(false)
const newGoalOpen    = ref(false)
const progressModal  = ref(false)
const progressTarget = ref<any>(null)
const progressValue  = ref(0)
const progressNotes  = ref('')
const loggingProgress= ref(false)

async function load() {
  loading.value = true
  try {
    const res  = await goalsApi.getMyGoals(showCompleted.value)
    goals.value = res.data ?? []
  } finally { loading.value = false }
}

async function logProgress() {
  if (!progressTarget.value) return
  loggingProgress.value = true
  try {
    await goalsApi.logProgress(progressTarget.value.goalId, progressValue.value, undefined, progressNotes.value)
    progressModal.value = false; progressValue.value = 0; progressNotes.value = ''; load()
  } finally { loggingProgress.value = false }
}

async function markComplete(goal: any) {
  await goalsApi.markComplete(goal.goalId)
  load()
}

watch(showCompleted, load)
onMounted(load)

const categoryLabels: Record<number, string> = {
  0:'Anxiety', 1:'Depression', 2:'Stress', 3:'Relationships', 4:'Self-Esteem', 5:'Trauma', 6:'Addiction', 7:'General'
}
const priorityColors: Record<number, string> = {
  0:'badge-clay', 1:'badge-terra', 2:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}
const priorityLabels: Record<number, string> = { 0:'Low', 1:'Medium', 2:'High' }

function openProgress(goal: any) {
  progressTarget.value = goal
  progressValue.value  = goal.progressPercentage
  progressModal.value  = true
}

const activeGoals    = computed(() => goals.value.filter(g => !g.isCompleted))
const completedGoals = computed(() => goals.value.filter(g => g.isCompleted))
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <SPageHeader title="Goals" subtitle="Set and track your wellness goals">
      <template #actions>
        <button @click="newGoalOpen = true" class="btn-primary flex items-center gap-2 text-sm">
          <Icon name="heroicons:plus" class="w-4 h-4" /> New goal
        </button>
      </template>
    </SPageHeader>

    <SLoader v-if="loading" label="Loading goals..." />

    <div v-else class="space-y-6">
      <!-- Active goals -->
      <div v-if="activeGoals.length" class="space-y-4">
        <h3 class="font-display text-lg text-[var(--color-text)]">Active Goals</h3>
        <div v-for="goal in activeGoals" :key="goal.goalId" class="card space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-body font-semibold text-[var(--color-text)]">{{ goal.title }}</p>
                <span :class="['badge text-[10px]', priorityColors[goal.priority]]">
                  {{ priorityLabels[goal.priority] }}
                </span>
                <span class="badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)] text-[10px]">
                  {{ categoryLabels[goal.category] }}
                </span>
              </div>
              <p v-if="goal.description" class="font-body text-sm text-[var(--color-text-muted)] mt-1">
                {{ goal.description }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-display text-xl text-forest-500">{{ goal.progressPercentage }}%</p>
              <p class="font-body text-xs text-[var(--color-text-muted)]">complete</p>
            </div>
          </div>

          <!-- Progress bar -->
          <div>
            <div class="h-2.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-forest-400 to-forest-500 rounded-full transition-all duration-500"
                :style="{ width: `${goal.progressPercentage}%` }" />
            </div>
            <div class="flex justify-between mt-1">
              <span class="font-body text-xs text-[var(--color-text-muted)]">
                Target: {{ formatDate(goal.targetDate, { month:'short', day:'numeric', year:'numeric' }) }}
              </span>
              <span v-if="goal.isMeasurable" class="font-body text-xs text-[var(--color-text-muted)]">
                {{ goal.currentValue ?? 0 }} / {{ goal.targetValue }} {{ goal.measurementUnit }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-2 border-t border-[var(--color-border)]">
            <button @click="openProgress(goal)" class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <Icon name="heroicons:chart-bar" class="w-3.5 h-3.5" /> Log progress
            </button>
            <button @click="markComplete(goal)" class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <Icon name="heroicons:check" class="w-3.5 h-3.5" /> Mark complete
            </button>
          </div>
        </div>
      </div>

      <SEmpty v-else-if="!goals.length"
        icon="heroicons:flag"
        title="No goals yet"
        subtitle="Set your first wellness goal to start tracking your progress">
        <button @click="newGoalOpen = true" class="btn-primary mt-4 inline-flex">Create a goal</button>
      </SEmpty>

      <!-- Completed toggle -->
      <button @click="showCompleted = !showCompleted"
        class="flex items-center gap-2 font-body text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
        <Icon :name="showCompleted ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" class="w-4 h-4" />
        {{ showCompleted ? 'Hide' : 'Show' }} completed goals
        <span v-if="completedGoals.length" class="badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
          {{ completedGoals.length }}
        </span>
      </button>

      <div v-if="showCompleted && completedGoals.length" class="space-y-3">
        <div v-for="goal in completedGoals" :key="goal.goalId"
          class="card-sm flex items-center gap-4 opacity-70">
          <div class="w-10 h-10 rounded-xl bg-forest-100 dark:bg-forest-900/40 flex items-center justify-center shrink-0">
            <Icon name="heroicons:check-badge" class="w-5 h-5 text-forest-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-body font-medium text-sm text-[var(--color-text)] truncate">{{ goal.title }}</p>
            <p class="font-body text-xs text-[var(--color-text-muted)]">
              Completed {{ formatDate(goal.completedAt, { month:'short', day:'numeric', year:'numeric' }) }}
            </p>
          </div>
          <Icon name="heroicons:check" class="w-5 h-5 text-forest-500 shrink-0" />
        </div>
      </div>
    </div>

    <!-- Progress modal -->
    <SModal v-model="progressModal" title="Log progress" max-width="max-w-sm">
      <div class="space-y-4">
        <p class="font-body text-sm text-[var(--color-text-muted)]">{{ progressTarget?.title }}</p>
        <div>
          <div class="flex justify-between mb-1">
            <label class="input-label !mb-0">Progress</label>
            <span class="font-body text-sm font-medium text-forest-500">{{ progressValue }}%</span>
          </div>
          <input type="range" min="0" max="100" step="5" v-model.number="progressValue"
            class="w-full accent-forest-500 cursor-pointer" />
        </div>
        <div>
          <label class="input-label">Notes (optional)</label>
          <textarea v-model="progressNotes" class="input resize-none" rows="2"
            placeholder="What did you accomplish?" />
        </div>
        <div class="flex gap-3">
          <button @click="progressModal = false" class="btn-secondary flex-1">Cancel</button>
          <button @click="logProgress" :disabled="loggingProgress" class="btn-primary flex-1">
            <span v-if="loggingProgress" class="flex items-center justify-center gap-2">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Saving...
            </span>
            <span v-else>Save progress</span>
          </button>
        </div>
      </div>
    </SModal>

    <!-- New goal modal -->
    <SModal v-model="newGoalOpen" title="Create a new goal" max-width="max-w-lg">
      <ClientGoalForm @saved="newGoalOpen = false; load()" @cancel="newGoalOpen = false" />
    </SModal>
  </div>
</template>
