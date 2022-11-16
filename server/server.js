require("./config/config");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

const bodyParser = require("body-parser");
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Enable public folder using a middleware
app.use(express.static(path.resolve(__dirname, "../public")));

// Routes global config
app.use(require("./routes/index.routes"));

// Connecting with the database
mongoose.connect(process.env.URLDB, { useNewUrlParser: true }, (err, res) => {
  if (err) throw err;
  console.log("Data base ONLINE");
});
app.listen(process.env.PORT, () => {
  console.log("Listening port: ", process.env.PORT);
});
