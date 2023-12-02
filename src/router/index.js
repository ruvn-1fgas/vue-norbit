import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/components/Login'
import Register from '@/components/Register'
import TodoList from '@/components/TodoList'

Vue.use(Router)
const router = new Router({
  routes: [
    {
      path: '/',
      name: 'Main page',
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/login',
      name: 'Login page',
      component: Login
    },
    {
      path: '/register',
      name: 'Register page',
      component: Register
    },
    {
      path: '/todos',
      name: 'TodoList',
      component: TodoList,
      meta: {
        'requiresAuth': true
      }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await Vue.prototype.$http.post('/verify', {}, {
          headers: {
            'Authorization': `${token}`
          }
        })
        if (response.status === 200) {
          if (to.path === '/') {
            next('/todos')
          } else {
            next()
          }
        }
      } catch (error) {
        localStorage.removeItem('token')
        next('/login')
        console.error(error.response.data.error)
      }
    } else {
      next('/login')
    }
  } else {
    next()
  }
})

export default router
