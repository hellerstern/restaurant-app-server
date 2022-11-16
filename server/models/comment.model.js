const mongoose = require("mongoose");
//to create the models
let Schema = mongoose.Schema;
let validRates = {
  values: [0, 1, 2, 3, 4, 5],
  message: "{VALUE} is not a valid role",
};

let commentSchema = new Schema({
  rate: {
    type: Number,
    default: 5,
    enum: validRates,
  },
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "The user who commented is required"],
  },
  review: {
    type: Schema.Types.ObjectId,
    ref: "Review",
    required: false,
  },
  opened: {
    type: Boolean,
    default: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: [true, "The createdAt is required"],
  },
});

module.exports = mongoose.model("Comment", commentSchema);
