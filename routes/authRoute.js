const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  checkAuthenticate,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyAccount,
  logout,
  refreshToken,
  checkPermission,
  adminSignup,
} = require("../controllers/authController");

router.post(
  "/admin-signup",
  checkAuthenticate,
  checkPermission("admin"),
  adminSignup
);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", checkAuthenticate, logout);

router.patch("/verify-account/:id", verifyAccount);

router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:resetToken", resetPassword);

router.patch("/update-password", checkAuthenticate, updatePassword);

router.post("/refresh-token", refreshToken);

module.exports = router;
