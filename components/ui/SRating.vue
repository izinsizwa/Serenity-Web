<template>
  <div class="flex items-center gap-1">
    <button v-for="i in 5" :key="i"
      :class="['transition-all', interactive ? 'hover:scale-110 cursor-pointer' : 'cursor-default']"
      @click="interactive && $emit('update:modelValue', i)">
      <Icon
        :name="i <= (modelValue ?? 0) ? 'heroicons:star-solid' : 'heroicons:star'"
        :class="['w-' + size + ' h-' + size, i <= (modelValue ?? 0) ? 'text-amber-400' : 'text-[var(--color-border)]']"
      />
    </button>
    <span v-if="showValue && modelValue" class="font-body text-sm text-[var(--color-text-muted)] ml-1">{{ modelValue.toFixed(1) }}</span>
  </div>
</template>
<script setup lang="ts">
defineProps<{ modelValue?: number; interactive?: boolean; size?: string; showValue?: boolean }>()
defineEmits(['update:modelValue'])
</script>
