const companyModel = require("../models/company.model");
const userModel = require("../models/user.model")
const uploadFileToCloudinary = require("../utils/uploadFileToCloudinary");

const getCompanyById = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await companyModel
      .findById(companyId)
      .populate("recruiters", "name email");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ company });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//* Recruiter Only

const linkRecruiterToCompany = async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res
        .status(403)
        .json({ message: "Only recruiters can link to companies" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const company = await companyModel.findOne({
      name: name.trim().toLowerCase(),
    });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const alreadyLinked = company.recruiters.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (alreadyLinked) {
      return res
        .status(200)
        .json({ message: "Already linked to this company", company });
    }

    company.recruiters.push(req.user._id);
    await company.save();

    req.user.company = company._id;
    await req.user.save();

    res
      .status(200)
      .json({ message: "Linked to company successfully", company });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createCompanyRequest = async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res
        .status(403)
        .json({ message: "Only recruiters can create companies" });
    }

    const { name, description, location, website, industry, logoUrl } =
      req.body;

    if (!name || !description || !location || !website || !industry) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedName = name.trim().toLowerCase();

    let existingCompany = await companyModel.findOne({ name: normalizedName });
    if (existingCompany) {
      return res.status(409).json({ message: "Company already exists" });
    }

    const newCompany = await companyModel.create({
      name: normalizedName,
      displayName: name.trim(),
      description,
      location,
      website,
      industry,
      logoUrl,
      recruiters: [req.user._id],
      createdBy: req.user._id,
      status: "pending",
      verified: false,
    });

    req.user.company = newCompany._id;
    await userModel.findByIdAndUpdate(req.user.id, { company: newCompany._id });;

    res
      .status(201)
      .json({ message: "Company request submitted", company: newCompany });
  } catch (error) {
    console.error("Company creation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyCompany = async (req, res) => {
  try {
    const recruiter = req.user;
    if (!recruiter.company) {
      return res
        .status(404)
        .json({ message: "No company linked to this recruiter" });
    }

    const company = await companyModel.findById(recruiter.company);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ company });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMyCompany = async (req, res) => {
  try {
    const recruiter = req.user;

    const { name, description, location, industry, website, logoUrl } =
      req.body;

    const company = await companyModel.findById(recruiter.company);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (recruiter._id.toString() !== company.createdBy.toString()) {
      return res.status(403).json({ message: "Unauthorized!!!" });
    }

    if (name) company.name = name;
    if (description) company.description = description;
    if (location) company.location = location;
    if (industry) company.industry = industry;
    if (website) company.website = website;
    if (logoUrl) company.logoUrl = logoUrl;

    company.verified = false;
    company.verifiedBy = null;
    company.verifiedAt = null;
    company.status = "pending";

    await company.save();

    res.status(200).json({ message: "Company updated successfully", company });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listApprovedCompanies = async (req, res) => {
  try {
    const companies = await companyModel
      .find({ status: "approved", verified: true })
      .select("_id name logoUrl location industry");

    res.status(200).json({ companies });
  } catch (error) {
    console.error("Error in listApprovedCompanies:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//* Admin Only

const listAllCompanies = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can view companies" });
    }

    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.industry) filters.industry = req.query.industry;
    if (req.query.location) filters.location = req.query.location;

    const companies = await companyModel
      .find(filters)
      .populate("recruiters", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ companies });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const approveCompany = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can approve companies" });
    }

    const { companyId } = req.params;
    const company = await companyModel.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.status = "approved";
    company.verified = true;
    company.verifiedBy = req.user._id;
    company.verifiedAt = new Date();

    await company.save();

    res.status(200).json({ message: "Company approved", company });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const rejectCompany = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can reject companies" });
    }

    const { companyId } = req.params;

    const company = await companyModel.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.status = "rejected";
    company.verified = false;
    company.verifiedBy = req.user._id;
    company.verifiedAt = new Date();

    await company.save();

    res.status(200).json({ message: "Company rejected" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const uploadCompanyLogo = async (req, res) => {
  try {
    const result = await uploadFileToCloudinary(req.file.buffer, {
      folder: "company_logos",
      public_id: `company_logo_${req.user._id}`,
      resource_type: "auto",
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

module.exports = {
  getCompanyById,

  createCompanyRequest,
  linkRecruiterToCompany,
  getMyCompany,
  updateMyCompany,
  listApprovedCompanies,
  listAllCompanies,
  approveCompany,
  rejectCompany,
  uploadCompanyLogo,
};
