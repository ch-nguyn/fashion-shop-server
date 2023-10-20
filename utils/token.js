const jwt = require("jsonwebtoken");

const tokenSign = (user, time) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: time,
  });
};

module.exports = { tokenSign };
