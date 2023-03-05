const mongoose = require("mongoose");
const passportLMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

UserSchema.plugin(passportLMongoose);

module.exports = mongoose.model("User", UserSchema);
