<template>
  <div class="language-selector">
    <i class="bi bi-translate" style="font-size: 30px" @click="changeLanguage"></i>
  </div>
</template>

<script>
export default {
  name: 'LanguageSelector',
  methods: {
    changeLanguage () {
      const currentLanguage = this.$i18n.locale
      const nextLanguage = currentLanguage === 'en' ? 'ru' : 'en'

      this.$i18n.locale = nextLanguage
      localStorage.setItem('language', nextLanguage)
    }
  }
}
</script>

<style scoped>
.language-selector {
  position: fixed;
  top: 10px;
  right: 20px;
  z-index: 100;
  padding-top: 7px;
}

.bi-translate {
  cursor: pointer;
}
</style>
