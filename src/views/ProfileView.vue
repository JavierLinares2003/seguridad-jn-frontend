<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" lg="6" md="8">
        <v-card class="elevation-2" rounded="lg">
          <v-img
            cover
            height="150"
            src="https://cdn.vuetifyjs.com/images/cards/forest-art.jpg"
          >
            <template #placeholder>
              <div class="d-flex align-center justify-center fill-height bg-primary">
                <v-icon color="white" icon="mdi-account" size="64" />
              </div>
            </template>
          </v-img>

          <v-card-text class="mt-n12 text-center">
            <v-avatar
              class="elevation-4"
              color="white"
              size="120"
            >
              <v-avatar color="primary" size="114">
                <span class="text-h2 font-weight-bold text-white">{{ userInitials }}</span>
              </v-avatar>
            </v-avatar>

            <h2 class="text-h4 font-weight-bold mt-4 mb-1">
              {{ authStore.userName || 'Usuario' }}
            </h2>
            <div class="text-subtitle-1 text-medium-emphasis mb-4">
              {{ authStore.userRole || 'Rol no definido' }}
            </div>

            <v-chip
              class="mb-6 mr-2"
              color="primary"
              variant="flat"
            >
              {{ authStore.user?.email || 'Sin correo electrónico' }}
            </v-chip>

            <v-chip
              class="mb-6"
              :color="authStore.user?.estado ? 'success' : 'error'"
              variant="flat"
            >
              {{ authStore.user?.estado ? 'Activo' : 'Inactivo' }}
            </v-chip>

            <v-divider class="mb-4" />

            <v-list density="compact" nav>
              <v-list-subheader>INFORMACIÓN DE CUENTA</v-list-subheader>

              <v-list-item>
                <template #prepend>
                  <v-icon color="primary" icon="mdi-shield-account" />
                </template>
                <v-list-item-title>Rol de Usuario</v-list-item-title>
                <template #append>
                  <span class="text-body-2 font-weight-medium">{{ authStore.userRole }}</span>
                </template>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon color="primary" icon="mdi-clock-outline" />
                </template>
                <v-list-item-title>Último Acceso</v-list-item-title>
                <template #append>
                  <span class="text-body-2 font-weight-medium">{{ formatDate(authStore.user?.ultimo_login) }}</span>
                </template>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon color="primary" icon="mdi-calendar" />
                </template>
                <v-list-item-title>Fecha de Registro</v-list-item-title>
                <template #append>
                  <span class="text-body-2 font-weight-medium">{{ formatDate(authStore.user?.created_at) }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-divider />

          <v-card-actions>
            <v-btn
              color="primary"
              prepend-icon="mdi-arrow-left"
              :to="{ name: 'inicio' }"
              variant="text"
            >
              Volver
            </v-btn>
            <v-spacer />
            <v-btn
              color="primary"
              prepend-icon="mdi-lock-reset"
              variant="elevated"
              @click="showPasswordDialog = true"
            >
              Cambiar Contraseña
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Cambio de Contraseña -->
    <v-dialog v-model="showPasswordDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          Cambiar Contraseña
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" @submit.prevent="handleChangePassword">
            <v-text-field
              v-model="passwordForm.current_password"
              label="Contraseña Actual"
              required
              :rules="[v => !!v || 'La contraseña actual es requerida']"
              type="password"
              variant="outlined"
            />

            <v-text-field
              v-model="passwordForm.new_password"
              label="Nueva Contraseña"
              required
              :rules="[
                v => !!v || 'La nueva contraseña es requerida',
                v => (v && v.length >= 8) || 'La contraseña debe tener al menos 8 caracteres'
              ]"
              type="password"
              variant="outlined"
            />

            <v-text-field
              v-model="passwordForm.new_password_confirmation"
              label="Confirmar Nueva Contraseña"
              required
              :rules="[
                v => !!v || 'La confirmación es requerida',
                v => v === passwordForm.new_password || 'Las contraseñas no coinciden'
              ]"
              type="password"
              variant="outlined"
            />

            <v-alert
              v-if="error"
              class="mb-3"
              closable
              type="error"
              variant="tonal"
              @click:close="error = null"
            >
              {{ error }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="closeDialog"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!valid"
            :loading="loading"
            variant="elevated"
            @click="handleChangePassword"
          >
            Actualizar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar Success -->
    <v-snackbar
      v-model="showSuccessSnackbar"
      color="success"
      timeout="3000"
    >
      Contraseña actualizada correctamente

      <template #actions>
        <v-btn
          color="white"
          variant="text"
          @click="showSuccessSnackbar = false"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { format } from 'date-fns'
  import { es } from 'date-fns/locale'
  import { computed, ref } from 'vue'
  import authService from '@/services/authService'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()

  // Estado del diálogo y formulario
  const showPasswordDialog = ref(false)
  const showSuccessSnackbar = ref(false)
  const valid = ref(false)
  const loading = ref(false)
  const error = ref(null)
  const form = ref(null)

  const passwordForm = ref({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })

  const userInitials = computed(() => {
    const name = authStore.userName
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  function formatDate (dateString) {
    if (!dateString) return 'No disponible'
    try {
      return format(new Date(dateString), 'd \'de\' MMMM, yyyy HH:mm', { locale: es })
    } catch {
      return dateString
    }
  }

  function closeDialog () {
    showPasswordDialog.value = false
    resetForm()
  }

  function resetForm () {
    passwordForm.value = {
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    }
    error.value = null
    if (form.value) form.value.resetValidation()
  }

  async function handleChangePassword () {
    if (!valid.value) return

    loading.value = true
    error.value = null

    try {
      await authService.changePassword(passwordForm.value)
      showSuccessSnackbar.value = true
      closeDialog()
    } catch (error_) {
      error.value = error_.response?.data?.message || 'Error al actualizar la contraseña'
      // Si hay un error específico de validación del backend
      if (error_.response?.data?.error === 'invalid_current_password') {
        error.value = 'La contraseña actual no es correcta'
      }
    } finally {
      loading.value = false
    }
  }
</script>
