const express = require("express");
const router = express.Router();
const {
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  createReview,
  getAverageRating,
} = require("../controllers/reviewController");
const {
  checkAuthenticate,
  checkPermission,
} = require("../controllers/authController");

router.get(
  "/average-rating",
  checkAuthenticate,
  checkPermission("admin"),
  getAverageRating
);

router.route("/").get(getAllReviews).post(checkAuthenticate, createReview);
router
  .route("/:id")
  .get(getSingleReview)
  .patch(checkAuthenticate, updateReview)
  .delete(checkAuthenticate, deleteReview);

module.exports = router;
