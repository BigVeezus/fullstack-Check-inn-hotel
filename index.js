if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// console.log(process.env.SECRET);

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
const hotelController = require("./controllers/hotel");
const reviewController = require("./controllers/reviews");
const mongoSanitize = require("express-mongo-sanitize");
const {
  isLoggedIn,
  isAuthor,
  validateHotel,
  validateReview,
  isReviewAuthor,
} = require("./middleware");
const ExpressError = require("./utils/ExpressError");
const { storage } = require("./cloudinary/index");
const multer = require("multer");
const upload = multer({ storage });
const Hotel = require("./model/hotel");
const Review = require("./model/review");
const User = require("./model/user");
const hotel = require("./model/hotel");

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
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize());

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
  // console.log(req.query);
  res.render("home");
});

app.post("/", upload.array("image"), (req, res) => {
  console.log(req.body, req.file);
  res.send("IT WORKED");
});

app.get("/hotels", catchAsync(hotelController.index));

app.get("/hotels/new", isLoggedIn, hotelController.new);

app.post(
  "/hotels",
  isLoggedIn,
  upload.array("image"),
  validateHotel,
  catchAsync(hotelController.addHotel)
);

app.get("/register", hotelController.registerUserForm);

app.post("/register", catchAsync(hotelController.registerUser));

app.get("/login", hotelController.renderLogin);

app.get("/logout", hotelController.logoutUser);

app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
    keepSessionInfo: true,
  }),
  hotelController.loginUser
);

app.get("/hotels/:id", catchAsync(hotelController.getOneHotel));

app.get(
  "/hotels/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(hotelController.renderEditPage)
);

app.put(
  "/hotels/:id",
  isLoggedIn,
  isAuthor,
  upload.array("image"),
  validateHotel,
  catchAsync(hotelController.updateHotel)
);

app.delete(
  "/hotels/:id",
  isLoggedIn,
  isAuthor,
  catchAsync(hotelController.deleteHotel)
);

// app.get("/hotels/:id/reviews", isLoggedIn, catchAsync, async (req, res) => {
//   const { id } = req.params;
//   const hotel = await Hotel.findById(id);
//   res.redirect(`/hotels/${hotel._id}`);
// });

app.post(
  "/hotels/:id/reviews",
  isLoggedIn,
  validateReview,
  catchAsync(reviewController.addReview)
);

app.delete(
  "/hotels/:id/reviews/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  catchAsync(reviewController.deleteReview)
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
