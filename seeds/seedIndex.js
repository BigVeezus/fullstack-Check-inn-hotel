const mongoose = require("mongoose");
const { places, descriptors } = require("../seeds/seedHelpers");
const Hotel = require("../model/hotel");
const cities = require("../seeds/cities");

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

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  await Hotel.deleteMany({});
  for (let i = 0; i < 20; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const hotel = new Hotel({
      author: "6404328e8171f6bc647fbc6a",
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      title: `${sample(descriptors)} ${sample(places)}`,
      images: [
        {
          url: "https://res.cloudinary.com/dkoc3dgh6/image/upload/v1678483649/check-Inn.ng/vjqifaj1je6jby8qzodk.jpg",
          filename: "check-Inn.ng/vjqifaj1je6jby8qzodk",
        },
        {
          url: "https://res.cloudinary.com/dkoc3dgh6/image/upload/v1678483650/check-Inn.ng/cxbauxlm6lewclotgbev.jpg",
          filename: "check-Inn.ng/cxbauxlm6lewclotgbev",
        },
      ],
      description:
        "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Eveniet laboriosam eaque iure perferendis! Iure eius optio cumque exercitationem minus harum corporis omnis veniam ad consectetur, ullam nulla fugiat accusantium blanditiis.",
      price,
    });
    await hotel.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
