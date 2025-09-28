const express = require("express");
const adminRouter = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  getAllCompanies,
  verifyCompany,
  softDeleteCompany,
  verifyJobListings,
  getRecentActivity,
  suspendUser,
  unsuspendUser,
} = require("../controllers/admin.controller");

const protect = require("../middlewares/auth");
const role = require("../middlewares/role");

adminRouter.get("/companies", protect, role("admin"), getAllCompanies);
adminRouter.patch(
  "/companies/:companyId/verify",
  protect,
  role("admin"),
  verifyCompany
);
adminRouter.patch(
  "/companies/:companyId/soft-delete",
  protect,
  role("admin"),
  softDeleteCompany
);

adminRouter.patch("/jobs/:jobId", protect, role("admin"), verifyJobListings);


adminRouter.get("/recent-activity", protect, role("admin"), getRecentActivity);

adminRouter.get("/", protect, role("admin"), getAllUsers);
adminRouter.get("/:id", protect, role("admin", "recruiter"), getUserById);
adminRouter.put("/:id", protect, role("admin"), updateUser);
adminRouter.put("/:id/suspend", protect, role("admin"),suspendUser);
adminRouter.put("/:id/unsuspend", protect, role("admin"),unsuspendUser);
adminRouter.patch("/:id/soft-delete", protect, role("admin"), softDeleteUser);

module.exports = adminRouter;
