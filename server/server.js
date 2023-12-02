const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const path = require('path')
const cors = require('cors')
const jwt = require('jsonwebtoken')

const { Pool } = require('pg')

const app = express()
const port = 1235

const secretKey = '3436714fdb8fd6f36ac9803a6ef4bbe0be4d1d409a4ed73776ed083a47f4ad9169d2213c9687e298c564dc0c0f4f49cf'
app.use(express.static(path.join(__dirname, '../dist')))

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vue-norbit',
  password: 'root',
  port: 5432
})

app.use(bodyParser.json())
app.use(cors())

app.post('/login', async (req, res) => {
  const { login, password } = req.body

  const isAuth = await authUser(login, password)
  if (isAuth.result) {
    const token = generateToken(login)

    res.json({ status: 'ok', token })
  } else {
    res.status(401).json(
      {
        error: 'Authentication failed',
        message: isAuth.message
      }
    )
  }
})

app.post('/register', async (req, res) => {
  const { login, password } = req.body

  const { hashedPassword, salt } = await hashPassword(password)

  const isExists = await isUserExists(login)

  if (isExists) {
    res.status(409).json(
      {
        error: 'Registration failed',
        message: 'register.userExists'
      }
    )
  } else {
    const client = await pool.connect()

    if (!validateLogin(login)) {
      res.status(400).json(
        {
          error: 'Registration failed',
          message: 'register.validationMessage',
          code: 0
        }
      )
    }

    if (!validatePassword(password)) {
      res.status(400).json(
        {
          error: 'Registration failed',
          message: 'register.validationMessagePassword',
          code: 1
        }
      )
    }

    try {
      await client.query('INSERT INTO users(login, password, salt) VALUES($1, $2, $3)', [login, hashedPassword, salt])
      res.json({ status: 'ok' })
    } finally {
      client.release()
    }
  }
})

app.post('/verify', verifyToken, (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/todos', verifyToken, async (req, res) => {
  const username = req.user.username
  try {
    const client = await pool.connect()

    try {
      const userResult = await client.query('SELECT userId FROM users WHERE login = $1', [username])
      const userId = userResult.rows[0].userid

      const date = req.query.date
      const todoResult = await client.query('SELECT todoid, name, description, date, completed FROM todos WHERE userid = $1', [userId])
      const currentDate = getCurrentDate()

      if (!date) {
        res.json(todoResult.rows)
      } else {
        const dateWithoutHours = date.split(' ')[0]
        const filteredTodos = todoResult.rows.filter(todo => {
          if (todo.date) {
            const todoDate = todo.date.split(' ')[0]
            return todoDate === dateWithoutHours
          } else {
            if (dateWithoutHours === currentDate) {
              return true
            }
          }
        })

        res.json(filteredTodos)
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error executing query:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/api/delete-todo', verifyToken, async (req, res) => {
  const username = req.user.username
  try {
    const client = await pool.connect()

    const userResult = await client.query('SELECT userId FROM users WHERE login = $1', [username])
    const userId = userResult.rows[0].userid

    const { id } = req.body

    await client.query('DELETE FROM todos WHERE todoid = $1 AND userid = $2', [id, userId])

    res.status(201).json({ status: 'ok' })
  } catch (error) {
    console.error('Error executing query:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/api/update-todo', verifyToken, async (req, res) => {
  const username = req.user.username
  try {
    const client = await pool.connect()

    const userResult = await client.query('SELECT userId FROM users WHERE login = $1', [username])
    const userId = userResult.rows[0].userid
    const { id, name, description, date, completed } = req.body
    const validateResult = validateTodoData(name, description)

    if (!validateResult.result) {
      res.status(400).json(
        {
          error: 'Update todo failed',
          message: validateResult.message,
          code: validateResult.code
        })
      return false
    }

    const todoResult = await client.query('UPDATE todos SET name = $1, description = $2, date = $3, completed = $4 WHERE todoid = $5 AND userid = $6 RETURNING *', [name, description, date || null, completed, id, userId])
    res.status(201).json(todoResult.rows[0])
  } catch (error) {
    console.error('Error executing query:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

function validateTodoData (name, description, date = '') {
  if (!name || name.length > 50) {
    return {
      result: false,
      message: 'addTodo.validationMessageName',
      code: 0
    }
  }

  if (description.length > 128) {
    return {
      result: false,
      message: 'addTodo.validationMessageDescription',
      code: 1
    }
  }

  if (date) {
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(date)) {
      return {
        result: false,
        message: 'addTodo.validationMessageInvalidDate',
        code: 2
      }
    }

    const currentDate = new Date()
    const todoDate = new Date(date)

    if (todoDate < currentDate.setHours(currentDate.getHours() - 1)) {
      return {
        result: false,
        message: 'addTodo.validationMessageDateLessThanCurrent',
        code: 3
      }
    }
  }

  return {
    result: true,
    message: ''
  }
}

app.post('/api/add-todo', verifyToken, async (req, res) => {
  const username = req.user.username
  try {
    const client = await pool.connect()

    const userResult = await client.query('SELECT userId FROM users WHERE login = $1', [username])
    const userId = userResult.rows[0].userid

    const { name, description, date } = req.body

    const validateResult = validateTodoData(name, description, date)

    if (!validateResult.result) {
      res.status(400).json(
        {
          error: 'Add todo failed',
          message: validateResult.message,
          code: validateResult.code
        })
      return false
    }

    const todoResult = await client.query('INSERT INTO todos(name, description, date, userid, completed) VALUES($1, $2, $3, $4, $5) RETURNING *', [name, description, date || null, userId, false])

    res.status(201).json(todoResult.rows[0])
  } catch (error) {
    console.error('Error executing query:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

function validatePassword (password) {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!$%@#£€*?&]{8,20}$/.test(password)
}

function validateLogin (login) {
  return /^[a-zA-Z0-9]{5,12}$/.test(login)
}

async function isUserExists (login) {
  const client = await pool.connect()

  try {
    const result = await client.query('SELECT * FROM users WHERE login = $1', [login])
    return result.rowCount > 0
  } finally {
    client.release()
  }
}

async function authUser (login, password) {
  const client = await pool.connect()

  try {
    const result = await client.query('SELECT * FROM users WHERE login = $1', [login])
    if (result.rowCount === 0) {
      return {
        result: false,
        message: 'login.userNotFound'
      }
    }

    const user = result.rows[0]
    if (!verifyPassword(password, user.password, user.salt)) {
      return {
        result: false,
        message: 'login.wrongPassword'
      }
    }

    return {
      result: result.rowCount > 0,
      message: ''
    }
  } finally {
    client.release()
  }
}

function verifyToken (req, res, next) {
  const token = req.headers['authorization']
  if (!token) {
    return res.status(403).json({ error: 'Token is missing' })
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Attach the decoded payload to the request for further use
    req.user = decoded
    next()
  })
}

function generateToken (username) {
  return jwt.sign({ username }, secretKey, { expiresIn: '24h' })
}

function verifyPassword (password, hashedPassword, salt) {
  const hash = bcrypt.hashSync(password, salt)
  return hash === hashedPassword
}

async function hashPassword (password, salt = null) {
  const saltRounds = 10
  salt = await bcrypt.genSalt(saltRounds)

  const hashedPassword = await bcrypt.hash(password, salt)

  return {hashedPassword, salt}
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

function getCurrentDate () {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
