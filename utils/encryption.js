const bcrypt = require('bcryptjs');

module.exports = async (password) => {
  return await bcrypt.hash(password, 12);
};
