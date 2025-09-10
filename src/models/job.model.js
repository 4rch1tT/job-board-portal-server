const mongoose = require("mongoose");
const { jobLocations, jobCategories, jobTypes } = require("../utils/enums");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: [String] },
    skills: { type: [String] },
    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: "INR" },
    },
    location: { type: String, enum: jobLocations, required: true },
    category: {
      type: String,
      enum: jobCategories,
    },
    jobType: {
      type: String,
      enum: jobTypes,
      default: "full-time",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isVerified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deadline: { type: Date },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;
