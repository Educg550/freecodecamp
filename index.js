const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

// Mongoose setup
mongoose.set("strictQuery", false);
// mongoose.set("debug", true);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = mongoose.Schema({
  username: String,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});

const User = mongoose.model("User", userSchema);

const parseDate = (input) => {
  if (!input) return new Date().toDateString();
  const parts = input.split("-");

  const date = new Date(parts[0], parts[1] - 1, parts[2]).toDateString();
  // Deep copy of the string
  return (" " + date).slice(1);
};

app.use(cors());
app.use(express.static("public"));
app.use("/", bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
  User.find((err, data) => {
    if (err) return console.log(err);
    let arr = new Array();
    data.forEach((user) => {
      arr.push({
        username: user.username,
        _id: user._id,
      });
    });
    res.json(arr);
  });
});

app.post("/api/users", (req, res) => {
  const user = new User({
    username: req.body.username,
    logs: [],
  });
  user.save((err, data) => {
    if (err) return console.log(err);
    res.json({
      username: data.username,
      _id: data._id,
    });
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  User.findById(req.body[":_id"], (err, data) => {
    if (err) return console.log(err);
    if (data) {
      const exerciseLog = {
        description: req.body.description,
        duration: req.body.duration,
        date: parseDate(req.body.date),
      };
      data.log.push({
        ...exerciseLog,
      });
      data.save((err, data) => {
        if (err) return console.log(err);
        return res.json({
          username: data.username,
          ...exerciseLog,
          _id: req.body[":_id"],
        });
      });
    } else res.json({ error: "invalid user" });
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  User.findById(req.params._id, (err, data) => {
    if (err) return console.log(err);
    if (data) {
      res.json({
        username: data.username,
        count: data.log.length,
        _id: data._id,
        log: data.log
          .filter(({ date }) => {
            const fromDate = req.query.from
              ? new Date(parseDate(req.query.from))
              : new Date(date);
            const toDate = req.query.to
              ? new Date(parseDate(req.query.to))
              : new Date(date);
            const exerciseDate = new Date(date);

            return fromDate <= exerciseDate && exerciseDate <= toDate;
          })
          .map(({ description, duration, date }) => {
            const updatedDate = new Date(date).toDateString();
            return { description, duration, updatedDate };
          })
          .slice(
            0,
            req.query.limit ? Number(req.query.limit) : data.log.length
          ),
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
