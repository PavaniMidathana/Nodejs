const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
initializeDBAndServer();

const isStatusValid = (val) => {
  return val === "TO DO" || val === "IN PROGRESS" || val === "DONE";
};

const isPriorityValid = (val) => {
  return val === "HIGH" || val === "MEDIUM" || val === "LOW";
};

const isCategoryValid = (val) => {
  return val === "WORK" || val === "HOME" || val === "LEARNING";
};

const isDateValid = (request, response, next) => {
  const { date } = request.query;
  if (isValid(new Date(date))) {
    next();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

const checkValidConditionsMiddleware = (request, response, next) => {
  const { status, priority, category } = request.query;
  let flag = 0;
  if (category !== undefined) {
    if (isCategoryValid(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
      flag = 1;
    }
  }
  if (priority !== undefined) {
    if (isPriorityValid(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
      flag = 1;
    }
  }
  if (status !== undefined) {
    if (isStatusValid(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
      flag = 1;
    }
  }
  if (flag === 0) {
    next();
  }
};

const checkValidConditionsMiddleware1 = (request, response, next) => {
  const { status, priority, category, dueDate } = request.body;
  console.log(status, priority, category);
  let flag = 0;
  if (category !== undefined) {
    if (isCategoryValid(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
      flag = 1;
    }
  }
  if (priority !== undefined) {
    if (isPriorityValid(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
      flag = 1;
    }
  }
  if (status !== undefined) {
    if (isStatusValid(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
      flag = 1;
    }
  }
  if (dueDate !== undefined) {
    if (isValid(new Date(dueDate)) === false) {
      response.status(400);
      response.send("Invalid Due Date");
      flag = 1;
    }
  }
  if (flag === 0) {
    next();
  }
};

const checkValidConditionsMiddleware2 = (request, response, next) => {
  const {
    status = "",
    priority = "",
    category = "",
    dueDate = "",
  } = request.body;
  let flag = 0;
  if (category !== "") {
    if (isCategoryValid(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
      flag = 1;
    }
  }
  if (priority !== "") {
    if (isPriorityValid(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
      flag = 1;
    }
  }
  if (status !== "") {
    if (isStatusValid(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
      flag = 1;
    }
  }
  if (dueDate !== "") {
    if (isValid(new Date(dueDate)) === false) {
      response.status(400);
      response.send("Invalid Due Date");
      flag = 1;
    }
  }
  if (flag === 0) {
    next();
  }
};

//API-1 GET todos API
app.get(
  "/todos/",
  checkValidConditionsMiddleware,
  async (request, response) => {
    const {
      status = "",
      search_q = "",
      priority = "",
      category = "",
    } = request.query;
    let getTodosQuery = `SELECT id,todo,category,priority,status,due_date as dueDate
     FROM todo
     WHERE status LIKE '%${status}%'
            AND priority LIKE '%${priority}%'
            AND category LIKE '%${category}%'
            AND todo LIKE '%${search_q}%'
     ORDER BY id;`;
    const todos = await db.all(getTodosQuery);
    response.send(todos);
  }
);

//API-2 GET todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT id,todo,category,priority,status,due_date as dueDate
     FROM todo
     WHERE id=${todoId}`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API-3 GET todos on specified date
app.get("/agenda/", isDateValid, async (request, response) => {
  const { date } = request.query;
  const newDate = format(new Date(date), "yyyy-MM-dd");
  const getTodosQuery = `SELECT id,todo,category,priority,status,due_date as dueDate
  FROM todo
  WHERE due_date='${newDate}'`;
  const todos = await db.all(getTodosQuery);
  response.send(todos);
});

//API-4 POST todo API
app.post(
  "/todos/",
  checkValidConditionsMiddleware1,
  async (request, response) => {
    const { id, todo, priority, status, category, dueDate } = request.body;
    const newDate = format(new Date(dueDate), "yyyy-MM-dd");
    const addTodoQuery = `INSERT INTO
        todo(id ,todo , priority, status , category , due_date)
      VALUES (
          ${id},
          '${todo}',
          '${priority}',
          '${status}',
          '${category}',
          '${newDate}'
      )`;
    await db.run(addTodoQuery);
    response.send("Todo Successfully Added");
  }
);

//API-5 PUT todo API
app.put(
  "/todos/:todoId/",
  checkValidConditionsMiddleware2,
  async (request, response) => {
    const { todoId } = request.params;
    const {
      status = "",
      priority = "",
      todo = "",
      category = "",
      dueDate = "",
    } = request.body;
    let updateTodoQuery;
    let msg = "";
    if (status !== "") {
      updateTodoQuery = `UPDATE todo
        SET status = '${status}'
        WHERE id = ${todoId};
        `;
      msg = "Status Updated";
    }
    if (priority !== "") {
      updateTodoQuery = `UPDATE todo
        SET priority = '${priority}'
        WHERE id = ${todoId};
        `;
      msg = "Priority Updated";
    }
    if (todo !== "") {
      updateTodoQuery = `UPDATE todo
        SET todo = '${todo}'
        WHERE id = ${todoId};
        `;
      msg = "Todo Updated";
    }
    if (category !== "") {
      updateTodoQuery = `UPDATE todo
        SET category = '${category}'
        WHERE id = ${todoId};
        `;
      msg = "Category Updated";
    }
    if (dueDate !== "") {
      updateTodoQuery = `UPDATE todo
        SET due_date = '${dueDate}'
        WHERE id = ${todoId};
        `;
      msg = "Due Date Updated";
    }
    await db.run(updateTodoQuery);
    response.send(msg);
  }
);

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
