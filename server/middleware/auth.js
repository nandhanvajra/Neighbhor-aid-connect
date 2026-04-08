const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const jwtSecret = "superSecretHardcodedKey123";
const auth = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    console.log("Auth header received:", authHeader ? "Present" : "Missing");
    if (!authHeader) {
      return res.status(401).json({
        message: "No authentication token, access denied",
      });
    }
    const token = authHeader.replace("Bearer ", "");
    console.log("Token extracted and processing...");
    const verified = jwt.verify(token, jwtSecret);
    console.log("Token verified, user ID:", verified.userId);
    req.user = verified;
    if (verified.userId != null) {
      req.user.userId = String(verified.userId);
    }
    next();
  } catch (err) {
    console.error("Authentication error:", err.message);
    res.status(401).json({
      message: "Invalid token, authorization denied",
    });
  }
};
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({
        message: "No authentication token, access denied",
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const verified = jwt.verify(token, jwtSecret);
    const user = await User.findById(verified.userId);
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }
    if (!user.isAdmin && user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }
    req.user = verified;
    if (verified.userId != null) {
      req.user.userId = String(verified.userId);
    }
    req.adminUser = user;
    next();
  } catch (err) {
    console.error("Admin auth error:", err.message);
    res.status(401).json({
      message: "Invalid token or admin access denied",
    });
  }
};
module.exports = {
  auth,
  adminAuth,
};
