<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
    <button :disabled="page <= 1" @click="$emit('update:page', page - 1)"
      class="p-2 rounded-lg hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      <Icon name="heroicons:chevron-left" class="w-5 h-5 text-[var(--color-text-muted)]" />
    </button>
    <div class="flex items-center gap-1">
      <button v-for="p in displayedPages" :key="p"
        @click="typeof p === 'number' && $emit('update:page', p)"
        :class="['w-9 h-9 rounded-lg font-body text-sm transition-colors',
          p === page ? 'bg-forest-500 text-white' : typeof p === 'number' ? 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)] cursor-default']">
        {{ p }}
      </button>
    </div>
    <button :disabled="page >= totalPages" @click="$emit('update:page', page + 1)"
      class="p-2 rounded-lg hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      <Icon name="heroicons:chevron-right" class="w-5 h-5 text-[var(--color-text-muted)]" />
    </button>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ page: number; totalPages: number }>()
defineEmits(['update:page'])
const displayedPages = computed(() => {
  const pages: (number | '...')[] = []
  const { page, totalPages } = props
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  pages.push(1)
  if (page > 3) pages.push('...')
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
  if (page < totalPages - 2) pages.push('...')
  pages.push(totalPages)
  return pages
})
</script>
