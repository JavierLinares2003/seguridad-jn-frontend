<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col class="text-center" cols="12" md="6" sm="8">
        <v-card class="pa-8" elevation="0" rounded="xl">
          <div class="d-flex justify-center mb-4">
            <v-avatar color="error" size="100">
              <v-icon color="white" size="60">mdi-shield-lock</v-icon>
            </v-avatar>
          </div>
          <h1 class="text-h1 font-weight-bold text-error">403</h1>
          <h2 class="text-h5 mt-2 mb-4">Acceso No Autorizado</h2>
          <p class="text-body-1 text-medium-emphasis mb-6">
            No tienes los permisos necesarios para acceder a esta página.<br>
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
          <div class="d-flex justify-center ga-3">
            <v-btn color="primary" variant="outlined" @click="goBack">
              <v-icon start>mdi-arrow-left</v-icon>
              Regresar
            </v-btn>
            <v-btn color="primary" :to="{ name: 'inicio' }">
              <v-icon start>mdi-home</v-icon>
              Ir al Inicio
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { useRouter } from 'vue-router'

  const router = useRouter()

  function goBack () {
    router.back()
  }
</script>
