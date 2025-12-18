const express = require("express");
const {
  checkAuthenticate,
  checkPermission,
} = require("../controllers/authController");
const {
  getAllOrders,
  createOrder,
  getSingleOrder,
  getUserOrders,
  updateOrder,
  getMonthlySales,
} = require("../controllers/orderController");

const router = express.Router();

router.get("/monthly-sales/:year", getMonthlySales);

router.get("/my-orders", checkAuthenticate, getUserOrders);

router
  .route("/")
  .get(checkAuthenticate, checkPermission("admin"), getAllOrders)
  .post(checkAuthenticate, createOrder);

router
  .route("/:id")
  .get(checkAuthenticate, checkPermission("admin"), getSingleOrder)
  .patch(checkAuthenticate, checkPermission("admin"), updateOrder);

module.exports = router;
