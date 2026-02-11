<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- Hero Section -->
        <v-card class="text-center pa-8 mb-6" elevation="4" rounded="xl">
          <v-avatar class="mb-6" color="primary" size="100">
            <v-icon icon="mdi-shield-check" size="60" />
          </v-avatar>

          <h1 class="text-h3 font-weight-bold text-primary mb-2">
            Seguridad JN
          </h1>

          <p class="text-h6 text-medium-emphasis mb-6">
            Sistema de Gestion de Seguridad
          </p>

          <v-divider class="mx-auto mb-6" style="max-width: 200px;" />

          <p class="text-body-1 text-medium-emphasis mb-8">
            Bienvenido, <strong class="text-primary">{{ authStore.userName || 'Usuario' }}</strong>.
            Selecciona una opcion del menu para comenzar.
          </p>

          <!-- Quick Actions -->
          <v-row class="justify-center">
            <v-col v-if="authStore.hasPermission('view-personal')" cols="12" sm="6" md="4">
              <v-card
                class="pa-4 h-100 quick-action-card"
                color="blue"
                rounded="xl"
                variant="tonal"
                :to="{ name: 'personal' }"
              >
                <v-icon class="mb-3" size="40">mdi-account-group</v-icon>
                <h3 class="text-subtitle-1 font-weight-bold mb-1">Personal</h3>
                <p class="text-caption text-medium-emphasis mb-0">Gestionar personal</p>
              </v-card>
            </v-col>

            <v-col v-if="authStore.hasPermission('view-proyectos')" cols="12" sm="6" md="4">
              <v-card
                class="pa-4 h-100 quick-action-card"
                color="green"
                rounded="xl"
                variant="tonal"
                :to="{ name: 'proyectos' }"
              >
                <v-icon class="mb-3" size="40">mdi-folder-multiple</v-icon>
                <h3 class="text-subtitle-1 font-weight-bold mb-1">Proyectos</h3>
                <p class="text-caption text-medium-emphasis mb-0">Ver proyectos</p>
              </v-card>
            </v-col>

            <v-col v-if="authStore.hasPermission('view-operaciones')" cols="12" sm="6" md="4">
              <v-card
                class="pa-4 h-100 quick-action-card"
                color="orange"
                rounded="xl"
                variant="tonal"
                :to="{ name: 'operaciones' }"
              >
                <v-icon class="mb-3" size="40">mdi-swap-horizontal</v-icon>
                <h3 class="text-subtitle-1 font-weight-bold mb-1">Operaciones</h3>
                <p class="text-caption text-medium-emphasis mb-0">Gestionar operaciones</p>
              </v-card>
            </v-col>

            <v-col v-if="authStore.hasPermission('view-users')" cols="12" sm="6" md="4">
              <v-card
                class="pa-4 h-100 quick-action-card"
                color="purple"
                rounded="xl"
                variant="tonal"
                :to="{ name: 'configuracion-usuarios' }"
              >
                <v-icon class="mb-3" size="40">mdi-account-cog</v-icon>
                <h3 class="text-subtitle-1 font-weight-bold mb-1">Usuarios</h3>
                <p class="text-caption text-medium-emphasis mb-0">Administrar usuarios</p>
              </v-card>
            </v-col>
          </v-row>
        </v-card>

        <!-- Info Cards -->
        <v-row>
          <v-col cols="12" md="4">
            <v-card class="h-100" elevation="2" rounded="xl">
              <v-card-text class="text-center pa-5">
                <v-avatar class="mb-3" color="info" size="50" variant="tonal">
                  <v-icon icon="mdi-account" size="28" />
                </v-avatar>
                <h4 class="text-subtitle-1 font-weight-bold mb-1">Tu Perfil</h4>
                <p class="text-body-2 text-medium-emphasis mb-0">{{ authStore.user?.email }}</p>
                <v-chip class="mt-2 text-capitalize" color="primary" label size="small" variant="tonal">
                  {{ authStore.userRole || 'Usuario' }}
                </v-chip>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="h-100" elevation="2" rounded="xl">
              <v-card-text class="text-center pa-5">
                <v-avatar class="mb-3" color="success" size="50" variant="tonal">
                  <v-icon icon="mdi-check-circle" size="28" />
                </v-avatar>
                <h4 class="text-subtitle-1 font-weight-bold mb-1">Estado</h4>
                <p class="text-body-2 text-medium-emphasis mb-0">Sistema operativo</p>
                <v-chip class="mt-2" color="success" label size="small" variant="flat">
                  Conectado
                </v-chip>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="h-100" elevation="2" rounded="xl">
              <v-card-text class="text-center pa-5">
                <v-avatar class="mb-3" color="warning" size="50" variant="tonal">
                  <v-icon icon="mdi-calendar" size="28" />
                </v-avatar>
                <h4 class="text-subtitle-1 font-weight-bold mb-1">Fecha</h4>
                <p class="text-body-2 text-medium-emphasis mb-0">{{ currentDate }}</p>
                <p class="text-caption text-medium-emphasis mt-1 mb-0">{{ currentTime }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { onMounted, onUnmounted, ref } from 'vue'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()

  const currentDate = ref('')
  const currentTime = ref('')
  let timeInterval = null

  function updateDateTime() {
    const now = new Date()
    currentDate.value = format(now, "EEEE, dd 'de' MMMM yyyy", { locale: es })
    currentTime.value = format(now, 'HH:mm:ss')
  }

  onMounted(() => {
    updateDateTime()
    timeInterval = setInterval(updateDateTime, 1000)
  })

  onUnmounted(() => {
    if (timeInterval) {
      clearInterval(timeInterval)
    }
  })
</script>

<style scoped>
.quick-action-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.quick-action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}
</style>
