<script setup lang="ts">
definePageMeta({ layout: 'auth' })
const api  = useApi()
const sent = ref(false)
const email = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true; error.value = ''
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    sent.value = true
  } catch (e: any) { error.value = e.message } finally { loading.value = false }
}
</script>
<template>
  <div class="animate-fade-up">
    <div v-if="!sent">
      <div class="mb-8">
        <NuxtLink to="/auth/login" class="flex items-center gap-1 font-body text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-3 transition-colors">
          <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Back to login
        </NuxtLink>
        <h1 class="font-display text-3xl text-[var(--color-text)] mb-2">Reset password</h1>
        <p class="font-body text-[var(--color-text-muted)]">Enter your email and we'll send you a reset link</p>
      </div>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="input-label">Email address</label>
          <input v-model="email" type="email" class="input" placeholder="you@example.com" required />
        </div>
        <SError v-if="error" :message="error" />
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Sending...
          </span>
          <span v-else>Send reset link</span>
        </button>
      </form>
    </div>
    <div v-else class="text-center">
      <div class="w-16 h-16 rounded-2xl bg-forest-100 dark:bg-forest-900/40 flex items-center justify-center mx-auto mb-4">
        <Icon name="heroicons:envelope" class="w-8 h-8 text-forest-500" />
      </div>
      <h2 class="font-display text-2xl text-[var(--color-text)] mb-2">Check your inbox</h2>
      <p class="font-body text-[var(--color-text-muted)] mb-6">We sent a reset link to <strong>{{ email }}</strong></p>
      <NuxtLink to="/auth/login" class="btn-primary inline-flex">Back to login</NuxtLink>
    </div>
  </div>
</template>
