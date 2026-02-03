<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-view-dashboard</v-icon>
            Dashboard
            <v-spacer />
          </v-card-title>

          <v-card-text>
            <v-alert class="mb-4" type="success" variant="tonal">
              Bienvenido, <strong>{{ authStore.userName || 'Usuario' }}</strong>
            </v-alert>

            <v-row>
              <v-col cols="12" md="4">
                <v-card color="primary" variant="tonal">
                  <v-card-title>
                    <v-icon>mdi-account</v-icon>
                    Perfil
                  </v-card-title>
                  <v-card-text>
                    <p><strong>Email:</strong> {{ authStore.user?.email }}</p>
                    <p><strong>Rol:</strong> {{ authStore.userRole || 'Usuario' }}</p>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <v-card color="secondary" variant="tonal">
                  <v-card-title>
                    <v-icon>mdi-chart-line</v-icon>
                    Estadísticas
                  </v-card-title>
                  <v-card-text>
                    <p>Contenido de estadísticas aquí</p>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <v-card color="accent" variant="tonal">
                  <v-card-title>
                    <v-icon>mdi-cog</v-icon>
                    Configuración
                  </v-card-title>
                  <v-card-text>
                    <p>Opciones de configuración aquí</p>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
</script>
