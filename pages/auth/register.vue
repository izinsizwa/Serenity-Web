<script setup lang="ts">
import { UserRole } from '~/types'
definePageMeta({ layout: 'auth' })

const router = useRouter()
const auth   = useAuthStore()

// Step 1 = role select, Step 2 = personal info, Step 3 = security
const step       = ref(1)
const roleChoice = ref<'client' | 'therapist' | null>(null)

const form = reactive({
  firstName:       '',
  lastName:        '',
  email:           '',
  password:        '',
  confirmPassword: '',
  phoneNumber:     '',
  dateOfBirth:     '',
  gender:          '',
})

const showPassword = ref(false)
const errors       = reactive<Record<string, string>>({})

function selectRole(r: 'client' | 'therapist') {
  roleChoice.value = r
  step.value = 2
}

function validateStep2() {
  Object.keys(errors).forEach(k => delete (errors as any)[k])
  if (!form.firstName.trim()) errors.firstName = 'Required'
  if (!form.lastName.trim())  errors.lastName  = 'Required'
  if (!form.email.trim())     errors.email     = 'Required'
  if (!form.phoneNumber.trim()) errors.phoneNumber = 'Required'
  if (!form.dateOfBirth)      errors.dateOfBirth = 'Required'
  if (!form.gender)           errors.gender    = 'Required'
  return Object.keys(errors).length === 0
}

function validateStep3() {
  Object.keys(errors).forEach(k => delete (errors as any)[k])
  if (form.password.length < 8) errors.password = 'At least 8 characters'
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match'
  return Object.keys(errors).length === 0
}

async function handleRegister() {
  // Re-verify both step 2 and step 3 before submission
  if (!validateStep2()) {
    step.value = 2
    return
  }
  if (!validateStep3()) return

  try {
    // Safely parse date input into valid ISO DateTime string
    const parsedDate = new Date(form.dateOfBirth)
    const formattedDob = !isNaN(parsedDate.getTime()) 
      ? parsedDate.toISOString() 
      : new Date().toISOString()

    const payload = {
      firstName:   form.firstName.trim(),
      lastName:    form.lastName.trim(),
      email:       form.email.trim(),
      password:    form.password,
      phoneNumber: form.phoneNumber.trim(),
      dateOfBirth: formattedDob,
      gender:      form.gender,
      role:        roleChoice.value === 'therapist' ? UserRole.Therapist : UserRole.Client,
    }

    await auth.register(payload)
    await router.push(auth.portalRoute)
  } catch (e: any) {
    console.error('Register failed:', e)
  }
}
</script>

<template>
  <div class="animate-fade-up">
    <!-- Step 1: Role Selection -->
    <div v-if="step === 1">
      <div class="mb-8">
        <h1 class="font-display text-3xl text-[var(--color-text)] mb-2">Create your account</h1>
        <p class="font-body text-[var(--color-text-muted)]">Who are you joining as?</p>
      </div>
      <div class="space-y-4">
        <button @click="selectRole('client')"
          class="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-[var(--color-border)] hover:border-forest-400 hover:bg-forest-50 dark:hover:bg-forest-900/20 transition-all text-left group">
          <div class="w-12 h-12 rounded-xl bg-forest-100 dark:bg-forest-900/40 flex items-center justify-center shrink-0 group-hover:bg-forest-200 dark:group-hover:bg-forest-800/50 transition-colors">
            <Icon name="heroicons:heart" class="w-6 h-6 text-forest-500" />
          </div>
          <div>
            <p class="font-body font-semibold text-[var(--color-text)]">I'm looking for support</p>
            <p class="font-body text-sm text-[var(--color-text-muted)]">Connect with a therapist and manage your mental wellness</p>
          </div>
          <Icon name="heroicons:arrow-right" class="w-5 h-5 text-[var(--color-text-muted)] ml-auto" />
        </button>

        <button @click="selectRole('therapist')"
          class="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-[var(--color-border)] hover:border-clay-400 hover:bg-clay-50 dark:hover:bg-clay-900/20 transition-all text-left group">
          <div class="w-12 h-12 rounded-xl bg-clay-100 dark:bg-clay-900/40 flex items-center justify-center shrink-0 group-hover:bg-clay-200 dark:group-hover:bg-clay-800/50 transition-colors">
            <Icon name="heroicons:briefcase" class="w-6 h-6 text-clay-500" />
          </div>
          <div>
            <p class="font-body font-semibold text-[var(--color-text)]">I'm a therapist</p>
            <p class="font-body text-sm text-[var(--color-text-muted)]">Join to manage clients, sessions and grow your practice</p>
          </div>
          <Icon name="heroicons:arrow-right" class="w-5 h-5 text-[var(--color-text-muted)] ml-auto" />
        </button>
      </div>
      <p class="font-body text-center text-sm text-[var(--color-text-muted)] mt-6">
        Already have an account?
        <NuxtLink to="/auth/login" class="text-forest-500 hover:text-forest-600 font-medium ml-1">Sign in</NuxtLink>
      </p>
    </div>

    <!-- Step 2: Personal Info -->
    <div v-else-if="step === 2">
      <div class="mb-8">
        <button @click="step = 1" class="flex items-center gap-1 font-body text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-3 transition-colors">
          <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Back
        </button>
        <h1 class="font-display text-3xl text-[var(--color-text)] mb-2">Personal details</h1>
        <p class="font-body text-[var(--color-text-muted)]">Tell us a bit about yourself</p>
      </div>
      <form class="space-y-4" @submit.prevent="validateStep2() && (step = 3)">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="input-label">First name</label>
            <input v-model="form.firstName" type="text" class="input" :class="errors.firstName && 'border-red-400'" placeholder="Sarah" required />
            <p v-if="errors.firstName" class="font-body text-xs text-red-500 mt-1">{{ errors.firstName }}</p>
          </div>
          <div>
            <label class="input-label">Last name</label>
            <input v-model="form.lastName" type="text" class="input" :class="errors.lastName && 'border-red-400'" placeholder="Nkosi" required />
            <p v-if="errors.lastName" class="font-body text-xs text-red-500 mt-1">{{ errors.lastName }}</p>
          </div>
        </div>
        <div>
          <label class="input-label">Email address</label>
          <input v-model="form.email" type="email" class="input" :class="errors.email && 'border-red-400'" placeholder="sarah@example.com" required />
          <p v-if="errors.email" class="font-body text-xs text-red-500 mt-1">{{ errors.email }}</p>
        </div>
        <div>
          <label class="input-label">Phone number</label>
          <input v-model="form.phoneNumber" type="tel" class="input" :class="errors.phoneNumber && 'border-red-400'" placeholder="+27 81 234 5678" required />
          <p v-if="errors.phoneNumber" class="font-body text-xs text-red-500 mt-1">{{ errors.phoneNumber }}</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="input-label">Date of birth</label>
            <input v-model="form.dateOfBirth" type="date" class="input" :class="errors.dateOfBirth && 'border-red-400'" required />
            <p v-if="errors.dateOfBirth" class="font-body text-xs text-red-500 mt-1">{{ errors.dateOfBirth }}</p>
          </div>
          <div>
            <label class="input-label">Gender</label>
            <select v-model="form.gender" class="input" :class="errors.gender && 'border-red-400'" required>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            <p v-if="errors.gender" class="font-body text-xs text-red-500 mt-1">{{ errors.gender }}</p>
          </div>
        </div>
        <button type="submit" class="btn-primary w-full mt-2">Continue</button>
      </form>
    </div>

    <!-- Step 3: Password -->
    <div v-else-if="step === 3">
      <div class="mb-8">
        <button @click="step = 2" class="flex items-center gap-1 font-body text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-3 transition-colors">
          <Icon name="heroicons:arrow-left" class="w-4 h-4" /> Back
        </button>
        <h1 class="font-display text-3xl text-[var(--color-text)] mb-2">Secure your account</h1>
        <p class="font-body text-[var(--color-text-muted)]">Choose a strong password</p>
      </div>
      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="input-label">Password</label>
          <div class="relative">
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="input pr-12"
              :class="errors.password && 'border-red-400'" placeholder="At least 8 characters" required />
            <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" @click="showPassword = !showPassword">
              <Icon :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-5 h-5" />
            </button>
          </div>
          <p v-if="errors.password" class="font-body text-xs text-red-500 mt-1">{{ errors.password }}</p>
        </div>
        <div>
          <label class="input-label">Confirm password</label>
          <input v-model="form.confirmPassword" type="password" class="input" :class="errors.confirmPassword && 'border-red-400'" placeholder="Repeat your password" required />
          <p v-if="errors.confirmPassword" class="font-body text-xs text-red-500 mt-1">{{ errors.confirmPassword }}</p>
        </div>
        <p class="font-body text-xs text-[var(--color-text-muted)]">
          By creating an account you agree to our
          <a href="#" class="text-forest-500 underline">Terms of Service</a> and
          <a href="#" class="text-forest-500 underline">Privacy Policy</a>.
        </p>
        <SError v-if="auth.error" :message="auth.error" />
        <button type="submit" class="btn-primary w-full" :disabled="auth.isLoading" >
          <span v-if="auth.isLoading" class="flex items-center justify-center gap-2">
            <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" /> Creating account...
          </span>
          <span v-else>Create account</span>
        </button>
      </form>
    </div>
  </div>
</template>