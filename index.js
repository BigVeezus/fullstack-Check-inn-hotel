if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// console.log(process.env.SECRET);

const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
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
const helmet = require("helmet");
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
// live Mongo Db
const mongoUrl =
  "mongodb+srv://bigveezus:himveezus@checkinn.tflolfp.mongodb.net/?retryWrites=true&w=majority";

//local database
// "mongodb://localhost:27017/check-inn"

mongoose.connect(mongoUrl, {
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

app.use(cors());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize());

const sessionConfig = {
  name: "VizSessions",
  secret: "bettersecret",
  store: MongoStore.create({
    mongoUrl: mongoUrl,
    touchAfter: 24 * 60 * 60,
  }),
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: {
      allowOrigins: ["*"],
    },
  })
);

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

app.get("/", cors(), (req, res) => {
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
// fixed git config
app.use((res, req, next) => {
  res.header("Access-Control-Allow-Origin", "*");
});

module.exports = app;
