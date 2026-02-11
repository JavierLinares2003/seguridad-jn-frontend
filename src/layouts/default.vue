<template>
  <v-app>
    <!-- App Bar mejorada -->
    <v-app-bar color="primary" density="comfortable" elevation="4">
      <v-app-bar-nav-icon
        class="ml-1"
        @click="drawer = !drawer"
      />

      <v-app-bar-title class="font-weight-bold">
        <router-link class="text-white text-decoration-none d-flex align-center" to="/">
          <v-icon class="mr-2" icon="mdi-shield-check" />
          Seguridad JN
        </router-link>
      </v-app-bar-title>

      <v-spacer />

      <v-btn
        class="mr-2"
        color="white"
        icon
        variant="text"
        @click="toggleTheme"
      >
        <v-icon>{{ theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <template v-if="authStore.isAuthenticated">
        <v-menu
          :close-on-content-click="true"
          transition="slide-y-transition"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              class="text-none px-3"
              color="white"
              rounded="pill"
              variant="tonal"
            >
              <v-avatar
                class="mr-2 elevation-2"
                color="secondary"
                size="32"
              >
                <span class="text-caption font-weight-bold">{{ userInitials }}</span>
              </v-avatar>
              <span class="d-none d-sm-inline font-weight-medium">{{ authStore.userName }}</span>
              <v-icon end size="small">mdi-chevron-down</v-icon>
            </v-btn>
          </template>

          <v-card elevation="8" min-width="200" rounded="lg">
            <v-card-text class="pa-2">
              <v-list density="compact" nav rounded="lg">
                <v-list-item
                  color="primary"
                  prepend-icon="mdi-account-circle-outline"
                  rounded="lg"
                  :to="{ name: 'profile' }"
                >
                  <v-list-item-title class="font-weight-medium">Mi Perfil</v-list-item-title>
                </v-list-item>
                <v-divider class="my-1" />
                <v-list-item
                  base-color="error"
                  color="error"
                  prepend-icon="mdi-logout-variant"
                  rounded="lg"
                  @click="handleLogout"
                >
                  <v-list-item-title class="font-weight-medium">Cerrar Sesion</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-menu>
      </template>

      <template v-else>
        <v-btn
          class="text-primary text-none font-weight-bold mr-2"
          color="white"
          rounded="pill"
          :to="{ name: 'login' }"
          variant="elevated"
        >
          <v-icon size="small" start>mdi-login</v-icon>
          Iniciar Sesion
        </v-btn>
      </template>
    </v-app-bar>

    <!-- Navigation Drawer mejorado -->
    <v-navigation-drawer
      v-model="drawer"
      elevation="8"
      temporary
    >
      <!-- Header del drawer -->
      <v-sheet class="pa-4" color="primary">
        <div class="d-flex align-center">
          <v-avatar class="elevation-4" color="white" size="48">
            <v-icon color="primary" icon="mdi-shield-check" size="28" />
          </v-avatar>
          <div class="ml-3">
            <h3 class="text-subtitle-1 font-weight-bold text-white">Seguridad JN</h3>
            <p class="text-caption text-white-darken-1 mb-0">Panel de Control</p>
          </div>
        </div>
      </v-sheet>

      <v-divider />

      <v-list class="pa-2" nav>
        <v-list-subheader class="text-overline">Menu Principal</v-list-subheader>

        <v-list-item
          class="mb-1"
          color="primary"
          prepend-icon="mdi-home-outline"
          rounded="lg"
          title="Inicio"
          :to="{ name: 'inicio' }"
        />

        <v-list-item
          v-if="authStore.hasPermission('view-personal')"
          class="mb-1"
          color="primary"
          prepend-icon="mdi-account-group-outline"
          rounded="lg"
          title="Personal"
          :to="{ name: 'personal' }"
        />

        <v-list-item
          v-if="authStore.hasPermission('view-proyectos')"
          class="mb-1"
          color="primary"
          prepend-icon="mdi-folder-outline"
          rounded="lg"
          title="Proyectos"
          :to="{ name: 'proyectos' }"
        />

        <v-list-item
          v-if="authStore.hasPermission('view-operaciones')"
          class="mb-1"
          color="primary"
          prepend-icon="mdi-swap-horizontal"
          rounded="lg"
          title="Operaciones"
          :to="{ name: 'operaciones' }"
        />

        <v-list-item
          v-if="authStore.hasPermission('view-operaciones')"
          class="mb-1"
          color="primary"
          prepend-icon="mdi-clipboard-check-outline"
          rounded="lg"
          title="Asistencia"
          :to="{ name: 'operaciones-asistencia' }"
        />

        <v-divider v-if="authStore.hasPermission('view-users')" class="my-2" />
        <v-list-subheader v-if="authStore.hasPermission('view-users')" class="text-overline">Configuracion</v-list-subheader>

        <v-list-item
          v-if="authStore.hasPermission('view-users')"
          class="mb-1"
          color="primary"
          prepend-icon="mdi-account-cog-outline"
          rounded="lg"
          title="Usuarios"
          :to="{ name: 'configuracion-usuarios' }"
        />

        <v-list-item
          v-if="authStore.hasPermission('view-roles')"
          class="mb-1"
          color="primary"
          prepend-icon="mdi-shield-lock-outline"
          rounded="lg"
          title="Roles"
          :to="{ name: 'configuracion-roles' }"
        />

        <v-list-item
          v-if="authStore.hasPermission('view-bitacora')"
          class="mb-1"
          color="primary"
          prepend-icon="mdi-history"
          rounded="lg"
          title="Bitacora"
          :to="{ name: 'configuracion-bitacora' }"
        />
      </v-list>

      <template #append>
        <v-divider />
        <div class="pa-3">
          <p class="text-caption text-medium-emphasis text-center mb-0">
            Version 1.0.0
          </p>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main content -->
    <v-main>
      <router-view />
    </v-main>

    <!-- Footer mejorado -->
    <v-footer app class="bg-grey-darken-3 py-3">
      <v-row align="center" justify="center" no-gutters>
        <v-col class="text-center" cols="12">
          <span class="text-body-2 text-grey-lighten-1">
            © {{ new Date().getFullYear() }} <strong>Seguridad JN</strong> — Todos los derechos reservados
          </span>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()
  const theme = useTheme()

  const drawer = ref(false)

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

  function toggleTheme () {
    theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
    localStorage.setItem('theme', theme.global.name.value)
  }

  function handleLogout () {
    authStore.logout()
    router.push({ name: 'login' })
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      theme.global.name.value = savedTheme
    }
  })
</script>
