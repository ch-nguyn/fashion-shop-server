const dotenv = require("dotenv");
const app = require("./app");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });

const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.DATABASE, {
  })
  .then((con) => {});

const server = app.listen(port, () => {});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => process.exit(1));
});
