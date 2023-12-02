<template>
  <div class="container text-center mt-5">
    <LanguageSelector />
    <img src="../assets/logo-todo.png" />
    <div class="row-custom">
      <div class="col-md-6 offset-md-3">
        <h1>{{ $t('login.title') }}</h1>
        <form class="needs-validation" novalidate @submit.prevent="submitForm">
          <div class="form-group">
            <label for="login">{{ $t('login.loginLabel') }}</label>
            <input type="text" class="form-control offset-md-3 login-field" id="login" pattern="[a-zA-Z0-9]+" ref="login">
            <div class="invalid-feedback" v-if="!isValidLogin && !isAuthFailed" >
              {{ $t('login.validationMessage') }}
            </div>
          </div>
          <div class="form-group">
            <label for="password">{{ $t('login.passwordLabel') }}</label>
            <input type="password" class="form-control offset-md-3 login-field" id="password" ref="password">
            <div class="invalid-feedback" v-if="!isValidPassword && !isAuthFailed">
              {{ $t('login.validationMessagePassword') }}
            </div>
          </div>
          <div class="feedback" v-if="isAuthFailed" ref="authFailed" >
              {{ $t(AuthMessage) }}
          </div>
          <button type="submit" class="btn btn-default">{{ $t('login.loginButton') }}</button>
          <a href="#/register">{{ $t('login.registerLink') }}</a>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import LanguageSelector from './LanguageSelector.vue'
import { setValidationClass } from '../utils/utils.js'

export default {
  name: 'Login',
  components: { LanguageSelector },
  data () {
    return {
      isValidLogin: true,
      isValidPassword: true,
      isAuthFailed: false,
      AuthMessage: ''
    }
  },
  methods: {

    async login (data) {
      try {
        const response = await this.$http.post('/login', data)
        if (response.status === 200) {
          const token = response.data.token
          localStorage.setItem('token', token)
          this.$router.push('/todos')
        }
      } catch (error) {
        const code = error.response.status
        if (code === 401) {
          this.isValidLogin = false
          this.isValidPassword = false
          setValidationClass(this.isValidLogin, this.$refs.login)
          setValidationClass(this.isValidPassword, this.$refs.password)
          this.isAuthFailed = true
          this.AuthMessage = error.response.data.message
        } else {
          console.error('Error during login:', error)
        }
      }
    },
    async submitForm () {
      if (!this.isValidLogin || !this.isValidPassword) {
        return
      }

      try {
        await this.login({
          login: this.$refs.login.value,
          password: this.$refs.password.value
        })
      } catch (error) {}
    }
  }
}
</script>

<style scoped>
h1,
h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

.login-field {
  max-width: 50%;
}
.feedback {
    width: 100%;
    margin-top: .25rem;
    font-size: .875em;
    color: var(--bs-form-invalid-color);
}

</style>
