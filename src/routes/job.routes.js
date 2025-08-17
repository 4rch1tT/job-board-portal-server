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
jobRouter.get("/:jobId", getJobById);
jobRouter.post("/", protect, role("recruiter"), createJob);
jobRouter.get("/recruiter/me", protect, role("recruiter"), getJobsByRecruiter);
jobRouter.put("/:jobId",protect,role("recruiter"),updateJob);
jobRouter.put("/:jobId/soft-delete",protect,role("recruiter"),deleteJob);
jobRouter.get("/admin/all",protect,role("admin"),getAllJobs)

module.exports = jobRouter