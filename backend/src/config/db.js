const mongoose = require("mongoose");
const { config } = require("./config");

async function connectDB() {
  const databaseUri = config.databaseReplicaSet || config.databaseUrl;

  if (!databaseUri) {
    throw new Error("MongoDB connection string is not defined");
  }

  try {
    await mongoose.connect(databaseUri);
    console.log("Connected to database");
  } catch (error) {
    console.error("Failed to connect to database", error);
    process.exit(1);
  }
}

module.exports = connectDB;
