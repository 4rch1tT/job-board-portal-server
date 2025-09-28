const express = require("express");
const companyRouter = express.Router();
const {
  getCompanyById,
  linkRecruiterToCompany,
  createCompanyRequest,
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

companyRouter.get(
  "/approved",
  protect,
  listApprovedCompanies
);
companyRouter.get("/all", protect, role("admin", "recruiter"), listAllCompanies);

companyRouter.patch(
  "/link",
  protect,
  role("recruiter"),
  linkRecruiterToCompany
);
companyRouter.post("/", protect, role("recruiter"), createCompanyRequest);
companyRouter.get("/", protect, role("recruiter"), getMyCompany);
companyRouter.put("/", protect, role("recruiter"), updateMyCompany);

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

companyRouter.get("/:companyId", getCompanyById);

module.exports = companyRouter;
