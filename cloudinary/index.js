const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: "dkoc3dgh6",
  api_key: "628937721757872",
  api_secret: "bWw9OesFSytOGa0LPJoXiX4Qm08",
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "check-Inn.ng",
    allowedFormats: ["jpeg", "png", "jpg"],
  },
});

module.exports = { cloudinary, storage };
