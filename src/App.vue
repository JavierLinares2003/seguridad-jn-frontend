<template>
  <v-app>
    <!-- Loading overlay mientras se verifica la autenticación inicial -->
    <v-overlay
      v-model="isCheckingAuth"
      class="align-center justify-center"
      persistent
      scrim="primary"
    >
      <v-progress-circular
        color="white"
        indeterminate
        size="64"
        width="6"
      />
      <p class="text-white text-h6 mt-4">Cargando...</p>
    </v-overlay>

    <router-view v-if="!isCheckingAuth" />
  </v-app>
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
