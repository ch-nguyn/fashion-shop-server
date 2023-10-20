const dotenv = require("dotenv");
const app = require("./app");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });

const port = process.env.PORT;
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {});

const server = app.listen(port, () => {});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED ERROR");
  server.close(() => process.exit(1));
});
