const Review = require("../model/review");
const Hotel = require("../model/hotel");

module.exports.addReview = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  const review = new Review(req.body.review);
  review.author = req.user._id;
  hotel.reviews.push(review);
  await review.save();
  await hotel.save();
  req.flash("success", "Created review");
  res.redirect(`/hotels/${hotel._id}`);
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  // console.log(reviewId);
  const hotel = await Hotel.findById(id);
  await Hotel.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Deleted review!");
  res.redirect(`/hotels/${id}`);
};
