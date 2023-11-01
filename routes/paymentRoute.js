const express = require("express");
const router = express.Router();

router.get("/config", (req, res) => {
  res.status(200).json({
    status: "success",
    data: process.env.CLIENT_ID,
  });
});

module.exports = router;
