<script setup lang="ts">
import { GoalCategory, GoalPriority } from '~/types'
const emit    = defineEmits(['saved','cancel'])
const goalsApi= useGoals()

const form = reactive({
  title:           '',
  description:     '',
  category:        GoalCategory.General as GoalCategory,
  priority:        GoalPriority.Medium as GoalPriority,
  targetDate:      '',
  isMeasurable:    false,
  measurementUnit: '',
  targetValue:     null as number|null,
  notes:           '',
})
const saving = ref(false)
const error  = ref('')

async function save() {
  if (!form.title.trim() || !form.targetDate) { error.value = 'Title and target date are required'; return }
  saving.value = true; error.value = ''
  try {
    await goalsApi.createGoal(form)
    emit('saved')
  } catch (e: any) { error.value = e.message }
  finally { saving.value = false }
}

const categories = Object.entries(GoalCategory)
  .filter(([, v]) => typeof v === 'number')
  .map(([k, v]) => ({ label: k.replace(/([A-Z])/g, ' $1').trim(), value: v as number }))

const priorities = [{ label:'Low', value: GoalPriority.Low }, { label:'Medium', value: GoalPriority.Medium }, { label:'High', value: GoalPriority.High }]
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="input-label">Goal title <span class="text-red-400">*</span></label>
      <input v-model="form.title" type="text" class="input" placeholder="e.g. Manage anxiety in social situations" />
    </div>
    <div>
      <label class="input-label">Description</label>
      <textarea v-model="form.description" class="input resize-none" rows="2"
        placeholder="Describe what achieving this goal looks like..." />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="input-label">Category</label>
        <select v-model.number="form.category" class="input">
          <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <div>
        <label class="input-label">Priority</label>
        <select v-model.number="form.priority" class="input">
          <option v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>
    </div>
    <div>
      <label class="input-label">Target date <span class="text-red-400">*</span></label>
      <input v-model="form.targetDate" type="date" class="input" :min="new Date().toISOString().split('T')[0]" />
    </div>
    <label class="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" v-model="form.isMeasurable" class="rounded accent-forest-500" />
      <span class="font-body text-sm text-[var(--color-text)]">This goal is measurable</span>
    </label>
    <div v-if="form.isMeasurable" class="grid grid-cols-2 gap-4">
      <div>
        <label class="input-label">Target value</label>
        <input v-model.number="form.targetValue" type="number" class="input" placeholder="e.g. 10" />
      </div>
      <div>
        <label class="input-label">Unit</label>
        <input v-model="form.measurementUnit" type="text" class="input" placeholder="e.g. sessions, days" />
      </div>
    </div>
    <SError v-if="error" :message="error" />
    <div class="flex gap-3">
      <button @click="$emit('cancel')" class="btn-secondary flex-1">Cancel</button>
      <button @click="save" :disabled="saving" class="btn-primary flex-1">
        <span v-if="saving" class="flex items-center justify-center gap-2">
          <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Creating...
        </span>
        <span v-else>Create goal</span>
      </button>
    </div>
  </div>
</template>
