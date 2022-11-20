const express = require("express");
const _ = require("underscore");

const app = express();

const Comment = require("../models/comment.model");
const Restaurant = require("../models/restaurant.model");
const Review = require("../models/review.model");

const {
  verificateToken,
  verificateAdmin_Role,
  verificateManage_Role,
} = require("../middlewares/authentication.middleware");

// =============================================================== Comment CRUD

// ============================
//  Get all comments
// ============================
app.get("/comments", verificateToken, function (req, res) {
  let from = req.body.from || 0;
  from = Number(from);
  Comment.find({ status: true })
    .skip(from)
    .populate([
      {
        path: "user",
        match: { status: true },
      },
      {
        path: "review",
        match: { status: true },
      },
    ])
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
//  Get specified comment
// ============================
app.get("/comments/:id", verificateToken, function (req, res) {
  let id = req.params.id;
  Comment.findById(id)
    .populate([
      {
        path: "user",
        match: { status: true },
      },
      {
        path: "review",
        match: { status: true },
      },
    ])
    .where("status")
    .equals(true)
    .exec((err, commentDB) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      if (!commentDB) {
        return res.status(400).json({
          ok: false,
          err: {
            message: "Comment with that ID doesn't exist",
          },
        });
      }
      res.json({
        ok: true,
        comment: commentDB,
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

  Restaurant.findById(body.restaurant)
    .populate([
      {
        path: "owner",
        match: { status: true },
      },
      {
        path: "comments",
        match: { status: true },
        populate: [
          {
            path: "user",
            model: "User",
            match: { status: true },
          },
          {
            path: "review",
            model: "Review",
            match: { status: true },
            populate: {
              path: "owner",
              model: "User",
              match: { status: true },
            },
          },
        ],
      },
    ])
    .exec((err, restaurantDB) => {
      if (err || !restaurantDB) {
        return res.status(400).json({
          ok: false,
          err: {
            message: "The restaurant doesn't exist with specified id",
          },
        });
      }

      let found = false;
      var totalRate = 0;
      var totalComments = restaurantDB.comments.length;

      restaurantDB.comments.forEach((comment) => {
        totalRate += comment.rate;
        if (comment.user == owner) {
          found = true;
        }
      });

      console.log({ totalRate, totalComments });

      if (found) {
        return res.status(500).json({
          ok: false,
          err: {
            message: "You already commented to this restaurant",
          },
        });
      }
      let comment = new Comment({
        rate: body.rate,
        title: body.title,
        description: body.description,
        user: body.owner,
      });
      comment.save((err, commentDB) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            err,
          });
        }
        restaurantDB.comments.push(commentDB._id);
        restaurantDB.normalRate = Math.floor(
          (totalRate + comment.rate) / (totalComments + 1)
        );
        restaurantDB.save((err, savedRestaurant) => {
          if (err) {
            return res.status(500).json({
              ok: false,
              err,
            });
          }
          res.json({
            ok: true,
            comment: commentDB,
            restaurant: savedRestaurant,
            message: "Comment Created",
          });
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
      "user",
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

// =============================================================== Review CRUD

// ============================
//  Get all reviews
// ============================
app.get("/reviews", verificateToken, function (req, res) {
  let from = req.body.from || 0;
  from = Number(from);
  Review.find({ status: true })
    .skip(from)
    .populate("owner")
    .exec((err, reviews) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      res.json({
        ok: true,
        reviews,
      });
    });
});

// ============================
//  Create Review
// ============================
app.post(
  "/reviews",
  [verificateToken, verificateManage_Role],
  function (req, res) {
    let body = req.body;
    let owner = body.owner;
    if (req.user.role == "OWNER_ROLE") {
      if (req.user._id != owner) {
        return res.status(500).json({
          ok: false,
          err: {
            message: "You cannot create reviews for another owners",
          },
        });
      }
    }
    Comment.findById(body.comment).exec((err, commentDB) => {
      if (err || !commentDB) {
        return res.status(400).json({
          ok: false,
          err: {
            message: "The comment doesn't exist with specified id",
          },
        });
      }
      if (commentDB.opened != true)
        return res.status(500).json({
          ok: false,
          err: {
            message: "That comment already reviewed",
          },
        });
      let review = new Review({
        description: body.description,
        owner: body.owner,
      });
      review.save((err, reviewDB) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            err,
          });
        }
        commentDB.opened = false;
        commentDB.review = reviewDB._id;
        commentDB.save((err, savedComment) => {
          res.json({
            ok: true,
            comment: savedComment,
            review: reviewDB,
            message: "Comment Created",
          });
        });
      });
    });
  }
);

// ============================
//  Update specified Review
// ============================
app.put(
  "/reviews/:id",
  [verificateToken, verificateAdmin_Role],
  function (req, res) {
    let id = req.params.id;
    let body = _.pick(req.body, ["description", "status", "owner", "comment"]);
    // This is a way to not update certain properties
    // But we used underscore .pick instead
    Review.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true, context: "query" },
      (err, reviewDB) => {
        if (err) {
          return res.status(400).json({
            ok: false,
            err,
          });
        }
        res.json({
          ok: true,
          review: reviewDB,
        });
      }
    );
  }
);

// ============================
//  Delete specified Reviews
// ============================
app.delete(
  "/reviews/:id",
  [verificateToken, verificateAdmin_Role],
  function (req, res) {
    let id = req.params.id;
    const commentId = req.query.comment;
    // This way the user is deleted from DB
    // Review.findByIdAndRemove(id, (err, restaurantDeleted) => {
    // This way it just changes it status
    let statusChange = {
      status: false,
    };
    Review.findByIdAndUpdate(
      id,
      statusChange,
      { new: true },
      (err, reviewDeleted) => {
        if (err) {
          return res.status(400).json({
            ok: false,
            err,
          });
        }
        if (!reviewDeleted) {
          return res.status(400).json({
            ok: false,
            err: {
              message: "Review not found",
            },
          });
        }
        Comment.findByIdAndUpdate(
          commentId,
          { opened: true },
          { new: true },
          (err, commentUpdated) => {
            if (err) {
              return res.status(400).json({
                ok: false,
                err,
              });
            }
            res.json({
              ok: true,
              review: reviewDeleted,
              comment: commentUpdated,
            });
          }
        );
      }
    );
  }
);

module.exports = app;
