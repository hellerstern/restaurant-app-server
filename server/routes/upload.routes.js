const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();

const User = require("../models/user.model");
const Restaurant = require("../models/restaurant.model");

const fs = require("fs");
const path = require("path");

// const { verificateToken } = require("../middlewares/authentication.middleware");

// default options
app.use(fileUpload());
// When we call app.use(fileUpload());  all the files go to req.files

// ============================
//  Upload a image
//  type: user or restaurant
//  id: user or restaurant id
// ============================
app.put("/upload/:type/:id", function (req, res) {
  let type = req.params.type;
  let id = req.params.id;

  if (Object.keys(req.files).length == 0) {
    return res.status(400).json({
      ok: false,
      err: {
        message: "No files were uploaded.",
      },
    });
  }

  // Type validation
  let validTypes = ["user", "restaurant"];
  if (validTypes.indexOf(type) < 0) {
    return res.status(400).json({
      ok: false,
      err: {
        message: "The types allowed are: " + validTypes.join(", "),
        type,
      },
    });
  }

  let file = req.files.file;
  let fileNameSplited = file.name.split(".");
  let extension = fileNameSplited[fileNameSplited.length - 1];

  // Allowed extensions for the file
  let validExtensions = [
    "png",
    "jpg",
    "gif",
    "jpeg",
    "PNG",
    "JPG",
    "GIF",
    "JPEG",
  ];

  // Check if the extension is valid
  if (validExtensions.indexOf(extension) < 0) {
    return res.status(400).json({
      ok: false,
      err: {
        message: "The extensions allowed are: " + validExtensions.join(", "),
        ext: extension,
      },
    });
  }

  // Change the name of the file
  let fileName = `${id}-${new Date().getMilliseconds()}.${extension}`;

  file.mv(`uploads/${type}/${fileName}`, (err) => {
    if (err)
      return res.status(500).json({
        ok: false,
        err,
      });
    // Here the image was uploaded correctly
    // Now we are going to assign it to an user or product
    if (type === "user") {
      updateUserImage(id, res, fileName);
    } else {
      updateRestaurantImage(id, res, fileName);
    }
  });
});

// ============================
//  Update User Image with given filename
// ============================
function updateUserImage(id, res, fileName) {
  User.findById(id, (err, userDB) => {
    if (err) {
      deleteFile(fileName, "user");
      return res.status(500).json({
        ok: false,
        err,
      });
    }
    if (!userDB) {
      deleteFile(fileName, "user");
      return res.status(400).json({
        ok: false,
        err: {
          message: "User doesn't exist",
        },
      });
    }

    deleteFile(userDB.image, "user");

    userDB.image = fileName;
    userDB.save((err, savedUser) => {
      res.json({
        ok: true,
        user: savedUser,
        image: fileName,
      });
    });
  });
}

// ============================
//  Update Restaurant Image with given filename
// ============================
function updateRestaurantImage(id, res, fileName) {
  Restaurant.findById(id, (err, restaurantDB) => {
    if (err) {
      deleteFile(fileName, "restaurant");
      return res.status(500).json({
        ok: false,
        err,
      });
    }
    if (!restaurantDB) {
      deleteFile(fileName, "restaurant");
      return res.status(400).json({
        ok: false,
        err: {
          message: "User doesn't exist",
        },
      });
    }

    deleteFile(restaurantDB.image, "restaurant");

    restaurantDB.image = fileName;
    restaurantDB.save((err, savedRestaurant) => {
      res.json({
        ok: true,
        restaurant: savedRestaurant,
        image: fileName,
      });
    });
  });
}

// ============================
//  Delete given imagefile
// ============================
function deleteFile(imageName, type) {
  // Check if the user already has an image
  let imagePath = path.resolve(__dirname, `../../uploads/${type}/${imageName}`);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
}

module.exports = app;
