const mongoose = require("mongoose");
const Product = require("./Product");

const reviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Review need a title"],
  },
  comment: {
    type: String,
    required: [true, "Review need a comment"],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, "Review need a rating"],
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

reviewSchema.statics.calcAverageRating = async function (productID) {
  const stats = await this.aggregate([
    {
      $match: { product: productID },
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(
      productID,
      {
        numOfReviews: stats[0].nRating,
        averageRating: stats[0].avgRating,
      },
      { new: true }
    );
  }
};

reviewSchema.post("save", function () {
  this.constructor.calcAverageRating(this.product);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRating(this.r.product);
});

module.exports = mongoose.model("Review", reviewSchema);
