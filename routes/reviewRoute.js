const express = require("express");
const router = express.Router();
const {
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  createReview,
} = require("../controllers/reviewController");
const { checkAuthenticate } = require("../controllers/authController");

router.route("/").get(getAllReviews).post(checkAuthenticate, createReview);
router
  .route("/:id")
  .get(getSingleReview)
  .patch(checkAuthenticate, updateReview)
  .delete(checkAuthenticate, deleteReview);

module.exports = router;
