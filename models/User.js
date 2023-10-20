const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const crypto = require("crypto");
const { stringify } = require("querystring");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
    unique: [true, "Name already exists"],
    minLength: [4, "Min length 4"],
    maxLength: 20,
  },
  email: {
    type: String,
    unique: [true, "Email already in use"],
    required: [true, "Please provide your email"],
    lowercase: true,
    validate: [validator.isEmail, "Invalid email"],
  },
  fullName: {
    type: String,
  },
  photo: {
    type: String,
    default:
      "https://secure.gravatar.com/avatar/be3bb8ab4714145f6cbbceff5a89d68a?s=60&d=mm&r=g",
  },
  address: [
    {
      province: {
        type: String,
      },
      district: {
        type: String,
      },
      ward: {
        type: String,
      },
      detailAddress: String,
      zipcode: String,
      country: String,
    },
  ],

  phoneNumber: {
    type: String,
    required: [true, "Please provide your phone number"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password is not correct",
    },
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  isVerify: { type: Boolean, default: false, required: true },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async (
  candidatePassword,
  userPassword
) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
