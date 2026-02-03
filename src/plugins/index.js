/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

import router from '@/router'
import pinia from '@/stores'
import permissions from './permissions'
// Plugins
import vuetify from './vuetify'

export function registerPlugins (app) {
  app
    .use(pinia) // Pinia debe registrarse antes de permissions
    .use(vuetify)
    .use(router)
    .use(permissions)
}
