<script setup lang="ts">
const props = defineProps<{ initialScore?: number | null }>()
const emit  = defineEmits(['submit', 'cancel'])

const form = reactive({
  moodScore:               props.initialScore ?? 3,
  anxietyLevel:            3,
  stressLevel:             3,
  energyLevel:             3,
  sleepQuality:            3,
  focusLevel:              3,
  notes:                   '',
  activity:                '',
  tags:                    '',
  moodType:                '',
  sleepHoursPreviousNight: null as number | null,
  stepsToday:              null as number | null,
  heartRateAtTime:         null as number | null,
})

const submitting = ref(false)

const sliders = [
  { key: 'anxietyLevel',  label: 'Anxiety',  low: 'Low', high: 'High' },
  { key: 'stressLevel',   label: 'Stress',   low: 'Low', high: 'High' },
  { key: 'energyLevel',   label: 'Energy',   low: 'Drained', high: 'Energised' },
  { key: 'sleepQuality',  label: 'Sleep',    low: 'Poor', high: 'Great' },
  { key: 'focusLevel',    label: 'Focus',    low: 'Scattered', high: 'Sharp' },
]

const activities = ['Work', 'Exercise', 'Social', 'Relaxing', 'Family', 'Outdoors', 'Reading', 'Other']
const moodTypes  = ['Anxious', 'Sad', 'Angry', 'Calm', 'Happy', 'Overwhelmed', 'Hopeful', 'Tired']

async function submit() {
  submitting.value = true
  try { emit('submit', { ...form }) } finally { submitting.value = false }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Mood score -->
    <div>
      <p class="font-body text-sm font-medium text-[var(--color-text)] mb-3">Overall mood</p>
      <div class="flex gap-3 justify-between">
        <button v-for="score in [1,2,3,4,5]" :key="score"
          @click="form.moodScore = score"
          :class="[
            'flex-1 py-3 rounded-xl border-2 transition-all text-xl',
            form.moodScore === score
              ? 'border-forest-400 bg-forest-50 dark:bg-forest-900/30 scale-105'
              : 'border-[var(--color-border)] hover:border-forest-300'
          ]">
          {{ ['😔','😕','😐','🙂','😊'][score - 1] }}
        </button>
      </div>
    </div>

    <!-- Sliders -->
    <div class="space-y-3">
      <div v-for="s in sliders" :key="s.key">
        <div class="flex justify-between mb-1">
          <label class="font-body text-xs font-medium text-[var(--color-text)]">{{ s.label }}</label>
          <span class="font-body text-xs text-[var(--color-text-muted)]">
            {{ (form as any)[s.key] }}/5
          </span>
        </div>
        <input type="range" min="1" max="5" step="1"
          v-model.number="(form as any)[s.key]"
          class="w-full accent-forest-500 cursor-pointer" />
        <div class="flex justify-between">
          <span class="font-body text-[10px] text-[var(--color-text-muted)]">{{ s.low }}</span>
          <span class="font-body text-[10px] text-[var(--color-text-muted)]">{{ s.high }}</span>
        </div>
      </div>
    </div>

    <!-- Activity tags -->
    <div>
      <p class="font-body text-sm font-medium text-[var(--color-text)] mb-2">Activity today</p>
      <div class="flex flex-wrap gap-2">
        <button v-for="act in activities" :key="act"
          @click="form.activity = form.activity === act ? '' : act"
          :class="[
            'px-3 py-1.5 rounded-full font-body text-xs transition-all border',
            form.activity === act
              ? 'bg-forest-500 text-white border-forest-500'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-forest-400'
          ]">
          {{ act }}
        </button>
      </div>
    </div>

    <!-- Mood type -->
    <div>
      <p class="font-body text-sm font-medium text-[var(--color-text)] mb-2">Feeling more specifically?</p>
      <div class="flex flex-wrap gap-2">
        <button v-for="type in moodTypes" :key="type"
          @click="form.moodType = form.moodType === type ? '' : type"
          :class="[
            'px-3 py-1.5 rounded-full font-body text-xs transition-all border',
            form.moodType === type
              ? 'bg-clay-500 text-white border-clay-500'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-clay-400'
          ]">
          {{ type }}
        </button>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label class="input-label">Notes (optional)</label>
      <textarea v-model="form.notes" class="input resize-none" rows="3"
        placeholder="Anything on your mind today?" />
    </div>

    <div class="flex gap-3 pt-2">
      <button @click="$emit('cancel')" class="btn-secondary flex-1">Cancel</button>
      <button @click="submit" :disabled="submitting" class="btn-primary flex-1">
        <span v-if="submitting" class="flex items-center justify-center gap-2">
          <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Saving...
        </span>
        <span v-else>Save check-in</span>
      </button>
    </div>
  </div>
</template>
