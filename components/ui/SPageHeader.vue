<template>
  <div class="flex items-start justify-between mb-6">
    <div>
      <div v-if="back" class="flex items-center gap-1 mb-2">
        <NuxtLink :to="back" class="flex items-center gap-1 font-body text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          {{ backLabel || 'Back' }}
        </NuxtLink>
      </div>
      <h1 class="font-display text-2xl lg:text-3xl text-[var(--color-text)]">{{ title }}</h1>
      <p v-if="subtitle" class="font-body text-sm text-[var(--color-text-muted)] mt-1">{{ subtitle }}</p>
    </div>
    <slot name="actions" />
  </div>
</template>
<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; back?: string; backLabel?: string }>()
</script>
