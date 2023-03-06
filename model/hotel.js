const mongoose = require("mongoose");
const Review = require("./review");
mongoose.set("strictQuery", false);
const Schema = mongoose.Schema;

const hotelSchema = new Schema({
  title: String,
  image: String,
  price: Number,
  description: String,
  location: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});

hotelSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Review.remove({
      _id: {
        $in: doc.reviews,
      },
    });
  }
});

module.exports = mongoose.model("Hotel", hotelSchema);
