<template>
  <v-app class="jn-shell">
    <v-navigation-drawer
      v-model="drawer"
      class="jn-rail"
      color="#072A66"
      :permanent="mdAndUp"
      theme="dark"
      :temporary="!mdAndUp"
      width="248"
    >
      <div class="jn-rail__brand pa-5 pb-4">
        <div class="jn-rail__mark">JN</div>
        <div class="jn-display text-h6 mb-0 mt-3" style="color: #F2F5FA;">Seguridad JN</div>
        <p class="text-caption mb-0 mt-1" style="color: #F5C400; letter-spacing: 0.14em; text-transform: uppercase;">
          Central operativa
        </p>
      </div>

      <v-list class="px-2" density="compact" nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard-outline"
          rounded="0"
          title="Inicio"
          :to="{ name: 'inicio' }"
        />
        <v-list-item
          v-if="authStore.hasPermission('view-personal')"
          prepend-icon="mdi-account-group-outline"
          rounded="0"
          title="Personal"
          :to="{ name: 'personal' }"
        />
        <v-list-item
          v-if="authStore.hasPermission('view-proyectos')"
          prepend-icon="mdi-office-building-outline"
          rounded="0"
          title="Proyectos"
          :to="{ name: 'proyectos' }"
        />
        <v-list-item
          v-if="authStore.hasPermission('view-bodega')"
          prepend-icon="mdi-warehouse"
          rounded="0"
          title="Bodega"
          :to="{ name: 'bodega' }"
        />
        <v-list-item
          v-if="authStore.hasPermission('view-operaciones')"
          prepend-icon="mdi-radar"
          rounded="0"
          title="Operaciones"
          :to="{ name: 'operaciones' }"
        />
        <v-list-item
          v-if="authStore.hasPermission('view-operaciones')"
          prepend-icon="mdi-clipboard-check-outline"
          rounded="0"
          title="Asistencia"
          :to="{ name: 'operaciones-asistencia' }"
        />
        <v-list-item
          v-if="authStore.hasPermission('view-planillas')"
          prepend-icon="mdi-cash-multiple"
          rounded="0"
          title="Planillas"
          :to="{ name: 'operaciones-planillas' }"
        />

        <v-divider v-if="authStore.hasPermission('view-users') || authStore.hasPermission('manage-roles')" class="my-3 mx-3" color="#F5C400" opacity="0.28" />

        <v-list-item
          v-if="authStore.hasPermission('view-users')"
          prepend-icon="mdi-account-cog-outline"
          rounded="0"
          title="Usuarios"
          :to="{ name: 'configuracion-usuarios' }"
        />
        <v-list-item
          v-if="authStore.hasPermission('manage-roles')"
          prepend-icon="mdi-eye-lock-outline"
          rounded="0"
          subtitle="Quién ve cada pantalla"
          title="Roles y vistas"
          :to="{ name: 'configuracion-roles' }"
        />
        <v-list-item
          v-if="authStore.hasPermission('view-bitacora')"
          prepend-icon="mdi-history"
          rounded="0"
          title="Bitácora"
          :to="{ name: 'configuracion-bitacora' }"
        />
        <v-list-item
          v-if="authStore.hasPermission('manage-vacaciones')"
          prepend-icon="mdi-calendar-month-outline"
          rounded="0"
          title="Vacaciones"
          :to="{ name: 'configuracion-vacaciones' }"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="surface" density="comfortable" elevation="0" height="56">
      <v-app-bar-nav-icon v-if="!mdAndUp" class="ml-1" @click="drawer = !drawer" />

      <div class="d-none d-md-flex align-center px-2">
        <span class="text-caption text-medium-emphasis" style="letter-spacing: 0.16em; text-transform: uppercase;">
          {{ pageLabel }}
        </span>
      </div>

      <v-spacer />

      <v-btn class="mr-1" icon variant="text" @click="toggleTheme">
        <v-icon size="20">{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
      </v-btn>

      <template v-if="authStore.isAuthenticated">
        <v-menu :close-on-content-click="true">
          <template #activator="{ props }">
            <v-btn v-bind="props" class="text-none px-2 mr-2" rounded="0" variant="text">
              <span class="jn-avatar mr-2">{{ userInitials }}</span>
              <span class="d-none d-sm-inline text-body-2">{{ authStore.userName }}</span>
              <v-icon end size="16">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" min-width="200">
            <v-list-item prepend-icon="mdi-account-outline" title="Mi perfil" :to="{ name: 'profile' }" />
            <v-list-item prepend-icon="mdi-logout" title="Cerrar sesión" @click="handleLogout" />
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay, useTheme } from 'vuetify'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const theme = useTheme()
  const { mdAndUp } = useDisplay()

  const drawer = ref(true)

  watch(mdAndUp, value => {
    drawer.value = value
  })

  const isDark = computed(() => theme.global.current.value.dark)

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

  const labels = {
    inicio: 'Inicio',
    personal: 'Personal',
    proyectos: 'Proyectos',
    bodega: 'Bodega',
    operaciones: 'Operaciones',
    'operaciones-asistencia': 'Asistencia',
    'operaciones-planillas': 'Planillas',
    'configuracion-usuarios': 'Usuarios',
    'configuracion-roles': 'Roles y vistas',
    'configuracion-bitacora': 'Bitácora',
    'configuracion-vacaciones': 'Vacaciones',
    profile: 'Perfil',
  }

  const pageLabel = computed(() => {
    const name = String(route.name || '')
    if (labels[name]) return labels[name]
    const prefix = Object.keys(labels).find(key => name.startsWith(key))
    return labels[prefix] || 'Seguridad JN'
  })

  function toggleTheme () {
    theme.global.name.value = isDark.value ? 'jnLight' : 'jnDark'
    localStorage.setItem('jn-theme', theme.global.name.value)
  }

  function handleLogout () {
    authStore.logout()
    router.push({ name: 'login' })
  }

  onMounted(() => {
    const saved = localStorage.getItem('jn-theme')
    theme.global.name.value = saved === 'jnDark' ? 'jnDark' : 'jnLight'
    drawer.value = mdAndUp.value
  })
</script>

<style scoped>
.jn-rail__mark {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--jn-yellow);
  color: var(--jn-yellow);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.jn-avatar {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid currentColor;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}
</style>
