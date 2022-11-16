const express = require("express");
const app = express();

app.use(require("./user"));
app.use(require("./auth"));
app.use(require("./restaurant"));
app.use(require("./review"));
app.use(require("./upload"));

module.exports = app;
