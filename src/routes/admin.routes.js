const express = require("express");
const adminRouter = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  verifyJobListings,
  getUsersByRole,
} = require("../controllers/admin.controller");
const protect = require("../middlewares/auth");
const role = require("../middlewares/role");

adminRouter.get("/", protect, role("admin"), getAllUsers);
adminRouter.get("/:id", protect, role("admin", "recruiter"), getUserById);
adminRouter.put("/:id", protect, role("admin"), updateUser);
adminRouter.put("/:id/soft-delete", protect, role("admin"), softDeleteUser);
adminRouter.put("/jobs/:jobId",protect, role("admin"), verifyJobListings)
adminRouter.get("/role/:role", protect, role("admin"), getUsersByRole);

module.exports = adminRouter;