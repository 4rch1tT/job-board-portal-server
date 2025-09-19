const express = require("express");
const authRouter = express.Router();
const {
  registerCandidate,
  loginCandidate,
  logoutCandidate,
  getCandidateProfile,
  updateCandidateProfile,
  deleteCandidateProfile,
  addToWishlist,
  removeFromWishlist,
  uploadCandidateProfilePic,
  uploadCandidateResume, // Add this new function
} = require("../controllers/auth.controller");
const protect = require("../middlewares/auth");
const role = require("../middlewares/role");
const upload = require("../middlewares/multer");

authRouter.post("/register", registerCandidate);
authRouter.post("/login", loginCandidate);
authRouter.post("/logout", logoutCandidate);
authRouter.get("/profile", protect, getCandidateProfile);
authRouter.put("/profile", protect, updateCandidateProfile);
authRouter.put("/profile/delete", protect, deleteCandidateProfile);
authRouter.post("/wishlist/:jobId", protect, addToWishlist);
authRouter.put("/wishlist/:jobId", protect, removeFromWishlist);
authRouter.post(
  "/upload-profile-pic",
  protect,
  upload.single("profile_pic"),
  uploadCandidateProfilePic
);
authRouter.post(
  "/upload-resume",
  protect,
  upload.single("resume"),
  uploadCandidateResume
);

module.exports = authRouter;
