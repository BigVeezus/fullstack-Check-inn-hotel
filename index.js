const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const Hotel = require("./model/hotel");

mongoose.connect("mongodb://localhost:27017/check-inn", {
  useNewUrlParser: true,
  autoIndex: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected!");
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/hotels", async (req, res) => {
  const hotels = await Hotel.find({});
  res.render("hotels/index", { hotels });
});

app.get("/hotels/new", (req, res) => {
  res.render("hotels/new");
});

app.post("/hotels", async (req, res) => {
  const newHotel = new Hotel(req.body.hotel);
  await newHotel.save();
  console.log(newHotel);
  res.redirect(`/hotels/${newHotel._id}`);
});

app.get("/hotels/:id", async (req, res) => {
  const { id } = req.params;
  const hotel = await Hotel.findById(id);
  res.render("hotels/show", { hotel });
});

app.get("/hotels/:id/edit", async (req, res) => {
  const { id } = req.params;
  const hotel = await Hotel.findById(id);
  res.render("hotels/edit", { hotel });
});

app.put("/hotels/:id", async (req, res) => {
  const { id } = req.params;
  const hotel = await Hotel.findByIdAndUpdate(id, { ...req.body.hotel });
  res.redirect(`/hotels/${hotel._id}`);
});

app.delete("/hotels/:id", async (req, res) => {
  const { id } = req.params;
  await Hotel.findByIdAndDelete(id);
  res.redirect("/hotels");
});

app.listen(port, () => {
  console.log("PORT NOW LISTENING ON 3000 G!");
});
