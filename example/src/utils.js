const SECRET_KEY = process.env.SECRET_KEY || 'default-secret';

function getSecretKey() {
  return SECRET_KEY;
}

module.exports = { getSecretKey };