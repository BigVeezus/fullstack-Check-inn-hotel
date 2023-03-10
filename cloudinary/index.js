const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.c_CLOUD_NAME,
  api_key: process.env.c_API_KEY,
  api_secret: process.env.c_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "check-Inn.ng",
    allowedFormats: ["jpeg", "png", "jpg"],
  },
});

module.exports = { cloudinary, storage };
