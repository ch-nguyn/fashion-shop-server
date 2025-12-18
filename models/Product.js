const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Please provide product name"],
      maxlength: [100, "Name can not be more than 100 characters"],
      unique: true,
    },
    price: {
      type: Number,
      required: [true, "Please provide product price"],
      default: 0,
    },
    size: {
      type: [String],
      enum: ["s", "m", "l", "xl", "xxl"],
      default: ["m", "l", "xl"],
    },
    color: {
      type: [String],
      default: ["black", "white"],
    },
    description: {
      type: String,
      required: [true, "Please provide product description"],
      maxlength: [1000, "Description can not be more than 1000 characters"],
    },
    discountPrice: {
      type: Number,
    },
    photo: [String],
    category: {
      type: [String],
      required: [true, "Please provide product category"],
    },

    brand: {
      type: String,
      required: [true, "Please provide product brand"],
    },
    inventory: {
      type: Number,
      default: 15,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

module.exports = mongoose.model("Product", productSchema);
