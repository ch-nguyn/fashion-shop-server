const express = require("express");
const productRouter = require("./routes/productRoute");
const userRouter = require("./routes/userRoute");
const orderRouter = require("./routes/orderRoute");
const errorHandler = require("./controllers/errorController");
const authRouter = require("./routes/authRoute");
const reviewRouter = require("./routes/reviewRoute");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
var cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const hpp = require("hpp");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

// Use this after the variable declaration
const app = express();

app.use(express.static("build"));
app.use(cors());

app.use(cookieParser());

// Set security HTTP headers
app.use(
  helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false })
);

const limiter = rateLimit({
  max: 1000,
  windowMS: 60 * 60 * 1000,
  message: "Too many request from this IP, please try again in an hour!",
});

app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
app.set("trust proxy", 1);

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ["duration"],
  })
);

app.get("/api/v1", (req, res) => {
  res.send("Server is running");
});
app.use("/api/v1/products", productRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/orders", orderRouter);
app.get("/api/v1/image/:img", (req, res) => {
  const imagePath = path.join(__dirname, `/assets/img/users/${req.params.img}`);

  fs.readFile(imagePath, (err, data) => {
    if (err) {
      // Xử lý lỗi nếu có
      res.status(500).send("Internal Server Error");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Content-Length": data.length,
    });
    res.end(data);
  });
});
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "./build/index.html"));
});

app.use(errorHandler);

module.exports = app;
