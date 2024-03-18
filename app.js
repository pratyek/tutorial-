const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())
let db = null
const initialisaiton = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(
        'Server running at https://pratyekhcgelnjscadoqbs.drops.nxtwave.tech/todos/',
      )
    })
  } catch (e) {
    console.log('Db error:' + e.message)
    process.exit(1)
  }
}
initialisaiton()
const convert = arr =>
  arr.map(i => ({
    id: i.id,
    todo: i.todo,
    priority: i.priority,
    status: i.status,
    category: i.category,
    dueDate: i.due_date,
  }))
app.get('/todos/', async (request, response) => {
  const {category, priority, status, due_date, search_q} = request.query

  if (
    status &&
    !['TO DO', 'IN PROGRESS', 'DONE'].includes(status.toUpperCase())
  ) {
    return response.status(400).send('Invalid Todo Status')
  }
  if (priority && !['HIGH', 'MEDIUM', 'LOW'].includes(priority.toUpperCase())) {
    return response.status(400).send('Invalid Todo Priority')
  }
  if (
    category &&
    !['WORK', 'HOME', 'LEARNING'].includes(category.toUpperCase())
  ) {
    return response.status(400).send('Invalid Todo Category')
  }
  if (due_date) {
    const parsedDate = new Date(due_date)
    if (isNaN(parsedDate.getTime())) {
      return response.status(400).send('Invalid Due Date')
    }
  }
  let query = `SELECT * FROM todo WHERE 1=1`
  if (search_q) {
    query += ` AND todo LIKE '%${search_q}%'`
  }
  if (category) {
    query += ` AND category = '${category.toUpperCase()}'`
  }
  if (priority) {
    query += ` AND priority = '${priority.toUpperCase()}'`
  }
  if (status) {
    query += ` AND status = '${status.toUpperCase()}'`
  }
  query += `;`
  console.log(query)
  const rows = await db.all(query)
  response.send(convert(rows))
})

app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const query = `select * from todo where id=${todoId};`
  const arr = await db.get(query)
  response.send({
    id: arr.id,
    todo: arr.todo,
    category: arr.category,
    priority: arr.priority,
    status: arr.status,
    dueDate: arr.due_date,
  })
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (date) {
    const parsedDate = new Date(date)
    console.log(parsedDate)
    if (parsedDate) {
      return response.status(400).send('Invalid Due Date')
    } else {
      const query = `select * from todo where due_date='${date}';`
      const arr = await db.all(query)
      console.log(arr)
      if (arr) {
        response.send(convert(arr))
      }
    }
  }
})

app.post('/todos/', async (request, response) => {
  console.log(request)
  const {id, todo, priority, status, category, dueDate} = request.body
  const query = `
  insert into todo values
  (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`
  await db.run(query)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId', async (request, response) => {
  const {key} = request.body
  const todoId = request.params.todoId

  let query = `UPDATE todo SET `

  switch (key) {
    case 'status':
      query += `status='${key}' `
      response.send('Todo Status Updated')
      break
    case 'priority':
      query += `priority='${key}' `
      response.send('Todo Priority Updated')
      break
    case 'todo':
      response.send('Todo Updated')
      break
    case 'category':
      response.send('Todo Category Updated')
      break
    default:
      response.status(400).send('Invalid key provided')
      break
  }

  query += `WHERE todoId=${todoId};`
  await db.run(query)
})

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const query = `delete from todo where id=${todoId};`
  await db.run(query)
  response.send('Todo Deleted')
})
module.exports = app
