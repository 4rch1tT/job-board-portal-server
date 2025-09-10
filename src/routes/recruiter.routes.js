const express = require("express");
const recruiterRouter = express.Router();

const {
  registerRecruiter,
  loginRecruiter,
  logoutRecruiter,
  getRecruiterProfile,
  updateRecruiterProfile,
  deleteRecruiterProfile,
  uploadRecruiterProfilePic,
} = require("../controllers/recruiter.controller");
const protect = require("../middlewares/auth");
const upload = require("../middlewares/multer");

recruiterRouter.post("/register", registerRecruiter);
recruiterRouter.post("/login", loginRecruiter);
recruiterRouter.post("/logout", logoutRecruiter);
recruiterRouter.get("/profile", protect, getRecruiterProfile);
recruiterRouter.put("/profile", protect, updateRecruiterProfile);
recruiterRouter.put("/profile/delete", protect, deleteRecruiterProfile);
recruiterRouter.post(
  "/upload-profile-pic",
  protect,
  upload.single("profile_pic"),
  uploadRecruiterProfilePic
);

module.exports = recruiterRouter;
