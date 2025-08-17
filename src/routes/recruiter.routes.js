const express = require("express");
const recruiterRouter = express.Router();

const {
  registerRecruiter,
  loginRecruiter,
  getRecruiterProfile,
  updateRecruiterProfile,
  deleteRecruiterProfile,
} = require("../controllers/recruiter.controller");
const protect = require("../middlewares/auth");

recruiterRouter.post("/register", registerRecruiter);
recruiterRouter.post("/login", loginRecruiter);
recruiterRouter.get("/profile", protect, getRecruiterProfile);
recruiterRouter.put("/profile", protect, updateRecruiterProfile);
recruiterRouter.put("/profile/delete", protect, deleteRecruiterProfile);

module.exports = recruiterRouter;
