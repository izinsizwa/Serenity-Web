<template>
  <div :class="['rounded-full flex items-center justify-center shrink-0 overflow-hidden', sizeClass, bgClass]">
    <img v-if="src" :src="src" :alt="name" class="w-full h-full object-cover" />
    <span v-else :class="['font-body font-medium text-white', textSizeClass]">{{ initials }}</span>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ src?: string | null; name: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; color?: string }>()
const initials = computed(() => props.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2))
const sizeClass = computed(() => ({
  xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16'
}[props.size ?? 'md']))
const textSizeClass = computed(() => ({
  xs: 'text-xs', sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-lg'
}[props.size ?? 'md']))
const bgClass = computed(() => props.color ?? 'bg-forest-500')
</script>
