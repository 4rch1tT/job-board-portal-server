const jobModel = require("../models/job.model");
const applicationModel = require("../models/application.model");
const uploadFileToCloudinary = require("../utils/uploadFileToCloudinary");

const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.user._id;

    const job = await jobModel.findOne({
      _id: jobId,
      isDeleted: false,
      isVerified: true,
    });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existing = await applicationModel.findOne({
      job: jobId,
      candidate: candidateId,
    });
    if (existing) {
      return res.status(409).json({ message: "Already applied" });
    }

    const { resume, coverLetter } = req.body;
    if (!resume || !resume.url || !resume.fileName || !resume.fileType) {
      return res.status(400).json({ message: "Incomplete resume data" });
    }

    const application = await applicationModel.create({
      job: jobId,
      candidate: candidateId,
      resume: {
        url: resume.url,
        fileName: resume.fileName,
        fileType: resume.fileType,
        uploadedAt: resume.uploadedAt || new Date(),
      },
      coverLetter,
      appliedAt: new Date(),
    });

    res.status(201).json({
      message: "Application submitted",
      applicationId: application._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await applicationModel
      .find({ candidate: req.user._id })
      .populate({
        path: "job",
        match: { isDeleted: false },
        select: "title location",
        populate: {
          path: "company",
          select: "name logoUrl",
        },
      })
      .sort({ appliedAt: -1 });
    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await jobModel.findById(jobId);
    if (!job || job.isDeleted || job.postedBy.toString() !== req.user._id) {
      return res.status(403).json({ message: "Unauthorized or not job found" });
    }

    const applications = await applicationModel
      .find({ job: jobId })
      .populate("candidate", "name email resume")
      .sort({ appliedAt: -1 });

    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const application = await applicationModel
      .findById(applicationId)
      .populate({
        path: "job",
        populate: {
          path: "company",
          select: "name logoUrl",
        },
        select: "title location postedBy",
      })
      .populate("candidate", "name email resume");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (
      userRole === "recruiter" &&
      application.job?.postedBy?.toString() !== userId
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to view this application" });
    }

    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: "Server error, error: error.message" });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const application = await applicationModel
      .findById(applicationId)
      .populate("job");
    if (!application || application.job.postedBy.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "Unauthorized or application not found" });
    }

    application.status = status;
    await application.save();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const candidateId = req.user._id;

    const application = await applicationModel.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "application not found" });
    }

    if (application.candidate.toString() !== candidateId) {
      return res.status(403).json({
        message: "You are not authorized to withdraw this application",
      });
    }

    if (application.status === "withdrawn") {
      return res
        .status(400)
        .json({ message: "Application is already withdrawn" });
    }

    application.status = "withdrawn";
    await application.save();

    res.status(200).json({ message: "Application withdrawn successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await applicationModel.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    await applicationModel.findByIdAndDelete(applicationId);

    res.status(200).json({ message: "Application deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const uploadResume = async (req, res) => {
  try {
    const result = await uploadFileToCloudinary(req.file.buffer, {
      folder: "resumes",
      public_id: `resume_${req.user._id}`,
      resource_type: "auto",
    });

    res
      .status(200)
      .json({
        url: result.secure_url,
        publicId: public_id,
        uploadedAt: new Date(),
      });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  deleteApplication,
  uploadResume,
};
