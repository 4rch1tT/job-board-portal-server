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
} = require("../controllers/admin.controller");
const protect = require("../middlewares/auth");
const role = require("../middlewares/role");

adminRouter.get("/", protect, role("admin"), getAllUsers);
adminRouter.get("/:id", protect, role("admin", "recruiter"), getUserById);
adminRouter.put("/:id", protect, role("admin"), updateUser);
adminRouter.patch("/:id/soft-delete", protect, role("admin"), softDeleteUser);
adminRouter.get("/companies", protect, role("admin"), getAllCompanies);
adminRouter.patch("/companies/:companyId/verify", verifyCompany);
adminRouter.patch("/companies/:companyId/soft-delete", softDeleteCompany);
adminRouter.patch("/jobs/:jobId", protect, role("admin"), verifyJobListings);

module.exports = adminRouter;
