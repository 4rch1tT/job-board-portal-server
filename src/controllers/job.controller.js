const jobModel = require("../models/job.model");
const userModel = require("../models/user.model");
const buildAdminJobQueryPipeline = require("../utils/buildAdminJobQueryPipeline");
const buildJobQueryPipeline = require("../utils/buildJobQueryPipeline");
const buildJobStatsQuery = require("../utils/buildJobStatsQuery");

const createJob = async (req, res) => {
  try {
    const recruiter = await userModel
      .findById(req.user._id)
      .populate("company");
    if (!recruiter.company) {
      return res
        .status(403)
        .json({ message: "Recruiter must join a company before posting jobs" });
    }
    const {
      title,
      description,
      requirements,
      skills,
      salary,
      location,
      jobType,
      category,
    } = req.body;

    if (!title || !description || !location || !jobType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (salary.min > salary.max) {
      return res.status(400).json({ message: "Invalid salary range" });
    }

    const createdJob = await jobModel.create({
      title,
      description,
      requirements,
      skills,
      salary,
      location,
      jobType,
      category,
      company: recruiter.company._id,
      postedBy: req.user._id,
    });
    res.status(201).json({
      message: "Job created successfully",
      job: {
        id: createdJob._id,
        title: createdJob.title,
        company: createdJob.company,
        postedBy: createdJob.postedBy,
        location: createdJob.location,
        jobType: createdJob.jobType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      title,
      description,
      requirements,
      skills,
      salary,
      location,
      jobType,
    } = req.body;

    const job = await jobModel.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      req.user.role === "recruiter" &&
      job.postedBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this job" });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (requirements) updateData.requirements = requirements;
    if (skills) updateData.skills = skills;
    if (salary) updateData.salary = salary;
    if (location) updateData.location = location;
    if (jobType) updateData.jobType = jobType;

    if (req.user.role === "recruiter") {
      updateData.isVerified = false;
      updateData.verifiedBy = null;
    }

    if (salary.min > salary.max) {
      return res.status(400).json({ message: "Invalid salary range" });
    }

    const updatedJob = await jobModel.findByIdAndUpdate(jobId, updateData, {
      new: true,
    });

    res.status(200).json({
      message: "Job updated successfully",
      job: {
        id: updatedJob._id,
        title: updatedJob.title,
        company: updatedJob.company,
        postedBy: updatedJob.postedBy,
        location: updatedJob.location,
        jobType: updatedJob.jobType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await jobModel.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      req.user.role === "recruiter" &&
      job.postedBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete job" });
    }

    job.isDeleted = true;
    job.deletedAt = new Date();
    await job.save();

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const pipeline = buildJobQueryPipeline(req.query);

    const result = await jobModel.aggregate(pipeline);
    const jobs = result[0]?.jobs || [];
    const total = result[0]?.metadata[0]?.total || 0;
    if (!result.length) {
      return res.status(200).json({ count: 0, jobs: [] });
    }
    res.status(200).json({ count: total, jobs });
  } catch (error) {
    console.error("Error in getAllJobs", error);
    console.error("Error details:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllJobsForAdmin = async (req, res) => {
  try {
    const pipeline = buildAdminJobQueryPipeline(req.query);

    const result = await jobModel.aggregate(pipeline);
    const jobs = result[0]?.jobs || [];
    const total = result[0]?.metadata[0]?.total || 0;
    if (!result.length) {
      return res.status(200).json({ count: 0, jobs: [] });
    }
    res.status(200).json({
      count: total,
      jobs,
    });
  } catch (error) {
    console.error("Error in getAllJobsForAdmin", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const query = { _id: jobId, isDeleted: false };

    if (req.user?.role !== "recruiter") {
      query.isVerified = true;
    }

    const job = await jobModel
      .findOne(query)
      .populate("company", "name logoUrl")
      .populate("postedBy", "name email profilePic");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({ job });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { action } = req.body;

    const job = await jobModel.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    let updateData = {
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
    };

    if (action === "approve") {
      updateData.isVerified = true;
      updateData.status = "approved";
    } else if (action === "reject") {
      updateData.isVerified = false;
      updateData.status = "rejected";
    } else {
      return res
        .status(400)
        .json({ message: "Invalid action. Use 'approve' or 'reject'" });
    }

    const updatedJob = await jobModel
      .findByIdAndUpdate(jobId, updateData, { new: true })
      .populate("company", "name logoUrl")
      .populate("postedBy", "name email");

    res.status(200).json({
      message: `Job ${action}d successfully`,
      job: updatedJob,
    });
  } catch (error) {
    console.error("Error in verifyJob:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getJobStatsForAdmin = async (req, res) => {
  try {
    const pipeline = buildJobStatsQuery();
    const stats = await jobModel.aggregate(pipeline);

    const result = {
      totalJobs: stats[0].totalJobs[0]?.count || 0,
      verifiedJobs: stats[0].verifiedJobs[0]?.count || 0,
      pendingJobs: stats[0].pendingJobs[0]?.count || 0,
      rejectedJobs: stats[0].rejectedJobs[0]?.count || 0,
      deletedJobs: stats[0].deletedJobs[0]?.count || 0,
      activeJobs: stats[0].activeJobs[0]?.count || 0,
    };

    res.status(200).json({ stats: result });
  } catch (error) {
    console.error("Error in getJobStatsForAdmin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getJobsByRecruiter = async (req, res) => {
  try {
    const jobs = await jobModel.aggregate([
      {
        $match: {
          postedBy: req.user._id,
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "company",
        },
      },
      {
        $unwind: {
          path: "$company",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "job",
          as: "applications",
        },
      },
      {
        $addFields: {
          applicantCount: { $size: "$applications" },
        },
      },
      {
        $project: {
          title: 1,
          location: 1,
          jobType: 1,
          salary: 1,
          createdAt: 1,
          isVerified: 1,
          status: 1,
          "company.name": 1,
          "company.logoUrl": 1,
          applicantCount: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    if (jobs.length === 0) {
      return res
        .status(200)
        .json({ message: "No jobs found for this recruiter", jobs: [] });
    }

    res.status(200).json({ jobs });
  } catch (error) {
    console.error("Error in getJobsByRecruiter:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createJob,
  updateJob,
  deleteJob,
  getAllJobs,
  getAllJobsForAdmin,
  verifyJob,
  getJobStatsForAdmin,
  getJobById,
  getJobsByRecruiter,
};
