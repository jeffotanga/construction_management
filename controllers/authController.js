const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, first_name, last_name, role } = req.body;
    const user = await authService.registerUser({ username, email, password, first_name, last_name, role });
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const data = await authService.loginUser(username, password);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    return res.json(user);
  } catch (error) {
    return next(error);
  }
};
