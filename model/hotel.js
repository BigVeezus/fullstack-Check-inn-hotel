const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const Schema = mongoose.Schema;

const hotelSchema = new Schema({
  title: String,
  image: String,
  price: Number,
  description: String,
  location: String,
});

module.exports = mongoose.model("Hotel", hotelSchema);
