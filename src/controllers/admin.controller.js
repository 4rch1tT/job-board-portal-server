const companyModel = require("../models/company.model");
const jobModel = require("../models/job.model");
const userModel = require("../models/user.model");

const buildCompanyQueryPipeline = require("../utils/buildCompanyQueryPipeline");
const buildUserAdminPipeline = require("../utils/buildUserAdminPipeline");

const getAllUsers = async (req, res) => {
  try {
    const pipeline = buildUserAdminPipeline(req.query);
    const result = await userModel.aggregate(pipeline);

    const users = result[0]?.users || [];
    const total = result[0]?.metadata[0]?.total || 0;
    res.status(200).json({ count: total, users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select("-password")
      .populate("company")
      .populate("wishlist");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, resume, profilePic, company, wishlist } = req.body;

    if (req.user._id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.id,
      { name, resume, profilePic, company, wishlist },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isDeleted = true;
    await user.save();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyJobListings = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await jobModel.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    job.isVerified = true;
    job.verifiedBy = req.user._id;
    job.verifiedAt = new Date();
    await job.save();

    res.status(200).json({ message: "Job listing verified" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const pipeline = buildCompanyQueryPipeline(req.query);
    const result = await companyModel.aggregate(pipeline);

    const companies = result[0]?.companies || [];
    const total = result[0]?.metadata[0]?.total || 0;

    res.status(200).json({ count: total, companies });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyCompany = async () => {
  try {
    const { companyId } = req.params;

    const company = await companyModel.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.verified = true;
    company.verifiedBy = req.user._id;
    company.verifiedAt = new Date();
    await company.save();

    res.status(200).json({ message: "Company verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const softDeleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await companyModel.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.isDeleted = true;
    await company.save();

    res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  getAllCompanies,
  verifyCompany,
  softDeleteCompany,
  verifyJobListings,
};
