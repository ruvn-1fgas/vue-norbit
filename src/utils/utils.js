const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/
const loginRegex = /^[a-zA-Z0-9]{5,12}$/
const validClass = 'is-valid'
const invalidClass = 'is-invalid'

export function setValidationClass (isValid, element) {
  element.classList.remove(isValid ? invalidClass : validClass)
  element.classList.add(isValid ? validClass : invalidClass)
}

export function clearValidationClasses (element) {
  element.classList.remove(validClass)
  element.classList.remove(invalidClass)
}

function validate (text, regex) {
  return regex.test(text)
}

export function validatePassword (password) {
  return validate(password, passwordRegex)
}

export function validateLogin (login) {
  return validate(login, loginRegex)
}

export function validateNameDesc (text, maxLength, minLength = -1) {
  if (minLength !== -1) {
    return text.length > 0 && text.length <= maxLength
  } else {
    return text.length <= maxLength
  }
}

export function validateDateTime (date) {
  if (!date) {
    return true
  }

  const currentDate = new Date()
  const todoDate = new Date(date)

  const isValid = todoDate > currentDate
  if (!isValid) {
    return {
      result: false,
      message: 'addTodo.validationMessageDateLessThanCurrent'
    }
  }

  const isValidDate = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(date)

  if (!isValidDate) {
    return {
      result: false,
      message: 'addTodo.validationMessageInvalidDate'
    }
  }

  return {
    result: true,
    message: ''
  }
}

export function dateToString (date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getCurrentDate () {
  const today = new Date()
  return dateToString(today)
}
