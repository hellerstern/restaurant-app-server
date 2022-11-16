const express = require("express");
const _ = require("underscore");

const app = express();

const Comment = require("../models/comment");
const Restaurant = require("../models/restaurant");

const {
  verificateToken,
  verificateAdmin_Role,
} = require("../middlewares/authentication");

// ============================
//  Get all comments
// ============================
app.get("/comments", verificateToken, function (req, res) {
  let from = req.body.from || 0;
  from = Number(from);
  Comment.find({ status: true })
    .skip(from)
    .limit(5)
    .exec((err, comments) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      res.json({
        ok: true,
        comments,
      });
    });
});

// ============================
//  Create Comment
// ============================
app.post("/comments", [verificateToken], function (req, res) {
  let body = req.body;
  let owner = body.owner;
  if (req.user.role == "OWNER_ROLE") {
    return res.status(500).json({
      ok: false,
      err: {
        message: "Owner cannot create comments",
      },
    });
  } else {
    if (req.user.role == "USER_ROLE") {
      if (req.user._id != owner) {
        return res.status(500).json({
          ok: false,
          err: {
            message: "You cannot create comments for another users",
          },
        });
      }
    }
  }

  Restaurant.findById(body.restaurant).exec((err, restaurantDB) => {
    if (err || !restaurantDB) {
      return res.status(400).json({
        ok: false,
        err: {
          message: "The restaurant doesn't exist with specified id",
        },
      });
    }
    let comment = new Comment({
      rate: body.rate,
      title: body.title,
      description: body.description,
      user: body.owner,
      restaurant: body.restaurant,
    });
    comment.save((err, commentDB) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      res.json({
        ok: true,
        comment: commentDB,
        message: "Comment Created",
      });
    });
  });
});

// ============================
//  Update specified Comment
// ============================
app.put(
  "/comments/:id",
  [verificateToken, verificateAdmin_Role],
  function (req, res) {
    let id = req.params.id;
    let body = _.pick(req.body, [
      "rate",
      "title",
      "description",
      "opened",
      "status",
    ]);
    // This is a way to not update certain properties
    // But we used underscore .pick instead
    Comment.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true, context: "query" },
      (err, commentDB) => {
        if (err) {
          return res.status(400).json({
            ok: false,
            err,
          });
        }
        res.json({
          ok: true,
          comment: commentDB,
        });
      }
    );
  }
);

// ============================
//  Delete specified Comment
// ============================
app.delete(
  "/comments/:id",
  [verificateToken, verificateAdmin_Role],
  function (req, res) {
    let id = req.params.id;
    // This way the user is deleted from DB
    // Comment.findByIdAndRemove(id, (err, restaurantDeleted) => {
    // This way it just changes it status
    let statusChange = {
      status: false,
    };
    Comment.findByIdAndUpdate(
      id,
      statusChange,
      { new: true },
      (err, commentDeleted) => {
        if (err) {
          return res.status(400).json({
            ok: false,
            err,
          });
        }
        if (!commentDeleted) {
          return res.status(400).json({
            ok: false,
            err: {
              message: "Comment not found",
            },
          });
        }
        res.json({
          ok: true,
          comment: commentDeleted,
        });
      }
    );
  }
);

module.exports = app;
