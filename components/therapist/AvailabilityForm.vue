<script setup lang="ts">
const props = defineProps<{ initial?: any[] }>()
const emit  = defineEmits(['saved','cancel'])
const calendarApi = useTherapistCalendar()

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const slots = reactive(days.map((day, i) => {
  const existing = props.initial?.find(a => a.dayOfWeek === i + 1)
  return {
    dayOfWeek:   i + 1,
    day,
    isAvailable: existing?.isAvailable ?? (i < 5),
    startTime:   existing?.startTime?.slice(0,5) ?? '08:00',
    endTime:     existing?.endTime?.slice(0,5) ?? '17:00',
  }
}))

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    await calendarApi.updateAvailability(slots)
    emit('saved')
  } finally { saving.value = false }
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="slot in slots" :key="slot.dayOfWeek" class="flex items-center gap-3">
      <label class="flex items-center gap-2 w-28 cursor-pointer">
        <input type="checkbox" v-model="slot.isAvailable" class="rounded accent-forest-500" />
        <span class="font-body text-sm text-[var(--color-text)]">{{ slot.day.slice(0,3) }}</span>
      </label>
      <template v-if="slot.isAvailable">
        <input type="time" v-model="slot.startTime" class="input py-1.5 text-sm flex-1" />
        <span class="font-body text-xs text-[var(--color-text-muted)]">to</span>
        <input type="time" v-model="slot.endTime" class="input py-1.5 text-sm flex-1" />
      </template>
      <div v-else class="flex-1">
        <p class="font-body text-xs text-[var(--color-text-muted)]">Unavailable</p>
      </div>
    </div>
    <div class="flex gap-3 pt-2">
      <button @click="$emit('cancel')" class="btn-secondary flex-1">Cancel</button>
      <button @click="save" :disabled="saving" class="btn-primary flex-1">
        <span v-if="saving" class="flex items-center justify-center gap-2">
          <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Saving...
        </span>
        <span v-else>Save availability</span>
      </button>
    </div>
  </div>
</template>
