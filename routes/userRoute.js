const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getSingleUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require("../controllers/userController");

const {
  checkAuthenticate,
  checkPermission,
} = require("../controllers/authController");

router.get("/me", checkAuthenticate, getMe);
router.patch(
  "/update-me",
  checkAuthenticate,
  uploadUserPhoto,
  resizeUserPhoto,
  updateMe
);
router.delete("/delete-me", checkAuthenticate, deleteMe);

router.route("/").get(checkAuthenticate, checkPermission("admin"), getAllUsers);
router
  .route("/:id")
  .get(checkAuthenticate, checkPermission("admin"), getSingleUser)
  .delete(checkAuthenticate, checkPermission("admin"), deleteUser);

module.exports = router;
