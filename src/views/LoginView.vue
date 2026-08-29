<template>
  <div class="jn-login">
    <aside class="jn-login__brand">
      <div class="jn-login__mark">JN</div>
      <h1 class="jn-display text-h3 mb-3">Seguridad JN</h1>
      <p class="jn-login__tag">Control de personal, operaciones y planilla.</p>
    </aside>

    <main class="jn-login__form">
      <v-btn class="jn-login__theme" icon size="small" variant="text" @click="toggleTheme">
        <v-icon size="20">{{ theme.global.current.value.dark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
      </v-btn>

      <div class="jn-login__panel">
        <p class="jn-login__kicker">Acceso</p>
        <h2 class="jn-display text-h4 mb-6">Entrar al sistema</h2>

        <v-form @submit.prevent="onSubmit">
          <v-text-field
            v-model="email"
            class="mb-2"
            color="primary"
            :disabled="authStore.loading"
            :error-messages="errors.email"
            label="Correo"
            type="email"
            @blur="validateField('email')"
          />
          <v-text-field
            v-model="password"
            :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
            class="mb-2"
            color="primary"
            :disabled="authStore.loading"
            :error-messages="errors.password"
            label="Contraseña"
            :type="showPassword ? 'text' : 'password'"
            @blur="validateField('password')"
            @click:append-inner="showPassword = !showPassword"
          />
          <v-checkbox
            v-model="rememberEmail"
            class="mt-n2 mb-3"
            color="primary"
            density="compact"
            hide-details
            label="Recordar correo"
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
            :disabled="!meta.valid || authStore.loading"
            :loading="authStore.loading"
            rounded="0"
            size="large"
            type="submit"
          >
            Ingresar
          </v-btn>
        </v-form>
      </div>
    </main>
  </div>
</template>

<script setup>
  import { useField, useForm } from 'vee-validate'
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import * as yup from 'yup'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const theme = useTheme()

  const showPassword = ref(false)
  const rememberEmail = ref(false)
  const REMEMBER_EMAIL_KEY = 'login_email_jn'

  function toggleTheme () {
    theme.global.name.value = theme.global.current.value.dark ? 'jnLight' : 'jnDark'
    localStorage.setItem('jn-theme', theme.global.name.value)
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem('jn-theme')
    theme.global.name.value = savedTheme === 'jnDark' ? 'jnDark' : 'jnLight'
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY)
    if (savedEmail) {
      email.value = savedEmail
      rememberEmail.value = true
    }
  })

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

  const { handleSubmit, errors, meta, validateField } = useForm({
    validationSchema,
    initialValues: {
      email: '',
      password: '',
    },
  })

  const { value: email } = useField('email')
  const { value: password } = useField('password')

  const onSubmit = handleSubmit(async values => {
    authStore.clearError()

    const result = await authStore.login({
      email: values.email,
      password: values.password,
    })

    if (result.success) {
      if (rememberEmail.value) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, values.email)
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }
      const redirect = route.query.redirect || '/inicio'
      router.push(redirect)
    }
  })
</script>

<style scoped>
.jn-login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(280px, 42%) 1fr;
}

.jn-login__brand {
  background: var(--jn-blue-deep);
  color: #f2f5fa;
  padding: clamp(2rem, 6vw, 4.5rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.jn-login__mark {
  width: 56px;
  height: 56px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--jn-yellow);
  color: var(--jn-yellow);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.jn-login__tag {
  max-width: 18rem;
  margin: 0;
  color: var(--jn-yellow);
  letter-spacing: 0.04em;
}

.jn-login__form {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
}

.jn-login__theme {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.jn-login__panel {
  width: min(100%, 380px);
}

.jn-login__kicker {
  margin: 0 0 0.4rem;
  color: var(--jn-blue);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 600;
}

@media (max-width: 960px) {
  .jn-login {
    grid-template-columns: 1fr;
  }

  .jn-login__brand {
    min-height: 28vh;
    justify-content: flex-end;
  }
}
</style>
