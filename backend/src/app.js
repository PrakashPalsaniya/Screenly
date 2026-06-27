const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const router = require("./routes");
const { globalErrorHandler } = require("./middlewares/error.middleware");

const app = express();
const frontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : [];

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  ...frontendUrls,
].filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/v1", router);

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to Screenly API" });
});

app.use(globalErrorHandler);

module.exports = app;
