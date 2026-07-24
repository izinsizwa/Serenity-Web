<template>
  <div class="min-h-screen bg-serenity flex">
    <!-- Left panel -->
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-forest-600">
      <div class="absolute inset-0 bg-gradient-to-br from-forest-800 via-forest-600 to-forest-500" />
      <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
      <div class="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-white/5" />
      <div class="absolute top-1/3 right-12 w-40 h-40 rounded-full bg-forest-400/30" />
      <div class="relative z-10 flex flex-col justify-between p-14 text-white w-full">
        <SLogo size="md" :dark="true" />
        <div class="space-y-6">
          <p class="font-display text-4xl leading-tight text-white/95">
            Your path to <em>mental wellness</em> starts here.
          </p>
          <p class="font-body text-white/70 text-lg leading-relaxed max-w-sm">
            Connect with verified therapists, track your mood, and take control of your mental health journey.
          </p>
          <div class="flex items-center gap-6 pt-4">
            <div class="text-center">
              <p class="font-display text-3xl text-white">200+</p>
              <p class="font-body text-white/60 text-sm">Verified Therapists</p>
            </div>
            <div class="w-px h-10 bg-white/20" />
            <div class="text-center">
              <p class="font-display text-3xl text-white">5k+</p>
              <p class="font-body text-white/60 text-sm">Clients Helped</p>
            </div>
            <div class="w-px h-10 bg-white/20" />
            <div class="text-center">
              <p class="font-display text-3xl text-white">4.9</p>
              <p class="font-body text-white/60 text-sm">Average Rating</p>
            </div>
          </div>
        </div>
        <p class="font-body text-white/40 text-sm">
          HPCSA registered · Secure & confidential · Medical aid accepted
        </p>
      </div>
    </div>

    <!-- Right panel -->
    <div class="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
      <div class="mb-8 lg:hidden">
        <SLogo size="md" />
      </div>
      <div class="w-full max-w-md mx-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
