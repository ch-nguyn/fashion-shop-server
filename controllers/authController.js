const User = require("../models/User");
const AppError = require("../utils/appErrors");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/sendEmail");
const { StatusCodes } = require("http-status-codes");
const { tokenSign } = require("../utils/token");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Token = require("../models/Token");
const saveTokensInCookie = require("../utils/saveToken");

const adminSignup = catchAsync(async (req, res, next) => {
  let admin = await User.create(req.body);
  await User.findByIdAndUpdate(
    admin._id,
    { role: "admin", isVerify: true },
    { new: true }
  );
  res.status(StatusCodes.CREATED).json({
    status: "success",
  });
});

const signup = catchAsync(async (req, res, next) => {
  const { name, email, phoneNumber, password, passwordConfirm } = req.body;
  const newUser = await User.create({
    name,
    email,
    phoneNumber,
    password,
    passwordConfirm,
  });
  const verifyURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/verify-account/${newUser._id}`;
  const html = `<div>
  <div>
    <img
      src="https://suprema.qodeinteractive.com/wp-content/uploads/2016/01/logo-dark.png"
      alt=""
      width={100}
    />
  </div>
  <p style="margin-bottom: 20px;">Hi ${newUser.name},</p>
  <p >
    We're happy you signed up for Suprema. To start exploring shop and
    products, please confirm your email address.
  </p>
  <div>
    <a
      href="http://localhost:3000/verify-account/${newUser._id}"
      style="padding: 12px 24px 12px 24px; background-color:#0cc3ce; color:white; text-decoration:none;"
    >
      Verify now
    </a>
  </div>
</div>`;

  try {
    await sendEmail({
      email: newUser.email,
      subject: "Verify account from Suprema.",
      html,
    });
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    await User.findByIdAndDelete(newUser._id);
    return next(
      new AppError("There was an error sending the email. Try again later!")
    );
  }
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new AppError("Please provide email and password", StatusCodes.BAD_REQUEST)
    );
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(
      new AppError("Incorrect email or password", StatusCodes.UNAUTHORIZED)
    );
  }

  const check = await user.correctPassword(password, user.password);
  if (!user || !check) {
    return next(
      new AppError("Incorrect email or password", StatusCodes.UNAUTHORIZED)
    );
  }

  if (!user.isVerify) {
    return next(
      new AppError("Please verify your email", StatusCodes.UNAUTHORIZED)
    );
  }

  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    if (!existingToken.isValid) {
      return next(
        new AppError("Invalid Credentials", StatusCodes.UNAUTHORIZED)
      );
    }
    const refreshToken = existingToken.refreshToken;
    const accessToken = tokenSign(user, process.env.JWT_ACCESSTOKEN_EXPIRES_IN);
    saveTokensInCookie(res, accessToken, refreshToken);
    res.status(StatusCodes.OK).json({
      status: "success",
      accessToken,
      refreshToken,
      user,
    });
  } else {
    const userAgent = req.headers["user-agent"];
    const ip = req.ip;
    const accessToken = tokenSign(user, process.env.JWT_ACCESSTOKEN_EXPIRES_IN);
    const refreshToken = tokenSign(
      user,
      process.env.JWT_REFRESHTOKEN_EXPIRES_IN
    );
    saveTokensInCookie(res, accessToken, refreshToken);

    await Token.create({ refreshToken, ip, userAgent, user: user._id });

    res.status(StatusCodes.OK).json({
      status: "success",
      accessToken,
      refreshToken,
      user,
    });
  }
});

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user._id });
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

const checkAuthenticate = catchAsync(async (req, res, next) => {
  let token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer")) {
    token = auth.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("You must login to continue", StatusCodes.FORBIDDEN)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("User does no longer exist", StatusCodes.UNAUTHORIZED)
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "User password has already changed, please login again",
        StatusCodes.NOT_FOUND
      )
    );
  }

  req.user = currentUser;
  next();
});

const checkPermission = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new AppError("Permission denied!"), StatusCodes.FORBIDDEN);

    next();
  };
};

const forgotPassword = catchAsync(async (req, res, next) => {
  //find user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError("There's no user with that email", StatusCodes.NOT_FOUND)
    );

  //create reset token, expired and save it to db
  const resetToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });

  //create url for reset password with this token
  const resetURL = `http://localhost:3000/account/reset-password/${resetToken}`;
  const html = `<div>
  <div>
  <p ></p>
    <img
      src="https://suprema.qodeinteractive.com/wp-content/uploads/2016/01/logo-dark.png"
      alt=""
      width={100}
    />
  </div>
  <p style="margin-bottom: 20px;">Hi ${user.name},</p>
  <p style="margin-bottom: 10px;">
    Forgot your password?
  </p>
  <p style="margin-bottom: 20px;">
  We received a request to reset the password for your account
  </p>
  <p style="margin-bottom: 10px;">
  To reset your password, click on the button below:
  </p>
  <div>
    <a
    style="padding: 12px 24px 12px 24px; background-color:#0cc3ce; color:white; text-decoration:none;"
      href="${resetURL}"
  
    >
      Reset password
    </a>
  </div>
</div>`;

  //send email to user
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      html,
    });
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("There was an error sending the email. Try again later!")
    );
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  //hash token in req to compare with the one in db
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  //find the user with token and expired time
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError("Token is invalid or expired"),
      StatusCodes.BAD_REQUEST
    );
  }

  //reset password,...
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  const accessToken = tokenSign(user, process.env.JWT_ACCESSTOKEN_EXPIRES_IN);
  const refreshToken = await Token.findOne({ user: user._id });
  saveTokensInCookie(res, accessToken, refreshToken);

  res.status(StatusCodes.OK).json({
    status: "success",
    accessToken,
  });
});

const updatePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, newPassword, newPasswordConfirm } = req.body;

  const user = await User.findOne({ email: req.user.email }).select(
    "+password"
  );

  if (!oldPassword) {
    return next(
      new AppError("Please provide your password", StatusCodes.BAD_REQUEST)
    );
  }

  const checkPassword = await user.correctPassword(oldPassword, user.password);
  if (!checkPassword) {
    return next(new AppError("Incorrect password", 401));
  }

  if (oldPassword === newPassword) {
    return next(
      new AppError(
        "New password must be different from old one",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  const accessToken = tokenSign(user, process.env.JWT_ACCESSTOKEN_EXPIRES_IN);
  const refreshToken = await Token.findOne({ user: user._id });
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  saveTokensInCookie(res, accessToken, refreshToken);

  res.status(StatusCodes.OK).json({
    status: "success",
    accessToken,
  });
});

const verifyAccount = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isVerify: true },
    { new: true }
  );

  res.status(StatusCodes.OK).json({
    status: "success",
    user,
  });
});

const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  //send error if there is no token or it's invalid
  if (!refreshToken) {
    return next(
      new AppError("Invalid refresh token", StatusCodes.UNAUTHORIZED)
    );
  }

  const existingToken = await Token.findOne({ refreshToken });
  const payload = await promisify(jwt.verify)(
    refreshToken,
    process.env.JWT_SECRET
  );

  if (!existingToken) {
    return next(
      new AppError("Refresh Token is not valid", StatusCodes.UNAUTHORIZED)
    );
  }

  if (!existingToken.isValid) {
    return next(new AppError("Invalid Credentials", StatusCodes.UNAUTHORIZED));
  }

  const user = await User.findOne({ _id: payload.id });
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;
  const accessToken = tokenSign(user, process.env.JWT_ACCESSTOKEN_EXPIRES_IN);
  const newRefreshToken = tokenSign(
    user,
    process.env.JWT_REFRESHTOKEN_EXPIRES_IN
  );

  await Token.create({
    refreshToken: newRefreshToken,
    ip,
    userAgent,
    user: user._id,
  });

  await Token.findOneAndDelete(refreshToken);

  saveTokensInCookie(res, accessToken, newRefreshToken);

  res
    .status(StatusCodes.OK)
    .json({ status: "success", refreshToken: newRefreshToken, accessToken });
});

module.exports = {
  signup,
  login,
  checkAuthenticate,
  checkPermission,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyAccount,
  logout,
  refreshToken,
  adminSignup,
};
