const express = require("express");
const applicationRouter = express.Router();
const {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  deleteApplication,
  uploadResume,
} = require("../controllers/application.controller");
const protect = require("../middlewares/auth");
const role = require("../middlewares/role");
const upload = require("../middlewares/multer");

applicationRouter.post("/", protect, role("candidate"), applyToJob);
applicationRouter.get("/user", protect, role("candidate"), getMyApplications);
applicationRouter.get(
  "/job/:jobId",
  protect,
  role("recruiter"),
  getApplicationsForJob
);
applicationRouter.get(
  "/:applicationId",
  protect,
  role(["admin", "recruiter"]),
  getApplicationById
);
applicationRouter.put(
  "/:applicationId/status",
  protect,
  role(["admin", "recruiter"]),
  updateApplicationStatus
);
applicationRouter.put(
  "/:applicationId/withdrawn",
  protect,
  role("candidate"),
  withdrawApplication
);
applicationRouter.delete(
  "/:applicationId",
  protect,
  role("admin"),
  deleteApplication
);
applicationRouter.post(
  "/upload-resume",
  protect,
  role("candidate"),
  upload.single("resume"),
  uploadResume
);

module.exports = applicationRouter;
