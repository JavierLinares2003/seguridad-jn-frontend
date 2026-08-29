<template>
  <v-overlay
    v-model="isCheckingAuth"
    class="align-center justify-center"
    persistent
    scrim="#072A66"
  >
    <v-progress-circular
      color="#F5C400"
      indeterminate
      size="48"
      width="3"
    />
    <p class="text-white mt-4" style="font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.16em; text-transform: uppercase;">
      Cargando
    </p>
  </v-overlay>

  <router-view v-if="!isCheckingAuth" />
</template>

<script setup>
  import { computed } from 'vue'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()

  // Mostrar loading mientras se inicializa la autenticación
  const isCheckingAuth = computed(() => {
    return !authStore.initialized && authStore.loading
  })
</script>
