const mongoose = require("mongoose");
//to create the models
let Schema = mongoose.Schema;

let restaurantSchema = new Schema({
  name: {
    type: String,
    required: [true, "The name is required"],
  },
  description: {
    type: String,
    required: [true, "The description is required"],
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "The owner is required"],
  },
  comments: {
    type: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    default: [],
  },
  normalRate: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    required: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
