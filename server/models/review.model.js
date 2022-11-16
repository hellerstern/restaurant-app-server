const mongoose = require("mongoose");
//to create the models
let Schema = mongoose.Schema;

let reviewSchema = new Schema({
  description: {
    type: String,
    required: [true, "The description is required"],
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "The owner who reviewed is required"],
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

module.exports = mongoose.model("Review", reviewSchema);
