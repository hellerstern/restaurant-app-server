const express = require("express");
const app = express();

app.use(require("./user.routes"));
app.use(require("./auth.routes"));
app.use(require("./restaurant.routes"));
app.use(require("./review.routes"));
app.use(require("./upload.routes"));
app.use(require("./image.routes"));

module.exports = app;
