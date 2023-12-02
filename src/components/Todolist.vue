<template>
  <div>
    <Header @localeChanged="updateCurrentDate" @todoAdded="updateTodos" />
    <div class="wrapper">
      <div class="left-side">
        <div style="display: flex; padding-bottom: 10px;">
          <h2 class="text">{{ currentDateStr }}</h2>
          <Flatpickr class="flatpickr open" v-model="currentDate" :config="calendarConfig"/>
        </div>
        <Todo v-for="todo in sortedTodos" :key="todo.todoid" :todo="todo" :todoid="todoid" @delete-todo="deleteTodo" @edit-todo="handleEditTodo" />
        </div>
    </div>
    <!-- Calendar modal -->
    <div class="modal" id="calendarModal" tabindex="-1" tole="dialog" aria-labelledby="calendarModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editTodoModalLabel">{{ $t('todos.selectDate') }}</h5>
              <button type="button" class="btn btn-link nav-link" data-dismiss="modal" aria-label="Close" @click="closeCalendarModal">
                <i class="bi bi-x-circle icon-secondary small-icon align-bottom"></i>
              </button>
          </div>
          <div class="modal-body">
          </div>
          </div>
      </div>
    </div>
    <!-- Modal window for editing todo's -->
    <div  class="modal" id="editTodoModal" tabindex="-1" role="dialog" aria-labelledby="editTodoModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editTodoModalLabel">{{ $t('todos.editTodo') }}</h5>
            <button type="button" class="btn btn-link nav-link" data-dismiss="modal" aria-label="Close" @click="closeModal">
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
            <button type="button" class="btn btn-primary" @click="updateTodo">{{ $t('todos.editTodoBtn') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Flatpickr from 'vue-flatpickr-component'
import { Russian } from 'flatpickr/dist/l10n/ru.js'
import { english } from 'flatpickr/dist/l10n/default.js'
import 'flatpickr/dist/flatpickr.css'
import Header from './Header'
import Todo from './Todo'
import { dateToString, setValidationClass, clearValidationClasses, validateNameDesc, validateDateTime } from '../utils/utils.js'

export default {
  name: 'Todolist',
  components: { Header, Todo, Flatpickr },
  data () {
    return {
      currentDateStr: '',
      currentDate: new Date(),
      todos: [],
      todoName: '',
      todoDescription: '',
      todoDate: '',
      todoCompleted: false,
      todoid: -1,
      todo: null,
      isValidName: true,
      isValidDesc: true,
      isValidDate: true,
      DateValidationMessage: '',
      // calendar config
      flatpickrConfig: {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
        locale: this.$i18n.locale === 'en' ? english : Russian,
        defaultDate: this.todoDate
      },
      calendarConfig: {
        enableTime: false,
        dateFormat: 'Y-m-d',
        locale: this.$i18n.locale === 'en' ? english : Russian
      }
    }
  },
  methods: {
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
    async updateTodo () {
      this.validateForm()
      if (!this.isValidName || !this.isValidDesc || !this.isValidDate) {
        return
      }

      const body = {
        id: this.todoid,
        name: this.todoName,
        description: this.todoDescription,
        date: this.todoDate,
        completed: this.todoCompleted
      }

      try {
        const response = await this.$http.post('/api/update-todo', body, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        })
        if (response.status === 200) {
          this.closeModal()
          this.updateTodos()
          return response.data
        }
      } catch (error) {
        console.error(error.response)
        const statusCode = error.response.status
        if (statusCode === 400) {
          const code = error.response.data.code

          this.isValidName = code !== 0
          this.isValidDesc = code !== 1
          if (code === 2 || code === 3) {
            this.isValidDate = false
            this.DateValidationMessage = error.response.data.message
          }
        } else {
          console.error('Error during post request', error.response.message)
        }
      }
    },
    handleEditTodo (todoId) {
      const todo = this.todos.find(todo => todo.todoid === todoId)
      this.todoName = todo.name
      this.todoDescription = todo.description
      this.todoDate = todo.date
      this.todoCompleted = todo.completed
      this.todoid = todo.todoid
      console.log(todo.date)

      // eslint-disable-next-line no-undef
      const modal = new bootstrap.Modal(document.getElementById('editTodoModal'), {
        keyboard: false
      })
      modal.show()
    },
    closeCalendarModal () {
      // eslint-disable-next-line no-undef
      const modal = bootstrap.Modal.getInstance(document.getElementById('calendarModal'))
      modal.hide()
    },
    closeModal () {
      // eslint-disable-next-line no-undef
      const modal = bootstrap.Modal.getInstance(document.getElementById('editTodoModal'))
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
    updateCurrentDate () {
      const options = { day: 'numeric', month: 'long' }
      let locale = this.$i18n.locale
      if (locale === 'en') {
        locale = 'en-uk'
      }
      const date = new Date(this.currentDate)
      this.currentDateStr = date.toLocaleDateString(locale, options)
    },
    async updateTodos () {
      try {
        const token = localStorage.getItem('token')
        const response = await this.$http.get('/api/todos', {
          headers: {
            'Authorization': `${token}`
          },
          params: {
            date: dateToString(new Date(this.currentDate))
          }
        })
        this.todos = response.data
      } catch (error) {}
    },
    deleteTodo (todoId) {
      this.todos = this.todos.filter(todo => todo.todoid !== todoId)
    }
  },
  async created () {
    this.updateCurrentDate()
    await this.updateTodos()
  },
  computed: {
    sortedTodos () {
      return this.todos.slice().sort((a, b) => {
        // Sort by completed status (completed todos at the bottom)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1
        }

        // Sort by date (newer - upper)
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        if (dateA < dateB) {
          return -1
        } else if (dateA > dateB) {
          return 1
        }

        // Sort by name
        return a.name.localeCompare(b.name)
      })
    }
  },
  watch: {
    currentDate (newDate) {
      this.updateCurrentDate()
      this.updateTodos()
    }
  }
}
</script>

<style scoped>

.left-side {
  flex: 0.4;
  padding: 20px;
}

.right-side {
  flex: 3;
  padding: 20px;
}

.text {
  color: black;
  font-size: 1.5rem;
  font-weight: bold;
  width: 9rem;
}

.wrapper {
  display: block;
  width: 100%;
}

</style>
