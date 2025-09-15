const express = require("express");
const jobRouter = express.Router();
const {
  createJob,
  updateJob,
  deleteJob,
  getAllJobs,
  getJobById,
  getJobsByRecruiter,
} = require("../controllers/job.controller");
const protect = require("../middlewares/auth");
const role = require("../middlewares/role");

jobRouter.get("/all", getAllJobs);
jobRouter.get("/recruiter/me", protect, role("recruiter"), getJobsByRecruiter);
jobRouter.get("/admin/all", protect, role("admin"), getAllJobs);
jobRouter.post("/", protect, role("recruiter"), createJob);
jobRouter.get("/:jobId", getJobById);
jobRouter.put("/:jobId", protect, role("recruiter"), updateJob);
jobRouter.put("/:jobId/soft-delete", protect, role("recruiter"), deleteJob);

module.exports = jobRouter