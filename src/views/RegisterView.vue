<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="4" sm="8">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Crear Cuenta</v-toolbar-title>
          </v-toolbar>

          <v-card-text>
            <v-form ref="form" @submit.prevent="handleRegister">
              <v-text-field
                v-model="userData.name"
                :disabled="authStore.loading"
                label="Nombre completo"
                prepend-icon="mdi-account"
                :rules="[rules.required]"
              />

              <v-text-field
                v-model="userData.email"
                :disabled="authStore.loading"
                label="Correo electrónico"
                prepend-icon="mdi-email"
                :rules="[rules.required, rules.email]"
                type="email"
              />

              <v-text-field
                v-model="userData.password"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :disabled="authStore.loading"
                label="Contraseña"
                prepend-icon="mdi-lock"
                :rules="[rules.required, rules.minLength]"
                :type="showPassword ? 'text' : 'password'"
                @click:append="showPassword = !showPassword"
              />

              <v-text-field
                v-model="userData.password_confirmation"
                :disabled="authStore.loading"
                label="Confirmar contraseña"
                prepend-icon="mdi-lock-check"
                :rules="[rules.required, rules.passwordMatch]"
                :type="showPassword ? 'text' : 'password'"
              />

              <v-alert
                v-if="authStore.error"
                class="mb-4"
                closable
                type="error"
                variant="tonal"
                @click:close="authStore.clearError"
              >
                {{ authStore.error }}
              </v-alert>

              <v-btn
                block
                color="primary"
                :loading="authStore.loading"
                size="large"
                type="submit"
              >
                Registrarse
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-center">
            <span class="text-body-2">¿Ya tienes cuenta?</span>
            <v-btn color="primary" :to="{ name: 'login' }" variant="text">
              Inicia sesión
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()

  const form = ref(null)
  const showPassword = ref(false)

  const userData = reactive({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })

  const rules = {
    required: v => !!v || 'Este campo es requerido',
    email: v => /.+@.+\..+/.test(v) || 'Correo electrónico inválido',
    minLength: v => v.length >= 8 || 'Mínimo 8 caracteres',
    passwordMatch: v => v === userData.password || 'Las contraseñas no coinciden',
  }

  async function handleRegister () {
    const { valid } = await form.value.validate()
    if (!valid) return

    const result = await authStore.register(userData)

    if (result.success) {
      router.push({ name: 'dashboard' })
    }
  }
</script>
