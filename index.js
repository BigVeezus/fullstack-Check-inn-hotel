const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("WOOF");
});

app.listen(port, () => {
  console.log("PORT NOW LISTENING ON 3000 G!");
});
