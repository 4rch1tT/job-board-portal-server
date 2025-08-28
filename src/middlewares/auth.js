const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const jwtSecret = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = protect;
