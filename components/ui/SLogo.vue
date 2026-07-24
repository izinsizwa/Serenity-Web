<template>
  <span
    :style="{ fontSize: fontSizeMap[size ?? 'md'] + 'px', color: fill, letterSpacing: '0.2em' }"
    style="font-family: 'Cormorant Garamond', 'Fraunces', Georgia, serif; font-weight: 300; text-transform: uppercase; line-height: 1;"
  >SERENITY</span>
</template>

<script setup lang="ts">
const props = defineProps<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  dark?: boolean
}>()

const colorMode = useColorMode()

const fontSizeMap: Record<string, number> = { xs: 14, sm: 18, md: 24, lg: 30, xl: 40 }

const fill = computed(() => {
  if (props.dark) return 'rgba(255,255,255,0.88)'
  return colorMode.value === 'dark' ? '#A89F6A' : '#6B6636'
})
</script>
