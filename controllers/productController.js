const catchAsync = require("../utils/catchAsync");
const Product = require("../models/Product");
const AppError = require("../utils/appErrors");
const APIFeatures = require("../utils/apiFeatures");
const { StatusCodes } = require("http-status-codes");

const searchProducts = catchAsync(async (req, res, next) => {
  let name = req.query.name;
  if (!name) {
    return next(new AppError("You nust provide name to search"));
  }
  const products = await Product.find();
  let searchProducts = products.filter(function (item) {
    return item.name.toLowerCase().indexOf(name.toLowerCase()) !== -1;
  });
  res.status(200).json({
    status: "success",
    total: searchProducts.length,
    products: searchProducts,
  });
});

const getAllProducts = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Product.find(), req.query)
    .limitFields()
    .filter()
    .sort();

  const products = await features.query;
  res.status(200).json({
    status: "success",
    total: products.length,
    products,
  });
});

const getSingleProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate("reviews");
  if (!product) {
    return next(
      new AppError("No product found with that ID", StatusCodes.NOT_FOUND)
    );
  }
  res.status(200).json({
    status: "success",
    product,
  });
});

const createProduct = catchAsync(async (req, res, next) => {
  const product = await Product.create(req.body);
  res.status(201).json({
    status: "success",

    product,
  });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError("No product found with that ID"));
  }

  res.status(200).json({
    status: "success",

    product,
  });
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError("No product found with that ID"));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

module.exports = {
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
};
