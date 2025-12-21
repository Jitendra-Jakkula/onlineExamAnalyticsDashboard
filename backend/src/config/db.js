const mongoose = require("mongoose");

async function connectDb(uri) {
  if (!uri) {
    const err = new Error("Missing MONGODB_URI");
    err.status = 500;
    err.expose = true;
    throw err;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

module.exports = { connectDb };

