const express = require("express");
const authRouter = express.Router();
const {
  registerCandidate,
  loginCandidate,
  getCandidateProfile,
  updateCandidateProfile,
  deleteCandidateProfile,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/auth.controller");
const protect = require("../middlewares/auth");

authRouter.post("/register", registerCandidate);
authRouter.post("/login", loginCandidate);
authRouter.get("/profile", protect, getCandidateProfile);
authRouter.put("/profile", protect, updateCandidateProfile)
authRouter.put("/profile/delete", protect, deleteCandidateProfile);
authRouter.post("/wishlist/:jobId", protect, addToWishlist);
authRouter.put("/wishlist/:jobId", protect, removeFromWishlist);

module.exports = authRouter;
