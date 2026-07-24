<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('update:modelValue', false)" />
        <div :class="['relative bg-[var(--color-surface)] rounded-2xl shadow-elevated w-full z-10', maxWidth]">
          <div v-if="title" class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <h3 class="font-display text-lg text-[var(--color-text)]">{{ title }}</h3>
            <button @click="$emit('update:modelValue', false)" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6"><slot /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup lang="ts">
defineProps<{ modelValue: boolean; title?: string; maxWidth?: string }>()
defineEmits(['update:modelValue'])
</script>
<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .relative, .modal-leave-to .relative { transform: translateY(20px); }
</style>
