module.exports = (res, accToken, refToken) => {
  res.cookie("accessToken", accToken, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 5 * 60 * 1000
    ),
    // secure:true,
  });
  res.cookie("refreshToken", refToken, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 7 * 24 * 60 * 60 * 1000
    ),
    // secure:true,
  });
};
