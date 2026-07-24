<script setup lang="ts">
// Redirect based on auth state
const auth = useAuthStore()
onMounted(async () => {
  if (auth.token && !auth.user) await auth.fetchMe()
  if (auth.isAuthenticated) navigateTo(auth.portalRoute)
  else navigateTo('/auth/login')
})
</script>
<template><div /></template>
