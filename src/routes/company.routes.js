const express = require("express");
const companyRouter = express.Router();
const {
  getCompanyById,
  requestOrJoinCompany,
  getMyCompany,
  updateMyCompany,
  listAllCompanies,
  approveCompany,
  rejectCompany,
} = require("../controllers/company.controller");
const protect = require("../middlewares/auth");
const role = require("../middlewares/role");

companyRouter.get("/:companyId", getCompanyById);
companyRouter.post("/", protect, role("recruiter"), requestOrJoinCompany);
companyRouter.get("/", protect, role("recruiter"), getMyCompany);
companyRouter.put("/", protect, role("recruiter"), updateMyCompany);
companyRouter.get("/all", protect, role("admin"), listAllCompanies);
companyRouter.put(
  "/:companyId/approve",
  protect,
  role("admin"),
  approveCompany
);
companyRouter.put("/:companyId/reject", protect, role("admin"), rejectCompany);
//TODO Add uploadCompanyLogo routes after setting the controller using cloudinary and multer

module.exports = companyRouter;
