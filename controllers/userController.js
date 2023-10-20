const Token = require("../models/Token");
const User = require("../models/User");
const AppError = require("../utils/appErrors");
const catchAsync = require("../utils/catchAsync");
const { StatusCodes } = require("http-status-codes");
const multer = require("multer");
const sharp = require("sharp");

const filteredObj = (obj, ...acceptedFields) => {
  let newObj = {};

  Object.keys(obj).forEach((property) => {
    if (acceptedFields.includes(property)) {
      return (newObj[property] = obj[property]);
    }
  });

  return newObj;
};

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "assets/img/users");
//   },
//   filename: (req, file, cb) => {
//     cb(null, `user-${req.user._id}.png`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new AppError("Please upload only image!", StatusCodes.BAD_REQUEST),
      false
    );
  }
};

const uploadUserPhoto = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
}).single("img");

const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  req.file.filename = `${req.protocol}://${req.get("host")}/api/v1/image/user-${
    req.user._id
  }.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`assets/img/users/user-${req.user._id}.jpeg`);

  next();
});

const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("There's no user with that ID"));
  }
  res.status(StatusCodes.OK).json({
    status: "success",
    user,
  });
});

const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates",
        StatusCodes.BAD_REQUEST
      )
    );
  }
  const user = await User.findById(req.user._id);
  const filteredBody = filteredObj(
    req.body,
    "name",
    "photo",
    "address",
    "phoneNumber",
    "fullName"
  );

  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({
    status: "success",
    user: updatedUser,
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  await User.findByIdAndDelete(req.user._id);
  await Token.findOneAndDelete({ user: req.user._id });
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(StatusCodes.NO_CONTENT).json({
    status: "success",
    user: null,
  });
});

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(StatusCodes.OK).json({
    status: "success",
    users,
  });
});

const getSingleUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("No user found with that ID"));
  }
  res.status(StatusCodes.OK).json({
    status: "success",
    user,
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return next(new AppError("No product found with that ID"));
  }
  res.status(StatusCodes.NO_CONTENT).json({
    status: "success",
    user: null,
  });
});

module.exports = {
  getAllUsers,
  getSingleUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
};
