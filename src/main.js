// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import App from './App'
import router from './router'
import messages from './locales'
import axios from 'axios'

import LanguageSelector from './components/LanguageSelector.vue'
axios.defaults.baseURL = 'http://localhost:1235'

Vue.config.productionTip = false
Vue.use(VueI18n)
Vue.prototype.$http = axios
Vue.component('LanguageSelector', LanguageSelector)

const i18n = new VueI18n({
  locale: 'en',
  messages
})

/* eslint-disable no-new */
Vue.config.productionTip = false
new Vue({
  i18n,
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
