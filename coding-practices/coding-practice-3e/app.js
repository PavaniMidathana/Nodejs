const express = require("express");
const app = express();

app.get("/", (request, response) => {
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth();
  let year = date.getFullYear();
  response.send(`${day}-${month + 1}-${year}`);
});

app.listen(3000, () => {
  console.log("Server is running");
});

module.exports = app;
