const express = require("express");
const app = express();
app.get("/", (request, response) => {
  let todays_date = new Date();
  let new_date = `${todays_date.getDate()}-${
    todays_date.getMonth() + 1
  }-${todays_date.getFullYear()}`;
  response.send(new_date);
});

app.listen(3000);
