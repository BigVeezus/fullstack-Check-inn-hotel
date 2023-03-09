const Hotel = require("../model/hotel");

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

  const newHotel = new Hotel(req.body.hotel);
  newHotel.author = req.user._id;
  await newHotel.save();
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
  console.log(redirectUrl);
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
  const hotel = await Hotel.findByIdAndUpdate(id, { ...req.body.hotel });
  req.flash("success", "Successfully updated Hotel");
  res.redirect(`/hotels/${hotel._id}`);
};

module.exports.deleteHotel = async (req, res) => {
  const { id } = req.params;
  await Hotel.findByIdAndDelete(id);
  req.flash("success", "Deleted Hotel");
  res.redirect("/hotels");
};
