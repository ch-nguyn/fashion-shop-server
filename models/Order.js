const mongoose = require("mongoose");
const User = require("./User");
const Product = require("./Product");

const singleOrderItemSchema = mongoose.Schema({
  quantity: { type: Number, required: true },
  product: {
    type: mongoose.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  shippingFee: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  orderItems: [singleOrderItemSchema],
  status: {
    type: String,
    enum: ["pending", "failed", "delivering", "delivered", "canceled"],
    default: "pending",
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name email address phoneNumber",
  });
  next();
});

orderSchema.pre("save", async function () {
  try {
    const { orderItems } = this;
    const productIds = orderItems.map((orderItem) => orderItem.product);
    const products = await Product.find({ _id: { $in: productIds } });

    orderItems.forEach((orderItem) => {
      const product = products.find(
        (prod) => prod._id.toString() === orderItem.product.toString()
      );
      if (product) {
        product.inventory -= orderItem.quantity;
      }
    });
    await Promise.all(products.map((product) => product.save()));
  } catch (e) {}
});

module.exports = mongoose.model("Order", orderSchema);
