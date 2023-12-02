<template>
  <div class="card mb-3">
    <div class="custom-card-body">
      <div class="card-name-wrapper">
        <div class="align-items-center mx-3">
          <div class="d-flex">
            <div class="d-flex align-items-center card-title h5">
              <div class="form-check mb-0 me-3 align-middle">
                <input type="checkbox" class="form-check-input" id="completedCheckbox" v-model="todo.completed" @click="updateTodo">
              </div>
              {{ todo.name }}
            </div>
            <div class="ms-auto">
              <div class="d-flex">
                <div v-if="todo.date" class="date">
                  {{ todo.date }}
                </div>
                <button class="btn btn-link nav-link me-2" @click="editTodo">
                  <i class="bi bi-pen icon-small icon-secondary"></i>
                </button>
                <button class="btn btn-link nav-link" @click="deleteTodo">
                  <i class="bi bi-trash icon-small icon-secondary"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p class="card-text" v-if="todo.description">{{ todo.description }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Todo',
  props: {
    todo: {
      type: Object,
      required: true
    }
  },
  methods: {
    async sendRequest (apiRoute, body) {
      try {
        const token = localStorage.getItem('token')
        const response = await this.$http.post(apiRoute, body, {
          headers: {
            'Authorization': `${token}`
          }
        })

        return response.data
      } catch (error) {
        console.error(error.response)
      }
    },
    editTodo () {
      this.$emit('edit-todo', this.todo.todoid)
    },
    deleteTodo () {
      const body = {
        id: this.todo.todoid
      }

      this.sendRequest('/api/delete-todo', body)
      this.$emit('delete-todo', this.todo.todoid)
    },
    updateTodo () {
      this.todo.completed = !this.todo.completed

      const body = {
        id: this.todo.todoid,
        name: this.todo.name,
        description: this.todo.description,
        completed: this.todo.completed,
        date: this.todo.date
      }

      this.sendRequest('/api/update-todo', body)
    }
  }
}
</script>

<style>
.card-name-wrapper {
  border-bottom: 1.5px solid #f1f1f1;
}

.card {
  border: 1px solid #f1f1f1;
  box-shadow: 0 0 10px rgba(170, 170, 170, 0.25);
}

.custom-card-body {
  flex: 1 1 auto;
  padding: var(--bs-card-spacer-y) var(--bs-card-spacer-x);
  color: var(--bs-card-color);
  padding: 0px;
  padding-top: 5px;
  padding-bottom: 5px;
}

.form-check-input[type=checkbox] {
  border-radius: 100%;
  border-color: #f1f1f1;
}

.form-check-input[type=checkbox]:checked {
  background-color: green;
  border-color: green;
}

.form-check-input[type=checkbox]:focus {
  box-shadow: none;
  outline: none;
}

.h5 {
  font-size: 1.25rem;
}

.card-text {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  display: flex;
  margin-left: 16px;
}

.date {
  color: #c7cbcf;
  margin-right: 0.75rem;
}

</style>
