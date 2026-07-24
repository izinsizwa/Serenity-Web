<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
      <Icon :name="icon" class="w-8 h-8 text-[var(--color-text-muted)]" />
    </div>
    <p class="font-display text-lg text-[var(--color-text)] mb-1">{{ title }}</p>
    <p class="font-body text-sm text-[var(--color-text-muted)] max-w-xs">{{ subtitle }}</p>
    <slot />
  </div>
</template>
<script setup lang="ts">
defineProps<{ icon: string; title: string; subtitle: string }>()
</script>
