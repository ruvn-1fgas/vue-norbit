<template>
  <header class="navbar navbar-expand header-with-border">
    <a class="navbar-brand mx-4 my-2" href="#">
      <img src="../assets/logo-todo-1.png" alt="Logo" height="20" class="align-baseline" />
    </a>
    <!-- Right side -->
    <div class="navbar-nav ml-auto ms-auto mx-2">
      <button class="btn btn-link nav-link" @click="changeLanguage">
        <i class="bi bi-translate icon icon-secondary"></i>
      </button>
      <button class="btn btn-link nav-link" @click="handleAddClick">
          <i class="bi bi-plus-circle icon icon-secondary"></i>
      </button>
      <div class="dropdown">
        <button class="btn btn-link nav-link" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" @click="toggleDropdownMenu">
          <i class="bi bi-three-dots-vertical icon"></i>
        </button>
        <div class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton" ref="dropdown">
          <button class="dropdown-item btn btn-link nav-link" @click="logout">
            {{ $t('todos.logout') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal window for creating todo's -->
    <div class="modal" id="createTodoModal" tabindex="-1" role="dialog" aria-labelledby="createTodoModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="createTodoModalLabel">{{ $t('todos.createTodo') }}</h5>
            <button type="button" class="btn btn-link nav-link" data-dismiss="modal" aria-label="Close" @click="closeModal">
              <!-- <span aria-hidden="true">&times;</span> -->
              <i class="bi bi-x-circle icon-secondary small-icon align-bottom"></i>
            </button>
          </div>
          <div class="modal-body">
            <!-- Form inputs for todo name, description, date, and time -->
            <form>
              <div class="form-group">
                <label for="todoName">{{ $t('todos.todoName') }}</label>
                <input type="text" class="form-control" id="todoName" maxlength="50" v-model="todoName" ref="todoName">
                <div class="invalid-feedback" v-if="!isValidName">
                  {{ $t('addTodo.validationMessageName') }}
                </div>
              </div>
              <div class="form-group">
                <label for="todoDescription">{{ $t('todos.todoDescription') }}</label>
                <textarea class="form-control" style="max-height: 200px;" id="todoDescription" maxlength="128" v-model="todoDescription" ref="todoDesc"></textarea>
                <div class="invalid-feedback" v-if="!isValidDesc">
                  {{ $t('addTodo.validationMessageDescription') }}
                </div>
              </div>
              <!-- Date and time inputs -->
              <div class="form-group">
                <!-- wrapper for label and calendar -->
                <div class="row my-3">
                  <label class="mx-2 form-label">{{ $t('todos.todoDateTime') }}
                    <Flatpickr class="flatpickr" v-model="todoDate" :config="flatpickrConfig"/>
                  </label>
                  <div class="invalid-feedback" v-if="!isValidDate">
                    {{ $t(DateValidationMessage) }}
                  </div>
                </div>
                <!-- add input calendar for date -->
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal" data-dismiss="modal">{{ $t('todos.cancel') }}</button>
            <button type="button" class="btn btn-primary" @click="handleAddTodo">{{ $t('todos.addTodo') }}</button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import Flatpickr from 'vue-flatpickr-component'
import { Russian } from 'flatpickr/dist/l10n/ru.js'
import { english } from 'flatpickr/dist/l10n/default.js'
import 'flatpickr/dist/flatpickr.css'
import { setValidationClass, clearValidationClasses, validateNameDesc, validateDateTime } from '../utils/utils.js'

export default {
  name: 'Header',
  components: { Flatpickr },
  data () {
    return {
      todoName: '',
      todoDescription: '',
      todoDate: '',
      // validation
      isValidName: true,
      isValidDesc: true,
      isValidDate: true,
      DateValidationMessage: '',
      // calendar config
      flatpickrConfig: {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
        defaultHour: new Date().getHours(),
        defaultMinute: new Date().getMinutes(),
        minHour: new Date().getHours(),
        minMinute: new Date().getMinutes(),
        minDate: new Date(),
        locale: this.$i18n.locale === 'en' ? english : Russian
      }
    }
  },
  methods: {
    handleAddClick () {
      // eslint-disable-next-line no-undef
      const modal = new bootstrap.Modal(document.getElementById('createTodoModal'))
      modal.show()
    },
    validateForm () {
      this.isValidName = validateNameDesc(this.$refs.todoName.value, 50, 0)
      this.isValidDesc = validateNameDesc(this.$refs.todoDesc.value, 128)

      const isDateValid = validateDateTime(this.todoDate)

      if (!isDateValid.result) {
        this.DateValidationMessage = isDateValid.message
      } else {
        this.DateValidationMessage = ''
      }

      setValidationClass(this.isValidName, this.$refs.todoName)
      setValidationClass(this.isValidDesc, this.$refs.todoDesc)
    },
    async addTodo () {
      const body = {
        name: this.todoName,
        description: this.todoDescription,
        date: this.todoDate
      }

      try {
        const response = await this.$http.post('/api/add-todo', body, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        })

        if (response.status === 201) {
          this.$emit('todoAdded')
          this.closeModal()
        }
      } catch (error) {
        const statusCode = error.response.status
        if (statusCode === 400) {
          const code = error.response.data.code

          this.isValidName = code !== 0
          this.isValidDesc = code !== 1
          if (code === 2 || code === 3) {
            this.isValidDate = false
            this.DateValidationMessage = error.response.data.error
          }
        } else {
          console.error('Error during post request', error.response.message)
        }
      }
    },
    handleAddTodo () {
      this.validateForm()

      if (!this.isValidName || !this.isValidDesc || !this.isValidDate) {
        return
      }

      this.addTodo()
    },
    closeModal () {
      // eslint-disable-next-line no-undef
      const modal = bootstrap.Modal.getInstance(document.getElementById('createTodoModal'))
      modal.hide()

      this.clearModal()
    },
    clearModal () {
      clearValidationClasses(this.$refs.todoName)
      clearValidationClasses(this.$refs.todoDesc)

      this.todoName = ''
      this.todoDescription = ''
      this.todoDate = ''
    },
    changeLanguage () {
      const currentLanguage = this.$i18n.locale
      const nextLanguage = currentLanguage === 'en' ? 'ru' : 'en'
      this.$i18n.locale = nextLanguage
      this.$emit('localeChanged')
      localStorage.setItem('language', nextLanguage)
      this.flatpickrConfig.locale = this.$i18n.locale === 'en' ? english : Russian
    },
    toggleDropdownMenu () {
      const dropdown = this.$refs.dropdown
      if (dropdown) {
        dropdown.classList.toggle('show')
      }
    },
    logout () {
      localStorage.removeItem('token')
      this.$router.push('/login')
    }
  },
  mounted () {
    const language = localStorage.getItem('language')
    if (!language || language === 'en') {
      const indicator = this.$el.querySelector('.active-indicator')
      if (indicator) {
        indicator.style.left = '153.555px'
      }
    }
  }
}
</script>

<style>

.active {
  color: black;
}

.active-indicator {
  background-color: black;
  border-radius: 10px;
  content: '';
  display: block;
  height: 4.5px;
  position: absolute;
  top: 10px;
  transform: translateX(0%);
  width: 20px;
}

.dropdown-menu {
  display: block;
  opacity: 0;
  visibility: hidden;
  transition: all 0.1s ease-in-out;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
}

.dropdown-menu-end {
  right: 0;
}

.extra-small-icon {
  font-size: var(--bs-body-font-size);
  color: #c7cbcf;
}

.extra-small-icon:hover {
  color: #2c3e50;
}

.form-label {
  color: #2c3e50;
  font-size: var(--bs-body-font-size);
  font-style: normal;
}

.flatpickr {
  color: #2c3e50;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

.header-with-border {
  border-bottom: 2px solid #ececec;
}
.nav-link-custom {
  color: black;
}
.modal {
  background: rgba(0, 0, 0, 0.3);
}

.icon {
  color: black;
  font-size: 30px;
}

.small-icon {
  font-size: 20px;
}

.icon-secondary {
  color: #c7cbcf;
}

.icon-secondary:hover {
  color: black;
  transition: color 0.2s ease-in-out;
}

.navbar-nav {
  margin-bottom: 1px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.text {
  font-size: 20px;
  font-weight: 600;
}

.text-muted-custom {
  color: #9ba2ab;
}

</style>
