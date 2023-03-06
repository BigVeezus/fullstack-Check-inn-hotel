const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
// const passport = require("passport");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { hotelSchema, reviewSchema } = require("./schemas");
const catchAsync = require("./utils/catchAsync");
const {
  isLoggedIn,
  isAuthor,
  validateHotel,
  validateReview,
  isReviewAuthor,
} = require("./middleware");
const ExpressError = require("./utils/ExpressError");
const Hotel = require("./model/hotel");
const Review = require("./model/review");
const User = require("./model/user");

mongoose.connect("mongodb://localhost:27017/check-inn", {
  useNewUrlParser: true,
  autoIndex: true,
  useUnifiedTopology: true,
  // useFindAndModify: false,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected!");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const sessionConfig = {
  secret: "bettersecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  // console.log(req.session);
  res.locals.currentUser = req.user;
  // console.log(req.user);
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/hotels",
  catchAsync(async (req, res) => {
    const hotels = await Hotel.find({});
    // console.log(hotels);
    res.render("hotels/index", { hotels });
  })
);

app.get("/hotels/new", isLoggedIn, (req, res) => {
  res.render("hotels/new");
});

app.post(
  "/hotels",
  isLoggedIn,
  validateHotel,
  catchAsync(async (req, res, next) => {
    // if (!req.body.hotel) throw new ExpressError("Invalid Hotel Data", 404);

    const newHotel = new Hotel(req.body.hotel);
    newHotel.author = req.user._id;
    await newHotel.save();
    req.flash("success", "New hotel created!");
    res.redirect(`/hotels/${newHotel._id}`);
  })
);

app.get("/register", async (req, res) => {
  res.render("users/register");
});

app.post(
  "/register",
  catchAsync(async (req, res) => {
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
  })
);

app.get("/login", (req, res) => {
  res.render("users/login");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      req.flash("sucess", "Could not log you out");
      return res.redirect("hotels");
    }
    req.flash("success", "You have been logged out.");
    return res.redirect("/login");
  });
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
    keepSessionInfo: true,
  }),
  (req, res) => {
    const redirectUrl = req.session.returnTo || "hotels";
    req.flash("success", "Welcome back");
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

app.get(
  "/hotels/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const hotel = await Hotel.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("author");
    // console.log(hotel);
    if (!hotel) {
      req.flash("error", "Cannot find that hotel");
      return res.redirect("hotels");
    }
    console.log(hotel);
    res.render("hotels/show", { hotel });
  })
);

app.get(
  "/hotels/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      req.flash("error", "Cannot find that hotel");
      return res.redirect("hotels");
    }
    res.render("hotels/edit", { hotel });
  })
);

app.put(
  "/hotels/:id",
  isLoggedIn,
  isAuthor,
  validateHotel,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const hotel = await Hotel.findByIdAndUpdate(id, { ...req.body.hotel });
    req.flash("success", "Successfully updated Hotel");
    res.redirect(`/hotels/${hotel._id}`);
  })
);

app.delete(
  "/hotels/:id",
  isLoggedIn,
  isAuthor,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Hotel.findByIdAndDelete(id);
    req.flash("success", "Deleted Hotel");
    res.redirect("/hotels");
  })
);

app.post(
  "/hotels/:id/reviews",
  isLoggedIn,
  validateReview,
  catchAsync(async (req, res) => {
    const hotel = await Hotel.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    hotel.reviews.push(review);
    await review.save();
    await hotel.save();
    req.flash("success", "Created review");
    res.redirect(`/hotels/${hotel._id}`);
  })
);

app.delete(
  "/hotels/:id/reviews/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    // console.log(reviewId);
    const hotel = await Hotel.findById(id);
    await Hotel.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Deleted review!");
    res.redirect(`/hotels/${id}`);
  })
);

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found!", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh no, Something went wrong!";
  res.status(statusCode).render("error", { err });
});

app.listen(port, () => {
  console.log("PORT NOW LISTENING ON 3000 G!");
});
