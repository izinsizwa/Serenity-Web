<template>
  <span :class="['badge', variantClass]">
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full', dotColor]" />
    <slot />
  </span>
</template>
<script setup lang="ts">
const props = defineProps<{ variant?: 'green' | 'clay' | 'terra' | 'red' | 'blue' | 'gray'; dot?: boolean }>()
const variantClass = computed(() => ({
  green: 'badge-green',
  clay:  'badge-clay',
  terra: 'badge-terra',
  red:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blue:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gray:  'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
}[props.variant ?? 'gray']))
const dotColor = computed(() => ({
  green: 'bg-green-500', clay: 'bg-clay-500', terra: 'bg-terra-400',
  red: 'bg-red-500', blue: 'bg-blue-500', gray: 'bg-warm-400',
}[props.variant ?? 'gray']))
</script>
