<template>
  <div class="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
    <Icon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-500 shrink-0" />
    <div>
      <p class="font-body text-sm font-medium text-red-700 dark:text-red-400">{{ title || 'Something went wrong' }}</p>
      <p v-if="message" class="font-body text-xs text-red-600 dark:text-red-500 mt-0.5">{{ message }}</p>
    </div>
    <button v-if="onRetry" @click="onRetry" class="ml-auto font-body text-xs text-red-600 hover:text-red-700 underline">Retry</button>
  </div>
</template>
<script setup lang="ts">
defineProps<{ title?: string; message?: string; onRetry?: () => void }>()
</script>
