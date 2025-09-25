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
    console.error("Aggregation error:", error);
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

const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const recentUsers = await userModel
      .find({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      })
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const recentCompanies = await companyModel
      .find({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      })
      .select("name displayName status verified createdAt verifiedAt")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const recentJobs = await jobModel
      .find({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      })
      .populate("company", "name displayName")
      .populate("postedBy", "name")
      .select("title isVerified status createdAt verifiedAt company postedBy")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const activities = [];

    recentUsers.forEach((user) => {
      activities.push({
        id: `user-${user._id}`,
        type: "user",
        action: "registered",
        name: user.name,
        details: `${user.role} account`,
        time: user.createdAt,
        relatedId: user._id,
      });
    });

    recentCompanies.forEach((company) => {
      activities.push({
        id: `company-submit-${company._id}`,
        type: "company",
        action: "submitted",
        name: company.name || company.displayName,
        details: `Company registration`,
        time: company.createdAt,
        relatedId: company._id,
      });
      if (company.verified && company.verifiedAt) {
        activities.push({
          id: `company-verify-${company._id}`,
          type: "company",
          action: "approved",
          name: company.name || company.displayName,
          details: `Company verified`,
          time: company.verifiedAt,
          relatedId: company._id,
        });
      }
    });

    recentJobs.forEach((job) => {
      activities.push({
        id: `job-post-${job._id}`,
        type: "job",
        action: "posted",
        name: job.title,
        details: `by ${job.company?.name || "Unknown Company"}`,
        time: job.createdAt,
        relatedId: job._id,
      });

      if (job.isVerified && job.verifiedAt) {
        activities.push({
          id: `job-verify-${job._id}`,
          type: "job",
          action: "approved",
          name: job.title,
          details: `Job verified`,
          time: job.verifiedAt,
          relatedId: job._id,
        });
      }

      if (job.status === "rejected" && job.verifiedAt) {
        activities.push({
          id: `job-reject-${job._id}`,
          type: "job",
          action: "rejected",
          name: job.title,
          details: `Job rejected`,
          time: job.verifiedAt,
          relatedId: job._id,
        });
      }
    });

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    const limitedActivities = activities.slice(0, parseInt(limit));

    const formatTimeAgo = (date) => {
      const now = new Date();
      const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} hours ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} days ago`;

      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;

      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths} months ago`;
    };

    const formattedActivities = limitedActivities.map((activity) => ({
      ...activity,
      timeFormatted: formatTimeAgo(activity.time),
    }));

    res.status(200).json({
      success: true,
      count: formattedActivities.length,
      activities: formattedActivities,
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
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
  getRecentActivity,
};
