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
  uploadCompanyLogo,
  listApprovedCompanies,
} = require("../controllers/company.controller");
const protect = require("../middlewares/auth");
const role = require("../middlewares/role");
const upload = require("../middlewares/multer");

companyRouter.get("/:companyId", getCompanyById);
companyRouter.post("/", protect, role("recruiter"), requestOrJoinCompany);
companyRouter.get("/", protect, role("recruiter"), getMyCompany);
companyRouter.put("/", protect, role("recruiter"), updateMyCompany);
companyRouter.get("/approved",protect,role("recruiter"), listApprovedCompanies)
companyRouter.get("/all", protect, role("admin"), listAllCompanies);
companyRouter.put(
  "/:companyId/approve",
  protect,
  role("admin"),
  approveCompany
);
companyRouter.put("/:companyId/reject", protect, role("admin"), rejectCompany);
companyRouter.post(
  "/upload-company_logo",
  protect,
  role("recruiter"),
  upload.single("company_logo"),
  uploadCompanyLogo
);

module.exports = companyRouter;
