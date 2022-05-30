const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./queries')
const auth = require('./auth')
const port = process.env.PORT




app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/login', (req, res) => db.login(req,res))
app.get('/users', db.getUsers)
app.get('/users/:id', db.getUserById)
app.post('/users', db.createUser)
app.put('/users/:id', db.updateUser)
app.delete('/users/:id', db.deleteUser)

app.put('/answer', db.updateAnswer)
app.put('/answer/:id', db.deleteAnswer)

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})



