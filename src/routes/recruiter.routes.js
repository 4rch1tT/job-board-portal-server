const express = require("express");
const recruiterRouter = express.Router();

const {
  registerRecruiter,
  loginRecruiter,
  getRecruiterProfile,
  updateRecruiterProfile,
  deleteRecruiterProfile,
  uploadRecruiterProfilePic
} = require("../controllers/recruiter.controller");
const protect = require("../middlewares/auth");
const upload = require("../middlewares/multer")

recruiterRouter.post("/register", registerRecruiter);
recruiterRouter.post("/login", loginRecruiter);
recruiterRouter.get("/profile", protect, getRecruiterProfile);
recruiterRouter.put("/profile", protect, updateRecruiterProfile);
recruiterRouter.put("/profile/delete", protect, deleteRecruiterProfile);
recruiterRouter.post("/profile_pic",protect,upload.single("profile_pic"),uploadRecruiterProfilePic)

module.exports = recruiterRouter;
