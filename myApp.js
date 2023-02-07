const bodyParser = require("body-parser");
const express = require("express");
const app = express();

// Middleware logger
app.use(
  "/",
  (req, res, next) => {
    console.log(`${req.method} ${req.path} - ${req.ip}`);
    next();
  },
  bodyParser.urlencoded({ extended: false })
);

// Serve HTML
app.get("/", (req, res) => {
  // res.send('Hello Express');
  res.sendFile(__dirname + "/views/index.html");
});

// Get time with chained Middleware
app.get(
  "/now",
  (req, res, next) => {
    req.time = new Date().toString();
    next();
  },
  (req, res) => {
    res.json({ time: req.time });
  }
);

// RESTfully serve JSON
app.get("/json", (req, res) => {
  if (process.env.MESSAGE_STYLE === "uppercase")
    res.json({ message: "HELLO JSON" });
  else res.json({ message: "Hello json" });
});

// Serve CSS
app.use("/public", express.static(__dirname + "/public"));

// Dynamic route params request (isso aqui é pica tá)
app.get("/:word/echo", (req, res) => {
  res.json({ echo: req.params.word });
});

// Dynamic route query request
app
  .route("/name")
  .get((req, res) => {
    res.json({ name: `${req.query.first} ${req.query.last}` });
  })
  .post((req, res) => {
    console.log(req.body.first);
    res.json({ name: `${req.body.first} ${req.body.last}` });
  });

module.exports = app;
