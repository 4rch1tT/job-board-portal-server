const express = require("express");
const companyRouter = express.Router;
const {
  getCompanyById,
  requestOrJoinCompany,
  getMyCompany,
  updateMyCompany,
  listAllCompanies,
  approveCompany,
  rejectCompany,
} = require("../controllers/company.controller");
