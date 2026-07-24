<template>
  <div :class="['card', { 'hover:shadow-elevated transition-shadow cursor-pointer': clickable }]" @click="clickable && $emit('click')">
    <slot />
  </div>
</template>
<script setup lang="ts">
defineProps<{ clickable?: boolean }>()
defineEmits(['click'])
</script>
