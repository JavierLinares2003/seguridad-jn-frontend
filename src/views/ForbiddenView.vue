<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col class="text-center" cols="12" md="6" sm="8">
        <v-icon color="error" size="120">mdi-shield-lock</v-icon>
        <h1 class="text-h2 mt-4">403</h1>
        <h2 class="text-h5 mt-2">Acceso Denegado</h2>
        <p class="text-body-1 mt-4">
          No tienes permisos para acceder a esta página.
        </p>
        <v-btn class="mt-6" color="primary" :to="{ name: 'dashboard' }">
          <v-icon start>mdi-home</v-icon>
          Volver al Dashboard
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
