const express = require("express");
const {
  getAllProducts,
  createProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} = require("../controllers/productController");
const {
  checkAuthenticate,
  checkPermission,
} = require("../controllers/authController");

const router = express.Router();

router.get("/search", searchProducts);

router
  .route("/")
  .get(getAllProducts)
  .post(checkAuthenticate, checkPermission("admin"), createProduct);
router
  .route("/:id")
  .get(getSingleProduct)
  .patch(checkAuthenticate, checkPermission("admin"), updateProduct)
  .delete(checkAuthenticate, checkPermission("admin"), deleteProduct);

module.exports = router;
