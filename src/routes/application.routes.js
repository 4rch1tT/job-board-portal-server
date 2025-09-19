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
} = require("../controllers/application.controller");
const protect = require("../middlewares/auth");
const role = require("../middlewares/role");
const upload = require("../middlewares/multer");

applicationRouter.post("/:jobId", protect, role("candidate"), applyToJob);
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


module.exports = applicationRouter;
