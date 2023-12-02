<template>
  <div class="container text-center mt-5">
    <LanguageSelector />
    <img src="../assets/logo-todo.png" />
    <div class="row-custom">
      <div class="col-md-6 offset-md-3">
        <h1>{{ $t('register.title') }}</h1>
        <form class="needs-validation" novalidate @submit.prevent="submitForm">
          <div class="form-group">
            <label for="login">{{ $t('register.loginLabel') }}</label>
            <input type="text" class="form-control offset-md-3 login-field" id="login" pattern="[a-zA-Z0-9]+" ref="login">
            <div class="invalid-feedback" v-if="!isValidLogin && !isRegFailed">
              {{ $t('register.validationMessage') }}
            </div>
          </div>
          <div class="form-group">
            <label for="password">{{ $t('register.passwordLabel') }}</label>
            <input type="password" class="form-control offset-md-3 login-field" id="password" ref="password">
            <div class="invalid-feedback" v-if="!isValidPassword && !isRegFailed">
              {{ $t('register.validationMessagePassword') }}
            </div>
            <label for="password">{{ $t('register.confirmPasswordLabel') }}</label>
            <input type="password" class="form-control offset-md-3 login-field" id="confirmPassword" ref="confirmPassword">
            <div class="invalid-feedback" v-if="!isValidConfirmPassword && !isRegFailed">
              {{ $t('register.validationMessageConfirmPassword') }}
            </div>
          </div>
          <div class="feedback" v-if="isRegFailed" ref="authFailed">
            {{ $t(RegMessage) }}
          </div>
          <button type="submit" class="btn btn-default">{{ $t('register.registerButton') }}</button>
          <a href="#/login">{{ $t('register.loginLink') }}</a>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import LanguageSelector from './LanguageSelector.vue'
import { setValidationClass, validatePassword, validateLogin } from '../utils/utils.js'

export default {
  name: 'Register',
  components: { LanguageSelector },
  data () {
    return {
      isValidLogin: true,
      isValidPassword: true,
      isValidConfirmPassword: true,
      isRegFailed: false,
      RegMessage: ''
    }
  },
  methods: {
    validateForm () {
      this.isValidPassword = validatePassword(this.$refs.password.value)
      this.isValidLogin = validateLogin(this.$refs.login.value)

      if (this.isValidPassword) {
        this.isValidConfirmPassword = this.$refs.password.value === this.$refs.confirmPassword.value
      }

      setValidationClass(this.isValidLogin, this.$refs.login)
      setValidationClass(this.isValidPassword, this.$refs.password)
    },
    async register (data) {
      try {
        const response = await this.$http.post('/register', data)
        if (response.status === 200) {
          this.$router.push('/login')
        }
      } catch (error) {
        const code = error.response.status
        if (code === 409 || code === 400) {
          this.isValidLogin = code !== 400 || error.response.data.code !== 1
          this.isValidPassword = code !== 400 || error.response.data.code !== 0
          setValidationClass(this.isValidLogin, this.$refs.login)
          setValidationClass(this.isValidPassword, this.$refs.password)
          this.isRegFailed = true
          this.RegMessage = error.response.data.message
        } else {
          console.error('Error during registration:', error)
        }
      }
    },
    async submitForm () {
      this.validateForm()
      if (!this.isValidLogin || !this.isValidPassword || !this.isValidConfirmPassword) {
        return
      }

      try {
        await this.register({
          login: this.$refs.login.value,
          password: this.$refs.password.value
        })
      } catch (error) {
        console.error('Error during registration:', error)
      }
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
.row-custom {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-wrap: wrap;
    flex-wrap: wrap;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
}
</style>
