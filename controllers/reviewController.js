const Review = require("../models/Review");
const AppError = require("../utils/appErrors");
const { StatusCodes } = require("http-status-codes");
const catchAsync = require("../utils/catchAsync");
const { ObjectId } = require("mongodb");

const getAverageRating = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();
  const averageRating =
    reviews.reduce((init, review) => init + review.rating, 0) / reviews.length;
  res.status(200).json({
    status: "success",
    averageRating,
  });
});

const getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();
  res.status(StatusCodes.OK).json({
    status: "success",
    reviews,
  });
});

const getSingleReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const review = await Review.findById(id);
  if (!review) {
    return next(
      new AppError(
        "There's not any reviews with this id",
        StatusCodes.NOT_FOUND
      )
    );
  }
  res.status(StatusCodes.OK).json({
    status: "success",
    review,
  });
});

const createReview = catchAsync(async (req, res, next) => {
  const { title, comment, rating, product } = req.body;
  const oldReview = await Review.findOne({ user: req.user._id, product });
  if (oldReview) {
    if (
      new ObjectId(oldReview.product).toString() === product &&
      new ObjectId(oldReview.user).toString() === req.user._id.toString()
    ) {
      return next(new AppError("1 review on the same product"));
    }
  }
  const review = await Review.create({
    title,
    comment,
    rating,
    product,
    user: req.user._id,
  });
  if (!review) {
    return next(
      new AppError("Please provide all fields", StatusCodes.BAD_REQUEST)
    );
  }
  res.status(StatusCodes.CREATED).json({
    status: "success",
    review,
  });
});

const updateReview = catchAsync(async (req, res, next) => {
  const { user } = req;
  const review = await Review.findOne({ _id: req.params.id });
  if (!(user._id.toString() === review.user._id.toString())) {
    return next(new AppError("You cannot update other user's reviews"));
  }
  const updatedReview = await Review.findByIdAndUpdate(review._id, req.body, {
    new: true,
  });
  res.status(StatusCodes.OK).json({
    status: "success",
    review: updatedReview,
  });
});

const deleteReview = catchAsync(async (req, res, next) => {
  const { user } = req;
  const review = await Review.findOne({ _id: req.params.id });
  if (!(user._id.toString() === review.user._id.toString())) {
    return next(new AppError("You cannot delete other user's reviews"));
  }
  await Review.findByIdAndDelete(review._id);
  res.status(StatusCodes.NO_CONTENT).json({
    status: "success",
    data: null,
  });
});

module.exports = {
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  createReview,
  getAverageRating,
};
