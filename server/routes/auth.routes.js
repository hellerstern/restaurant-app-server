const express = require("express");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");

const app = express();

const { verificateToken } = require("../middlewares/authentication.middleware");

// ============================
// Login (returns user instance, auth token)
// ============================
app.post("/login", (req, res) => {
  let body = req.body;
  User.findOne({ email: body.email }, (err, userDB) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err,
      });
    }
    if (!userDB) {
      return res.status(400).json({
        ok: false,
        err: {
          message: "User or password not valid",
        },
      });
    }
    // We will see if the body.password in the request is the same as the userDB
    if (!bcrypt.compareSync(body.password, userDB.password)) {
      return res.status(400).json({
        ok: false,
        err: {
          message: "User or password not valid",
        },
      });
    }
    let token = jwt.sign(
      {
        user: userDB,
      },
      process.env.SEED,
      { expiresIn: process.env.TOKEN_EXPIRATION }
    );

    res.json({
      ok: true,
      user: userDB,
      token,
    });
  });
});

// ============================
// Get current user (returns user instance)
// ============================
app.get("/current", verificateToken, (req, res) => {
  res.json({
    ok: true,
    user: req.user,
  });
});

module.exports = app;
