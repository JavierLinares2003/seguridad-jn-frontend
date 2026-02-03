<template>
  <v-container class="fill-height bg-grey-lighten-4" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" lg="4" md="5" sm="10">
        <v-card
          class="mx-auto overflow-hidden"
          elevation="8"
          max-width="450"
          rounded="xl"
        >
          <!-- Header con gradiente y avatar -->
          <v-sheet
            class="d-flex flex-column align-center justify-center py-8"
            color="primary"
            rounded="0"
          >
            <v-avatar
              class="mb-4 elevation-4"
              color="white"
              size="80"
            >
              <v-icon
                color="primary"
                icon="mdi-account-circle"
                size="60"
              />
            </v-avatar>
            <h2 class="text-h5 font-weight-bold text-white">
              Bienvenido
            </h2>
            <p class="text-body-2 text-white-darken-1 mt-1">
              Inicia sesión para continuar
            </p>
          </v-sheet>

          <v-card-text class="pa-6 pt-8">
            <v-form @submit.prevent="onSubmit">
              <v-text-field
                v-model="email"
                bg-color="grey-lighten-5"
                class="mb-2"
                color="primary"
                density="comfortable"
                :disabled="authStore.loading"
                :error-messages="errors.email"
                label="Correo electrónico"
                prepend-inner-icon="mdi-email-outline"
                rounded="lg"
                type="email"
                variant="outlined"
                @blur="validateField('email')"
              />

              <v-text-field
                v-model="password"
                :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                bg-color="grey-lighten-5"
                class="mb-2"
                color="primary"
                density="comfortable"
                :disabled="authStore.loading"
                :error-messages="errors.password"
                label="Contraseña"
                prepend-inner-icon="mdi-lock-outline"
                rounded="lg"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                @blur="validateField('password')"
                @click:append-inner="showPassword = !showPassword"
              />

              <v-alert
                v-if="authStore.error"
                class="mb-4"
                closable
                rounded="lg"
                type="error"
                variant="tonal"
                @click:close="authStore.clearError"
              >
                {{ authStore.error }}
              </v-alert>

              <v-btn
                block
                class="mt-4 text-none font-weight-bold"
                color="primary"
                :disabled="!meta.valid || authStore.loading"
                elevation="2"
                :loading="authStore.loading"
                rounded="lg"
                size="x-large"
                type="submit"
              >
                <v-icon icon="mdi-login" start />
                Ingresar
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider class="mx-6" />

          <v-card-actions class="justify-center pa-4">
            <span class="text-body-2 text-medium-emphasis">¿No tienes cuenta?</span>
            <v-btn
              class="text-none font-weight-medium"
              color="primary"
              :to="{ name: 'register' }"
              variant="text"
            >
              Regístrate aquí
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Footer opcional -->
        <p class="text-center text-caption text-medium-emphasis mt-6">
          © {{ new Date().getFullYear() }} Tu Empresa. Todos los derechos reservados.
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { useField, useForm } from 'vee-validate'
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import * as yup from 'yup'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  const showPassword = ref(false)

  // Esquema de validación con Yup
  const validationSchema = yup.object({
    email: yup
      .string()
      .required('El correo electrónico es requerido')
      .email('Ingresa un correo electrónico válido'),
    password: yup
      .string()
      .required('La contraseña es requerida')
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  })

  // Configurar formulario con Vee-Validate
  const { handleSubmit, errors, meta, validateField } = useForm({
    validationSchema,
    initialValues: {
      email: '',
      password: '',
    },
  })

  // Campos del formulario
  const { value: email } = useField('email')
  const { value: password } = useField('password')

  // Manejar envío del formulario
  const onSubmit = handleSubmit(async values => {
    authStore.clearError()

    const result = await authStore.login({
      email: values.email,
      password: values.password,
    })

    if (result.success) {
      const redirect = route.query.redirect || '/dashboard'
      router.push(redirect)
    }
  })
</script>
