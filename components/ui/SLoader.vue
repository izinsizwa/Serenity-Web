<template>
  <div class="flex items-center justify-center py-12">
    <div class="flex flex-col items-center gap-3">
      <div class="w-8 h-8 rounded-full border-2 border-forest-200 border-t-forest-500 animate-spin" />
      <p v-if="label" class="font-body text-sm text-[var(--color-text-muted)]">{{ label }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ label?: string }>()
</script>
