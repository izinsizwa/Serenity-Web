<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth  = useAuthStore()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const showPassword = ref(false)

async function handleLogin() {
  try {
    await auth.login(form)
    await router.push(auth.portalRoute)
  } catch {}
}
</script>

<template>
  <div class="animate-fade-up">
    <div class="mb-8">
      <h1 class="font-display text-3xl text-[var(--color-text)] mb-2">Welcome back</h1>
      <p class="font-body text-[var(--color-text-muted)]">
        Sign in to continue your wellness journey
      </p>
    </div>

    <form class="space-y-5" @submit.prevent="handleLogin">
      <!-- Email -->
      <div>
        <label class="input-label">Email address</label>
        <input
          v-model="form.email"
          type="email"
          class="input"
          placeholder="you@example.com"
          required
          autocomplete="email"
        />
      </div>

      <!-- Password -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="input-label !mb-0">Password</label>
          <NuxtLink to="/auth/forgot-password" 
            class="font-body text-xs text-forest-500 hover:text-forest-600 transition-colors">
            Forgot password?
          </NuxtLink>
        </div>
        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="input pr-12"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
          <button type="button"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            @click="showPassword = !showPassword">
            <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Error -->
      <div v-if="auth.error" class="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <Icon name="heroicons:exclamation-circle" class="w-4 h-4 text-red-500 shrink-0" />
        <p class="font-body text-sm text-red-600 dark:text-red-400">{{ auth.error }}</p>
      </div>

      <!-- Submit -->
      <button type="submit" class="btn-primary w-full" :disabled="auth.isLoading">
        <span v-if="auth.isLoading" class="flex items-center justify-center gap-2">
          <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
          Signing in...
        </span>
        <span v-else>Sign in</span>
      </button>
    </form>

    <!-- Divider -->
    <div class="my-6 flex items-center gap-4">
      <div class="divider flex-1" />
      <span class="font-body text-xs text-[var(--color-text-muted)]">or</span>
      <div class="divider flex-1" />
    </div>

    <!-- Register link -->
    <p class="font-body text-center text-sm text-[var(--color-text-muted)]">
      Don't have an account?
      <NuxtLink to="/auth/register" class="text-forest-500 hover:text-forest-600 font-medium transition-colors ml-1">
        Create one
      </NuxtLink>
    </p>

    <!-- Register as therapist -->
    <p class="font-body text-center text-xs text-[var(--color-text-muted)] mt-3">
      Are you a therapist?
      <NuxtLink to="/auth/register?role=therapist" class="text-clay-500 hover:text-clay-600 font-medium transition-colors ml-1">
        Join as a therapist
      </NuxtLink>
    </p>
  </div>
</template>
