const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers
  const user = users.find((user) => user.username === username)

  if (!user) {
      return response.status(400).json({error: "User not found."})
  }

  request.user = user

  return next()
}

function checksExistsTodo(request, response, next) {
  const { user } = request
  const { id } = request.params;
  const todo = user.todos.find((todo) => todo.id === id);

  if (!todo) {
    return response.status(404).json({error: "Todo doesn't exists"});
  }
  request.todo = todo

  return next()
}

/**
 * Criação de usuário
 * deve possuir:
 * id - uuid
 * name - string
 * username - string
 * todos - []
 */
app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const userExists = users.find((user) => user.username === username)

  if (userExists) {
    return response.status(400).json({error: "User already exists."})
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(user);

  return response.status(201).json(user);
});

/**
 * Busca as todos do usuário recebido no header do request
 */
app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

/**
 * Recebe uma nova todo dentro do body do request e realiza a inserção
 * nas todos do usuário recebido dentro do header do request
 * Criação de uma todo:
 * id: uuid
 * title: string
 * done: bool
 * deadline: Date
 * created_at: Date
 */
app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;
  const todo = {
    id: uuidv4(),
    title: title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

/**
 * Realiza a atualização do título e deadline de uma todo que deve ser passada no body 
 * que deve ser passada por meio da query da url
 * e utiliza o username, que deve ser passado no header
 */
app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { todo } = request;
  const { title, deadline } = request.body;

  todo.title = title;
  todo.deadline = new Date(deadline);
  
  return response.status(200).json(todo);
});

/**
 * Completa a todo baseada no id recebido dentro dos parametros da url
 * para o username recebido no header do request
 */
app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { todo } = request;
  todo.done = true;
  
  return response.status(200).json(todo);
});

/**
 * Deleta a todo baseada no id recebido dentro dos parametros da url
 * para o username recebido no header do request
 */
app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user, todo } = request;
  
  user.todos.splice(user.todos.indexOf(todo), 1);

  return response.status(204).send();
});

module.exports = app;