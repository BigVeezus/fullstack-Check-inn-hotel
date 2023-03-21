const flash = require("connect-flash");
const Hotel = require("../model/hotel");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken =
  "pk.eyJ1IjoiYmlndmVlenVzIiwiYSI6ImNsZjk3dWhuYjAzODc0M251aDZra2x3YWIifQ.DNAwOhvuwW2bQoJPHLhZmA";
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const User = require("../model/user");
const { cloudinary } = require("../cloudinary/index");

module.exports.index = async (req, res) => {
  const hotels = await Hotel.find({});
  // console.log(hotels);
  res.render("hotels/index", { hotels });
};

module.exports.new = (req, res) => {
  res.render("hotels/new");
};

module.exports.addHotel = async (req, res, next) => {
  // if (!req.body.hotel) throw new ExpressError("Invalid Hotel Data", 404);
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.hotel.location,
      limit: 5,
    })
    .send();
  const newHotel = new Hotel(req.body.hotel);
  newHotel.geometry = geoData.body.features[0].geometry;
  newHotel.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  newHotel.author = req.user._id;
  await newHotel.save();
  // console.log(newHotel);
  req.flash("success", "New hotel created!");
  res.redirect(`/hotels/${newHotel._id}`);
};

module.exports.registerUserForm = async (req, res) => {
  res.render("users/register");
};

module.exports.registerUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    // console.log(registerUser);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Check-Inn");
      res.redirect("/hotels");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("register");
  }
};

module.exports.renderLogin = (req, res) => {
  res.render("users/login");
};

module.exports.logoutUser = (req, res) => {
  req.logout(function (err) {
    if (err) {
      req.flash("sucess", "Could not log you out");
      return res.redirect("hotels");
    }
    req.flash("success", "You have been logged out.");
    return res.redirect("/login");
  });
};

module.exports.loginUser = (req, res) => {
  const redirectUrl = req.session.returnTo || "hotels";
  // console.log(redirectUrl);
  req.flash("success", "Welcome back");
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.getOneHotel = async (req, res) => {
  const { id } = req.params;
  const hotel = await Hotel.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("author");
  // console.log(hotel);
  if (!hotel) {
    req.flash("error", "Cannot find that hotel");
    return res.redirect("hotels");
  }
  // console.log(hotel);
  res.render("hotels/show", { hotel });
};

module.exports.renderEditPage = async (req, res) => {
  const { id } = req.params;
  const hotel = await Hotel.findById(id);
  if (!hotel) {
    req.flash("error", "Cannot find that hotel");
    return res.redirect("hotels");
  }
  res.render("hotels/edit", { hotel });
};

module.exports.updateHotel = async (req, res) => {
  const { id } = req.params;
  // console.log(req.body);
  const hotel = await Hotel.findByIdAndUpdate(id, { ...req.body.hotel });
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  hotel.images.push(...imgs);

  await hotel.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await hotel.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
    // console.log(hotel);
  }

  req.flash("success", "Successfully updated Hotel");
  res.redirect(`/hotels/${hotel._id}`);
};

module.exports.deleteHotel = async (req, res) => {
  const { id } = req.params;
  await Hotel.findByIdAndDelete(id);
  req.flash("success", "Deleted Hotel");
  res.redirect("/hotels");
};
