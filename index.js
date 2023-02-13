require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");

// Basic Configuration
const port = process.env.PORT || 3000;

// Mongoose configuration
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlSchema = mongoose.Schema({
  short_url: Number,
  original_url: String,
});

const Url = mongoose.model("Url", urlSchema);

/*
  Credits for:
  cyrb53 (c) 2018 bryc (github.com/bryc)
  A fast and simple hash function with decent collision resistance.
  Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
  Public domain. https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js.
  */
// Won't avoid hash colisions as they are extremely difficult to happen in this case
const hashify = (url, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < url.length; i++) {
    ch = url.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return !!url.match(
      /^(http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/
    );
  } catch (err) {
    return false;
  }
};

app.use(cors());

app.use("/", bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", (req, res) => {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", (req, res) => {
  if (!isValidUrl(req.body.url))
    return res.json({
      error: "invalid url",
    });
  const shortened = hashify(String(req.body.url));

  Url.findOne({ original_url: req.body.url }, (err, data) => {
    if (err) return console.log(err);
    // Couldn't find the URL on the database, so save it
    if (!data) {
      const url = new Url({
        original_url: req.body.url,
        short_url: shortened,
      });

      url.save(url, (err, data) => {
        if (err) return console.log(err);
        console.log(`Criou! ${data}`);
        app.get(`/api/shorturl/${shortened}`, (req, res) => {
          // 302: Found -> redirect
          res.redirect(data.original_url);
        });
      });
    }
  });

  res.json({
    original_url: req.body.url,
    short_url: shortened,
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
