const express = require("express");
const path = require("path");

const app = express();

const bodyParser = require("body-parser");
// parse application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 1000000,
  })
);
// parse application/json
app.use(bodyParser.json({ limit: "50mb", extended: true }));
// cors
app.use(require("cors")());

// Enable public folder using a middleware
app.use(express.static(path.resolve(__dirname, "./public")));

// Routes global config
app.use(require("./routes/index.routes"));

module.exports = app;
