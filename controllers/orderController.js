const catchAsync = require("../utils/catchAsync");
const Order = require("../models/Order");
const AppError = require("../utils/appErrors");
const APIFeatures = require("../utils/apiFeatures");
const { StatusCodes } = require("http-status-codes");
const Product = require("../models/Product");

const getAllOrders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Order.find(), req.query)
    .limitFields()
    .filter()
    .sort();
  const orders = await features.query.populate({
    path: "orderItems.product",
    select: `name photo brand`,
  });
  res.status(StatusCodes.OK).json({
    status: "success",
    total: orders.length,
    orders,
  });
});

const getMonthlySales = catchAsync(async (req, res, next) => {
  const { year } = req.params;
  const monthlyOrders = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalOrders: { $sum: 1 },
        orders: { $push: "$_id" },
        totalMoney: {
          $sum: "$total",
        },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);
  res.status(200).json({
    status: "success",
    monthlyOrders,
  });
});

const createOrder = catchAsync(async (req, res, next) => {
  // cartItems: quantity, product():id
  const { cartItems, shippingFee, address } = req.body;
  const { user } = req;

  if (!address) {
    return next(
      new AppError("Please provide address!", StatusCodes.BAD_REQUEST)
    );
  }

  if (!cartItems || cartItems.length < 1) {
    return next(new AppError("No items provided!", StatusCodes.BAD_REQUEST));
  }

  if (!shippingFee) {
    return next(
      new AppError(
        "No shipping fee or subtotal provided",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  let subtotal = 0;
  let orderItems = [];

  for (const item of cartItems) {
    let price = 0;
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new AppError("There's no product with that ID"));
    }

    if (product.discountPrice) {
      price = product.discountPrice;
    } else {
      price = product.price;
    }

    const { _id } = product;
    const singleOrderItem = {
      quantity: item.quantity,
      product: _id,
      price: price * item.quantity,
    };

    orderItems = [...orderItems, singleOrderItem];
    subtotal += price * item.quantity;
  }

  const total = subtotal + shippingFee;

  const order = await Order.create({
    shippingFee,
    subtotal,
    total,
    orderItems,
    user,
    address,
    isPaid: req.body.isPaid,
  });

  res.status(StatusCodes.CREATED).json({
    status: "success",
    order,
  });
});

const getSingleOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate({
    path: "orderItems.product",
    select: `name photo brand`,
  });
  if (!order) {
    return next("There's no order with that id", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({
    status: "success",
    order,
  });
});

const getUserOrders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Order.find({ user: req.user._id }),
    req.query
  )
    .limitFields()
    .sort();
  const orders = await features.query.populate({
    path: "orderItems.product",
    select: `name photo brand`,
  });
  res
    .status(StatusCodes.OK)
    .json({ status: "success", total: orders.length, orders });
});

const updateOrder = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!status) {
    return next(new AppError("Please provide status", StatusCodes.BAD_REQUEST));
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!order) {
    return next(new AppError("There's no order with that ID"));
  }
  res.status(StatusCodes.OK).json({
    status: "success",
    order,
  });
});
module.exports = {
  getAllOrders,
  createOrder,
  getSingleOrder,
  getUserOrders,
  updateOrder,
  getMonthlySales,
};
