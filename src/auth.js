const jwt = require('jsonwebtoken');
const staffs = require('./data').staffs;
const secretKey = 'yourSecretKey';
let tokenBlacklist = [];

const login = (req, res) => {
  const { email, password } = req.body;
  const user = staffs.find(staff => staff.email === email);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: '1h' });
  return res.status(200).json({ token });
};

const logout = (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    tokenBlacklist.push(token);
  }
  res.status(200).json({ message: 'Logout successful' });
};

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.includes(token);
};

module.exports = { login, logout, isTokenBlacklisted };
