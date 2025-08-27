const mongoose = require("mongoose");

const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB")
  } catch (error) {
   console.log("MongoDB connection error", error)
  }
};

module.exports = connectDB