const express = require("express");
const _ = require("underscore");

const app = express();
const Restaurant = require("../models/restaurant.model");

const {
  verificateToken,
  verificateAdmin_Role,
  verificateManage_Role,
} = require("../middlewares/authentication.middleware");

// ============================
//  Get all restaurants
// ============================
app.get("/restaurants", verificateToken, function (req, res) {
  let from = req.query.from || 0;
  from = Number(from);
  Restaurant.find({ status: true })
    .where("status")
    .equals(true)
    .skip(from)
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
    .exec((err, restaurants) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      res.json({
        ok: true,
        restaurants,
      });
    });
});

// ============================
//  Get specified restaurant
// ============================
app.get("/restaurants/:id", verificateToken, function (req, res) {
  let id = req.params.id;
  Restaurant.findById(id)
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
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      if (!restaurantDB) {
        return res.status(400).json({
          ok: false,
          err: {
            message: "Restaurant ID doesn't exist",
          },
        });
      }
      res.json({
        ok: true,
        restaurant: restaurantDB,
      });
    });
});

// ============================
//  Search Restaurant By Owner
// ============================
app.get(
  "/restaurants/search/owner",
  [verificateToken, verificateManage_Role],
  function (req, res) {
    let from = req.query.from || 0;
    from = Number(from);
    let owner = req.query.owner;
    Restaurant.find({ owner: owner })
      .where("status")
      .equals(true)
      .skip(from)
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
      .exec((err, restaurants) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            err,
          });
        }
        if (!restaurants) {
          return res.status(400).json({
            ok: false,
            err: {
              message: "There is no restaurants with him",
            },
          });
        }
        res.json({
          ok: true,
          restaurants,
        });
      });
  }
);

// ============================
//  Search Restaurant By Owner with waiting reply comments
// ============================
app.get(
  "/restaurants/search/waiting-reply",
  [verificateToken, verificateManage_Role],
  function (req, res) {
    let from = req.query.from || 0;
    from = Number(from);
    let owner = req.query.owner;
    Restaurant.find({ owner: owner })
      .where("status")
      .equals(true)
      .skip(from)
      .populate([
        {
          path: "owner",
          match: { status: true },
        },
        {
          path: "comments",
          match: { status: true, opened: true },
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
      .exec((err, restaurants) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            err,
          });
        }
        if (!restaurants) {
          return res.status(400).json({
            ok: false,
            err: {
              message: "There is no restaurants with him",
            },
          });
        }
        res.json({
          ok: true,
          restaurants,
        });
      });
  }
);

// ============================
//  Search Restaurants By Rate
// ============================
app.get("/restaurants/search/rate", verificateToken, function (req, res) {
  let from = req.query.from || 0;
  from = Number(from);
  let rate = req.query.rate;
  rate = Number(rate);
  Restaurant.find()
    .where("normalRate")
    .gt(rate - 1)
    .where("status")
    .equals(true)
    .skip(from)
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
    .exec((err, restaurants) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      if (!restaurants) {
        return res.status(400).json({
          ok: false,
          err: {
            message: "There is no restaurants with that rate",
          },
        });
      }
      res.json({
        ok: true,
        restaurants,
      });
    });
});

// ============================
//  Create restaurant
// ============================
app.post(
  "/restaurants",
  [verificateToken, verificateManage_Role],
  function (req, res) {
    let body = req.body;
    let owner = body.owner;
    if (req.user.role == "OWNER_ROLE") {
      if (req.user._id != owner) {
        return res.status(500).json({
          ok: false,
          err: {
            message: "You cannot specify another owner",
          },
        });
      }
    }
    let restaurant = new Restaurant({
      name: body.name,
      description: body.description,
      owner: body.owner,
    });
    restaurant.save((err, restaurantDB) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          err,
        });
      }
      res.json({
        ok: true,
        restaurant: restaurantDB,
        message: "Restaurant Created",
      });
    });
  }
);

// ============================
//  Update specified restaurant
// ============================
app.put(
  "/restaurants/:id",
  [verificateToken, verificateAdmin_Role],
  function (req, res) {
    let id = req.params.id;
    let body = _.pick(req.body, ["name", "description", "image", "status"]);
    // This is a way to not update certain properties
    // But we used underscore .pick instead
    Restaurant.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true, context: "query" },
      (err, restaurantDB) => {
        if (err) {
          return res.status(400).json({
            ok: false,
            err,
          });
        }
        res.json({
          ok: true,
          restaurant: restaurantDB,
        });
      }
    );
  }
);

// ============================
//  Delete specified restaurant
// ============================
app.delete(
  "/restaurants/:id",
  [verificateToken, verificateAdmin_Role],
  function (req, res) {
    let id = req.params.id;
    // This way the user is deleted from DB
    // Restaurant.findByIdAndRemove(id, (err, restaurantDeleted) => {
    // This way it just changes it status
    let statusChange = {
      status: false,
    };
    Restaurant.findByIdAndUpdate(
      id,
      statusChange,
      { new: true },
      (err, restaurantDeleted) => {
        if (err) {
          return res.status(400).json({
            ok: false,
            err,
          });
        }
        if (!restaurantDeleted) {
          return res.status(400).json({
            ok: false,
            err: {
              message: "Restaurant not found",
            },
          });
        }
        res.json({
          ok: true,
          restaurant: restaurantDeleted,
        });
      }
    );
  }
);

module.exports = app;
